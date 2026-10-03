import type { AppState, YearClose } from "./types";

const LS_KEY = "mi-apiario:v1";
/** Typical browser localStorage ceiling is ~5 MB. Warn before we hit it. */
const SOFT_LIMIT_BYTES = 3_500_000;
const HARD_HINT_BYTES = 5_000_000;

export const STORE_NAMES = [
  "apiaries",
  "colonies",
  "queens",
  "actions",
  "health",
  "production",
  "yearCloses",
] as const;

type StoreName = (typeof STORE_NAMES)[number];

const STORE_KEYS: Record<StoreName, keyof AppState> = {
  apiaries: "apiaries",
  colonies: "colonies",
  queens: "queens",
  actions: "actions",
  health: "health",
  production: "production",
  yearCloses: "yearCloses",
};

export type PersistStatus = {
  ok: boolean;
  bytes: number;
  limit: number;
  nearLimit: boolean;
  failed: boolean;
};

let cache: AppState = emptyClone();
let hydrated = false;
let writeDepth = 0;
let persistDirty = false;
let lastBytes = 0;
let lastFailed = false;

function emptyClone(): AppState {
  return {
    apiaries: [],
    colonies: [],
    queens: [],
    actions: [],
    health: [],
    production: [],
    yearCloses: [],
  };
}

function cloneState(state: AppState): AppState {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(state);
    } catch {
      /* fall through */
    }
  }
  return JSON.parse(JSON.stringify(state)) as AppState;
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function loadFromLocalStorage(): AppState {
  if (typeof window === "undefined") return emptyClone();
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return emptyClone();
    lastBytes = byteLength(raw);
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      apiaries: Array.isArray(parsed.apiaries) ? parsed.apiaries : [],
      colonies: Array.isArray(parsed.colonies) ? parsed.colonies : [],
      queens: Array.isArray(parsed.queens) ? parsed.queens : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      health: Array.isArray(parsed.health) ? parsed.health : [],
      production: Array.isArray(parsed.production) ? parsed.production : [],
      yearCloses: Array.isArray(parsed.yearCloses) ? parsed.yearCloses : [],
    };
  } catch {
    return emptyClone();
  }
}

function persistNow(): boolean {
  persistDirty = false;
  if (typeof window === "undefined") {
    lastFailed = false;
    return true;
  }
  try {
    const raw = JSON.stringify(cache);
    lastBytes = byteLength(raw);
    window.localStorage.setItem(LS_KEY, raw);
    lastFailed = false;
    return true;
  } catch {
    lastFailed = true;
    return false;
  }
}

function touch(): void {
  persistDirty = true;
  if (writeDepth === 0) persistNow();
}

function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  cache = loadFromLocalStorage();
}

export function isIndexedDbAvailable(): boolean {
  return false;
}

export function getPersistStatus(): PersistStatus {
  hydrate();
  return {
    ok: !lastFailed,
    bytes: lastBytes,
    limit: HARD_HINT_BYTES,
    nearLimit: lastBytes >= SOFT_LIMIT_BYTES,
    failed: lastFailed,
  };
}

export function formatStorageSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB`;
}

/** Coalesce several writes into a single localStorage setItem. */
export async function runWrite<T>(fn: () => Promise<T> | T): Promise<T> {
  hydrate();
  writeDepth += 1;
  try {
    return await fn();
  } finally {
    writeDepth -= 1;
    if (writeDepth === 0 && persistDirty) persistNow();
  }
}

export async function loadState(): Promise<AppState> {
  hydrate();
  return cloneState(cache);
}

export async function replaceAll(state: AppState): Promise<void> {
  hydrate();
  cache = cloneState(state);
  persistNow();
}

export async function putRecord<T>(store: StoreName, row: T): Promise<void> {
  hydrate();
  const keyName = store === "yearCloses" ? "year" : "id";
  const list = cache[STORE_KEYS[store]] as unknown as Array<Record<string, unknown>>;
  const key = (row as Record<string, unknown>)[keyName];
  const index = list.findIndex((item) => item[keyName] === key);
  if (index >= 0) list[index] = row as Record<string, unknown>;
  else list.push(row as Record<string, unknown>);
  touch();
}

export async function deleteRecord(store: StoreName, id: IDBValidKey): Promise<void> {
  hydrate();
  switch (store) {
    case "apiaries":
      cache.apiaries = cache.apiaries.filter((item) => item.id !== id);
      break;
    case "colonies":
      cache.colonies = cache.colonies.filter((item) => item.id !== id);
      break;
    case "queens":
      cache.queens = cache.queens.filter((item) => item.id !== id);
      break;
    case "actions":
      cache.actions = cache.actions.filter((item) => item.id !== id);
      break;
    case "health":
      cache.health = cache.health.filter((item) => item.id !== id);
      break;
    case "production":
      cache.production = cache.production.filter((item) => item.id !== id);
      break;
    case "yearCloses":
      cache.yearCloses = cache.yearCloses.filter((item) => item.year !== id);
      break;
  }
  touch();
}

export async function deleteApiaryCascade(_state: AppState, apiaryId: string): Promise<void> {
  await runWrite(() => {
    const colonyIds = new Set(
      cache.colonies.filter((item) => item.apiaryId === apiaryId).map((item) => item.id),
    );
    cache.apiaries = cache.apiaries.filter((item) => item.id !== apiaryId);
    cache.colonies = cache.colonies.filter((item) => item.apiaryId !== apiaryId);
    cache.queens = cache.queens.filter((item) => !colonyIds.has(item.colonyId));
    cache.actions = cache.actions.filter((item) => !colonyIds.has(item.colonyId));
    cache.health = cache.health.filter((item) => !colonyIds.has(item.colonyId));
    persistDirty = true;
  });
}

export async function deleteColonyCascade(_state: AppState, colonyId: string): Promise<void> {
  await runWrite(() => {
    cache.colonies = cache.colonies.filter((item) => item.id !== colonyId);
    cache.queens = cache.queens.filter((item) => item.colonyId !== colonyId);
    cache.actions = cache.actions.filter((item) => item.colonyId !== colonyId);
    cache.health = cache.health.filter((item) => item.colonyId !== colonyId);
    persistDirty = true;
  });
}

export async function upsertYearClose(row: YearClose): Promise<void> {
  await putRecord("yearCloses", row);
}
