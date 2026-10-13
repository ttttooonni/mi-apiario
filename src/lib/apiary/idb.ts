import type { AppState, YearClose } from "./types";
import { makePersistedState, migratePersistedState, PERSISTED_VERSION } from "./migration";

const DB_NAME = "mi-apiario";
const DB_VERSION = 1;
const LS_KEY = "mi-apiario:v1";
const PRE_MIGRATION_KEY = "mi-apiario:pre-migration:v1";

export const STORE_NAMES = [
  "apiaries", "colonies", "queens", "actions", "health",
  "production", "yearCloses", "tasks", "losses",
] as const;

export const PHOTO_STORE = "photos" as const;
const META_STORE = "meta" as const;
type StoreName = (typeof STORE_NAMES)[number];

export type PhotoRecord = {
  id: string;
  blob: Blob;
  mimeType: string;
  createdAt: string;
  apiaryId?: string;
  colonyId?: string;
  queenId?: string;
  caption?: string;
};

export type PersistStatus = {
  ok: boolean;
  bytes: number;
  limit: number;
  nearLimit: boolean;
  failed: boolean;
  corrupt: boolean;
  dataVersion: number;
};

let cache: AppState | null = null;
let hydrated = false;
let lastBytes = 0;
let lastLimit = 0;
let lastFailed = false;
let storageCorrupt = false;
let dbPromise: Promise<IDBDatabase> | null = null;

function emptyState(): AppState {
  return { apiaries: [], colonies: [], queens: [], actions: [], health: [], production: [], yearCloses: [], tasks: [], losses: [] };
}

function cloneState(state: AppState): AppState {
  if (typeof structuredClone === "function") return structuredClone(state);
  return JSON.parse(JSON.stringify(state)) as AppState;
}

function idbAvailable(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

function openDb(): Promise<IDBDatabase> {
  if (!idbAvailable()) return Promise.reject(new Error("IndexedDB no está disponible en este dispositivo."));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of STORE_NAMES) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: name === "yearCloses" ? "year" : "id" });
      }
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        const photos = db.createObjectStore(PHOTO_STORE, { keyPath: "id" });
        photos.createIndex("apiaryId", "apiaryId", { unique: false });
        photos.createIndex("colonyId", "colonyId", { unique: false });
        photos.createIndex("queenId", "queenId", { unique: false });
      }
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { dbPromise = null; reject(request.error ?? new Error("No se pudo abrir IndexedDB.")); };
  });
  return dbPromise;
}

async function readStore<S extends StoreName>(db: IDBDatabase, store: S): Promise<AppState[S]> {
  const tx = db.transaction(store, "readonly");
  const rows = await requestResult(tx.objectStore(store).getAll());
  await transactionDone(tx);
  return rows as AppState[S];
}

async function readAll(db: IDBDatabase): Promise<AppState> {
  const entries = await Promise.all(STORE_NAMES.map(async (store) => [store, await readStore(db, store)] as const));
  const state = emptyState();
  for (const [store, rows] of entries) (state[store] as unknown as unknown[]) = rows as unknown[];
  return state;
}

async function writeAll(db: IDBDatabase, state: AppState): Promise<void> {
  const tx = db.transaction([...STORE_NAMES, META_STORE], "readwrite");
  for (const store of STORE_NAMES) {
    const objectStore = tx.objectStore(store);
    objectStore.clear();
    for (const row of state[store] as unknown[]) objectStore.put(row);
  }
  tx.objectStore(META_STORE).put({ key: "dataVersion", value: PERSISTED_VERSION });
  await transactionDone(tx);
}

async function migrateLocalStorageIfNeeded(db: IDBDatabase): Promise<void> {
  const metaTx = db.transaction(META_STORE, "readonly");
  const migrated = await requestResult(metaTx.objectStore(META_STORE).get("localStorageMigrated"));
  await transactionDone(metaTx);
  if (migrated?.value === true) return;
  if (typeof window === "undefined") return;

  const raw = window.localStorage.getItem(LS_KEY);
  if (!raw) {
    const tx = db.transaction(META_STORE, "readwrite");
    tx.objectStore(META_STORE).put({ key: "localStorageMigrated", value: true });
    await transactionDone(tx);
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    const migratedState = migratePersistedState(parsed).state;
    await writeAll(db, migratedState);
    // Keep the original localStorage copy until the user has verified the new storage.
    try { window.localStorage.setItem(PRE_MIGRATION_KEY, raw); } catch { /* best effort */ }
    const tx = db.transaction(META_STORE, "readwrite");
    tx.objectStore(META_STORE).put({ key: "localStorageMigrated", value: true });
    await transactionDone(tx);
  } catch (error) {
    storageCorrupt = true;
    lastFailed = true;
    throw error instanceof Error ? error : new Error("No se pudieron migrar los datos locales.");
  }
}

async function ensureHydrated(): Promise<void> {
  if (hydrated) return;
  const db = await openDb();
  await migrateLocalStorageIfNeeded(db);
  cache = await readAll(db);
  hydrated = true;
}

async function persistState(state: AppState): Promise<void> {
  const db = await openDb();
  await writeAll(db, state);
  cache = cloneState(state);
  lastFailed = false;
}

async function estimateStorage(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return;
  try {
    const estimate = await navigator.storage.estimate();
    lastBytes = estimate.usage ?? 0;
    lastLimit = estimate.quota ?? 0;
  } catch { /* diagnostics only */ }
}

export function isIndexedDbAvailable(): boolean { return idbAvailable(); }

export function getPersistStatus(): PersistStatus {
  return {
    ok: !lastFailed && !storageCorrupt,
    bytes: lastBytes,
    limit: lastLimit,
    nearLimit: lastLimit > 0 ? lastBytes / lastLimit >= 0.8 : false,
    failed: lastFailed,
    corrupt: storageCorrupt,
    dataVersion: PERSISTED_VERSION,
  };
}

export function formatStorageSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB`;
}

export async function refreshStorageEstimate(): Promise<PersistStatus> {
  await estimateStorage();
  return getPersistStatus();
}

export async function loadState(): Promise<AppState> {
  await ensureHydrated();
  await estimateStorage();
  return cloneState(cache ?? emptyState());
}

export async function runWrite<T>(fn: () => Promise<T> | T): Promise<T> {
  await ensureHydrated();
  const before = cloneState(cache ?? emptyState());
  try {
    const result = await fn();
    await persistState(cache ?? emptyState());
    await estimateStorage();
    return result;
  } catch (error) {
    cache = before;
    lastFailed = true;
    throw error;
  }
}

export async function replaceAll(state: AppState): Promise<void> {
  await ensureHydrated();
  const db = await openDb();
  const tx = db.transaction([...STORE_NAMES, PHOTO_STORE, META_STORE], "readwrite");
  for (const store of STORE_NAMES) tx.objectStore(store).clear();
  tx.objectStore(PHOTO_STORE).clear();
  for (const store of STORE_NAMES) for (const row of state[store] as unknown[]) tx.objectStore(store).put(row);
  tx.objectStore(META_STORE).put({ key: "dataVersion", value: PERSISTED_VERSION });
  await transactionDone(tx);
  cache = cloneState(state);
  lastFailed = false;
  await estimateStorage();
}

export async function restoreFromBackup(state: AppState): Promise<void> {
  await replaceAll(state);
}

export async function putRecord<S extends StoreName>(store: S, row: AppState[S][number]): Promise<void> {
  await ensureHydrated();
  const db = await openDb();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).put(row);
  await transactionDone(tx);
  const collection = cache![store] as unknown as Array<AppState[S][number]>;
  const record = row as AppState[S][number] & { id?: string; year?: number };
  const key = store === "yearCloses" ? record.year : record.id;
  const index = collection.findIndex((item) => {
    const candidate = item as AppState[S][number] & { id?: string; year?: number };
    return (store === "yearCloses" ? candidate.year : candidate.id) === key;
  });
  if (index >= 0) collection[index] = cloneState({ ...emptyState(), [store]: [row] } as AppState)[store][0] as AppState[S][number];
  else collection.push(row);
  lastFailed = false;
  await estimateStorage();
}

export async function deleteRecord(store: StoreName, id: IDBValidKey): Promise<void> {
  await ensureHydrated();
  const db = await openDb();
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).delete(id);
  await transactionDone(tx);
  if (store === "yearCloses") cache!.yearCloses = cache!.yearCloses.filter((item) => item.year !== id);
  else (cache![store] as unknown as Array<{ id: string }>) = (cache![store] as unknown as Array<{ id: string }>).filter((item) => item.id !== id);
  lastFailed = false;
  await estimateStorage();
}

export async function deleteApiaryCascade(_state: AppState, apiaryId: string): Promise<void> {
  await runWrite(() => {
    const colonyIds = new Set(cache!.colonies.filter((item) => item.apiaryId === apiaryId).map((item) => item.id));
    cache!.apiaries = cache!.apiaries.filter((item) => item.id !== apiaryId);
    cache!.colonies = cache!.colonies.filter((item) => item.apiaryId !== apiaryId);
    cache!.queens = cache!.queens.filter((item) => !colonyIds.has(item.colonyId));
    cache!.actions = cache!.actions.filter((item) => !colonyIds.has(item.colonyId));
    cache!.health = cache!.health.filter((item) => !colonyIds.has(item.colonyId));
    cache!.tasks = cache!.tasks.filter((item) => !colonyIds.has(item.colonyId));
  });
}

export async function deleteColonyCascade(_state: AppState, colonyId: string): Promise<void> {
  await runWrite(() => {
    cache!.colonies = cache!.colonies.filter((item) => item.id !== colonyId);
    cache!.queens = cache!.queens.filter((item) => item.colonyId !== colonyId);
    cache!.actions = cache!.actions.filter((item) => item.colonyId !== colonyId);
    cache!.health = cache!.health.filter((item) => item.colonyId !== colonyId);
    cache!.tasks = cache!.tasks.filter((item) => item.colonyId !== colonyId);
  });
}

export async function getRecord<S extends StoreName>(store: S, id: IDBValidKey): Promise<AppState[S][number] | undefined> {
  const db = await openDb();
  const tx = db.transaction(store, "readonly");
  const row = await requestResult(tx.objectStore(store).get(id));
  await transactionDone(tx);
  return row as AppState[S][number] | undefined;
}

export async function getRecordsByIndex<S extends StoreName>(
  store: S,
  indexName: string,
  value: IDBValidKey,
): Promise<AppState[S]> {
  const db = await openDb();
  const tx = db.transaction(store, "readonly");
  const index = tx.objectStore(store).index(indexName);
  const rows = await requestResult(index.getAll(value));
  await transactionDone(tx);
  return rows as AppState[S];
}

export async function upsertYearClose(row: YearClose): Promise<void> { await putRecord("yearCloses", row); }

export async function savePhoto(photo: PhotoRecord): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(PHOTO_STORE, "readwrite");
  tx.objectStore(PHOTO_STORE).put(photo);
  await transactionDone(tx);
  await estimateStorage();
}

export async function getPhoto(id: string): Promise<PhotoRecord | undefined> {
  const db = await openDb();
  const tx = db.transaction(PHOTO_STORE, "readonly");
  const row = await requestResult(tx.objectStore(PHOTO_STORE).get(id));
  await transactionDone(tx);
  return row as PhotoRecord | undefined;
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(PHOTO_STORE, "readwrite");
  tx.objectStore(PHOTO_STORE).delete(id);
  await transactionDone(tx);
  await estimateStorage();
}

export async function listPhotos(filter?: { apiaryId?: string; colonyId?: string; queenId?: string }): Promise<PhotoRecord[]> {
  const db = await openDb();
  const tx = db.transaction(PHOTO_STORE, "readonly");
  const store = tx.objectStore(PHOTO_STORE);
  let rows: PhotoRecord[];
  if (filter?.colonyId) rows = await requestResult(store.index("colonyId").getAll(filter.colonyId)) as PhotoRecord[];
  else if (filter?.apiaryId) rows = await requestResult(store.index("apiaryId").getAll(filter.apiaryId)) as PhotoRecord[];
  else if (filter?.queenId) rows = await requestResult(store.index("queenId").getAll(filter.queenId)) as PhotoRecord[];
  else rows = await requestResult(store.getAll()) as PhotoRecord[];
  await transactionDone(tx);
  return rows;
}
