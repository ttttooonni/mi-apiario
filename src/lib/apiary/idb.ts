import type { AppState, YearClose } from "./types";
import { makePersistedState, migratePersistedState, PERSISTED_VERSION } from "./migration";

const LS_KEY = "mi-apiario:v1";
const PRE_MIGRATION_KEY = "mi-apiario:pre-migration:v1";
const PRE_RESTORE_KEY = "mi-apiario:pre-restore:v1";
const DB_NAME = "mi-apiario";
const DB_VERSION = 1;
const META_STORE = "_meta";
const MIGRATION_KEY = "localStorageMigrated";
const SOFT_LIMIT_BYTES = 3_500_000;
const HARD_HINT_BYTES = 5_000_000;

export const STORE_NAMES = [
  "apiaries", "colonies", "queens", "actions", "health",
  "production", "yearCloses", "tasks", "losses",
] as const;

type StoreName = (typeof STORE_NAMES)[number];

const STORE_KEYS: Record<StoreName, keyof AppState> = {
  apiaries: "apiaries", colonies: "colonies", queens: "queens", actions: "actions",
  health: "health", production: "production", yearCloses: "yearCloses", tasks: "tasks", losses: "losses",
};

type PersistedRow = Record<string, unknown> & { id?: string; year?: number };

export type PersistStatus = {
  ok: boolean;
  bytes: number;
  limit: number;
  nearLimit: boolean;
  failed: boolean;
  corrupt: boolean;
  dataVersion: number;
};

let cache: AppState = emptyClone();
let hydrated = false;
let hydrating: Promise<void> | null = null;
let writeDepth = 0;
let persistDirty = false;
let lastBytes = 0;
let lastFailed = false;
let storageCorrupt = false;
let dataVersion = PERSISTED_VERSION;
let dbPromise: Promise<IDBDatabase> | null = null;

function emptyClone(): AppState {
  return {
    apiaries: [], colonies: [], queens: [], actions: [], health: [],
    production: [], yearCloses: [], tasks: [], losses: [],
  };
}

function cloneState(state: AppState): AppState {
  if (typeof structuredClone === "function") {
    try { return structuredClone(state); } catch { /* fallback below */ }
  }
  return JSON.parse(JSON.stringify(state)) as AppState;
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function isIndexedDbAvailable(): boolean {
  return isBrowser() && typeof window.indexedDB !== "undefined";
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Error de IndexedDB."));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Error de transacción IndexedDB."));
    tx.onabort = () => reject(tx.error ?? new Error("Transacción IndexedDB cancelada."));
  });
}

function openDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDbAvailable()) return Promise.reject(new Error("IndexedDB no está disponible."));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of STORE_NAMES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: store === "yearCloses" ? "year" : "id" });
        }
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("No se pudo abrir IndexedDB."));
    req.onblocked = () => reject(new Error("IndexedDB está bloqueado por otra pestaña."));
  });
  return dbPromise;
}

async function readAllFromDb(db: IDBDatabase): Promise<AppState> {
  const tx = db.transaction([...STORE_NAMES], "readonly");
  const rows = await Promise.all(STORE_NAMES.map(async store => {
    const values = await request(tx.objectStore(store).getAll());
    return [store, values] as const;
  }));
  await transactionDone(tx);
  const state = emptyClone();
  for (const [store, values] of rows) {
    state[STORE_KEYS[store]] = values as never;
  }
  return state;
}

async function isMigrated(db: IDBDatabase): Promise<boolean> {
  const tx = db.transaction([META_STORE], "readonly");
  const row = await request(tx.objectStore(META_STORE).get(MIGRATION_KEY)) as { key: string; value: boolean } | undefined;
  await transactionDone(tx);
  return row?.value === true;
}

async function markMigrated(db: IDBDatabase): Promise<void> {
  const tx = db.transaction([META_STORE], "readwrite");
  tx.objectStore(META_STORE).put({ key: MIGRATION_KEY, value: true, migratedAt: new Date().toISOString() });
  await transactionDone(tx);
}

async function writeWholeState(db: IDBDatabase, state: AppState, clearFirst = false): Promise<void> {
  const tx = db.transaction([...STORE_NAMES], "readwrite");
  for (const store of STORE_NAMES) {
    const objectStore = tx.objectStore(store);
    if (clearFirst) objectStore.clear();
    const collection = state[STORE_KEYS[store]] as unknown as PersistedRow[];
    for (const row of collection) objectStore.put(row);
  }
  await transactionDone(tx);
}

async function clearWholeState(db: IDBDatabase): Promise<void> {
  const tx = db.transaction([...STORE_NAMES], "readwrite");
  for (const store of STORE_NAMES) tx.objectStore(store).clear();
  await transactionDone(tx);
}

function loadLegacyLocalStorage(): AppState | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(LS_KEY);
  if (!raw) return null;
  lastBytes = byteLength(raw);
  try {
    const migrated = migratePersistedState(JSON.parse(raw));
    dataVersion = migrated.version;
    storageCorrupt = false;
    lastFailed = false;
    if (migrated.migrated) {
      try { window.localStorage.setItem(PRE_MIGRATION_KEY, raw); } catch { /* best effort */ }
    }
    return migrated.state;
  } catch (error) {
    storageCorrupt = true;
    lastFailed = true;
    throw error instanceof Error ? error : new Error("No se pudieron leer los datos guardados.");
  }
}

async function hydrateIndexedDb(): Promise<void> {
  const db = await openDatabase();
  if (!(await isMigrated(db))) {
    const legacy = loadLegacyLocalStorage();
    if (legacy) {
      // Migración única: primero escribimos todo en IndexedDB y solo después
      // marcamos la migración como completada. El localStorage original se conserva.
      await writeWholeState(db, legacy, true);
      await markMigrated(db);
      cache = cloneState(legacy);
    } else {
      await markMigrated(db);
      cache = emptyClone();
    }
  } else {
    cache = await readAllFromDb(db);
  }
  hydrated = true;
  lastFailed = false;
  storageCorrupt = false;
  lastBytes = byteLength(JSON.stringify(cache));
}

async function hydrateLegacy(): Promise<void> {
  hydrated = true;
  cache = loadLegacyLocalStorage() ?? emptyClone();
}

async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (hydrating) return hydrating;
  hydrating = (isIndexedDbAvailable() ? hydrateIndexedDb() : hydrateLegacy())
    .catch(error => {
      lastFailed = true;
      throw error;
    })
    .finally(() => { hydrating = null; });
  return hydrating;
}

export function getPersistStatus(): PersistStatus {
  return {
    ok: !lastFailed,
    bytes: lastBytes,
    limit: HARD_HINT_BYTES,
    nearLimit: lastBytes >= SOFT_LIMIT_BYTES,
    failed: lastFailed,
    corrupt: storageCorrupt,
    dataVersion,
  };
}

export function formatStorageSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB`;
}

async function persistNow(): Promise<boolean> {
  persistDirty = false;
  if (storageCorrupt) {
    lastFailed = true;
    return false;
  }
  try {
    if (isIndexedDbAvailable()) {
      const db = await openDatabase();
      await writeWholeState(db, cache, true);
      await markMigrated(db);
    } else if (isBrowser()) {
      const raw = JSON.stringify(makePersistedState(cache));
      window.localStorage.setItem(LS_KEY, raw);
    }
    lastBytes = byteLength(JSON.stringify(cache));
    lastFailed = false;
    dataVersion = PERSISTED_VERSION;
    return true;
  } catch {
    lastFailed = true;
    return false;
  }
}

function touch(): void {
  persistDirty = true;
}

export async function runWrite<T>(fn: () => Promise<T> | T): Promise<T> {
  await hydrate();
  const rootWrite = writeDepth === 0;
  const before = rootWrite ? cloneState(cache) : null;
  writeDepth += 1;
  try {
    const result = await fn();
    return result;
  } finally {
    writeDepth -= 1;
    if (rootWrite && persistDirty) {
      if (writeDepth !== 0) return;
      if (!(await persistNow())) {
        cache = before ?? cache;
        persistDirty = false;
        throw new Error("No se pudo guardar el cambio. Los datos anteriores se han conservado.");
      }
    }
  }
}

export async function loadState(): Promise<AppState> {
  await hydrate();
  return cloneState(cache);
}

export async function replaceAll(state: AppState): Promise<void> {
  await runWrite(() => { cache = cloneState(state); touch(); });
}

export async function restoreFromBackup(state: AppState): Promise<void> {
  await hydrate();
  if (isIndexedDbAvailable()) {
    const db = await openDatabase();
    // El estado actual queda en localStorage como red de seguridad antes de sustituirlo.
    if (isBrowser()) {
      try {
        const current = JSON.stringify(makePersistedState(cache));
        window.localStorage.setItem(PRE_RESTORE_KEY, current);
      } catch { /* best effort */ }
    }
    try {
      await writeWholeState(db, state, true);
      await markMigrated(db);
    } catch {
      lastFailed = true;
      throw new Error("No se pudo restaurar la copia. Los datos anteriores se han conservado.");
    }
  } else if (isBrowser()) {
    try {
      const currentRaw = window.localStorage.getItem(LS_KEY);
      if (currentRaw) window.localStorage.setItem(PRE_RESTORE_KEY, currentRaw);
      window.localStorage.setItem(LS_KEY, JSON.stringify(makePersistedState(state)));
    } catch {
      lastFailed = true;
      throw new Error("No se pudo restaurar la copia. Los datos anteriores se han conservado.");
    }
  }
  cache = cloneState(state);
  storageCorrupt = false;
  lastFailed = false;
  lastBytes = byteLength(JSON.stringify(cache));
  hydrated = true;
  dataVersion = PERSISTED_VERSION;
  persistDirty = false;
}

export async function putRecord<S extends StoreName>(
  store: S,
  row: AppState[S][number],
): Promise<void> {
  await runWrite(() => {
    const collection = cache[STORE_KEYS[store]] as Array<AppState[S][number]>;
    const record = row as AppState[S][number] & { id?: string; year?: number };
    const key = store === "yearCloses" ? record.year : record.id;
    const index = collection.findIndex(item => {
      const candidate = item as AppState[S][number] & { id?: string; year?: number };
      return (store === "yearCloses" ? candidate.year : candidate.id) === key;
    });
    if (index >= 0) collection[index] = row;
    else collection.push(row);
    touch();
  });
}

export async function deleteRecord(store: StoreName, id: IDBValidKey): Promise<void> {
  await runWrite(() => {
    switch (store) {
      case "apiaries": cache.apiaries = cache.apiaries.filter(item => item.id !== id); break;
      case "colonies": cache.colonies = cache.colonies.filter(item => item.id !== id); break;
      case "queens": cache.queens = cache.queens.filter(item => item.id !== id); break;
      case "actions": cache.actions = cache.actions.filter(item => item.id !== id); break;
      case "health": cache.health = cache.health.filter(item => item.id !== id); break;
      case "production": cache.production = cache.production.filter(item => item.id !== id); break;
      case "yearCloses": cache.yearCloses = cache.yearCloses.filter(item => item.year !== id); break;
      case "tasks": cache.tasks = cache.tasks.filter(item => item.id !== id); break;
      case "losses": cache.losses = cache.losses.filter(item => item.id !== id); break;
    }
    touch();
  });
}

export async function deleteApiaryCascade(_state: AppState, apiaryId: string): Promise<void> {
  await runWrite(() => {
    const colonyIds = new Set(cache.colonies.filter(item => item.apiaryId === apiaryId).map(item => item.id));
    cache.apiaries = cache.apiaries.filter(item => item.id !== apiaryId);
    cache.colonies = cache.colonies.filter(item => item.apiaryId !== apiaryId);
    cache.queens = cache.queens.filter(item => !colonyIds.has(item.colonyId));
    cache.actions = cache.actions.filter(item => !colonyIds.has(item.colonyId));
    cache.health = cache.health.filter(item => !colonyIds.has(item.colonyId));
    cache.tasks = cache.tasks.filter(item => !colonyIds.has(item.colonyId));
    // Las pérdidas forman parte del histórico y nunca se borran al eliminar un apiario.
    touch();
  });
}

export async function deleteColonyCascade(_state: AppState, colonyId: string): Promise<void> {
  await runWrite(() => {
    cache.colonies = cache.colonies.filter(item => item.id !== colonyId);
    cache.queens = cache.queens.filter(item => item.colonyId !== colonyId);
    cache.actions = cache.actions.filter(item => item.colonyId !== colonyId);
    cache.health = cache.health.filter(item => item.colonyId !== colonyId);
    cache.tasks = cache.tasks.filter(item => item.colonyId !== colonyId);
    touch();
  });
}

export async function upsertYearClose(row: YearClose): Promise<void> {
  await putRecord("yearCloses", row);
}
