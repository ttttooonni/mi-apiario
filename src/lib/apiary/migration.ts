import { EMPTY_STATE, type AppState } from "./types";

export const PERSISTED_VERSION = 2;

type LegacyState = Partial<AppState> & { version?: unknown; data?: unknown };

function normalizeState(raw: LegacyState): AppState {
  return {
    apiaries: Array.isArray(raw.apiaries) ? raw.apiaries : [],
    colonies: Array.isArray(raw.colonies) ? raw.colonies : [],
    queens: Array.isArray(raw.queens) ? raw.queens : [],
    actions: Array.isArray(raw.actions) ? raw.actions : [],
    health: Array.isArray(raw.health) ? raw.health : [],
    production: Array.isArray(raw.production) ? raw.production : [],
    yearCloses: Array.isArray(raw.yearCloses) ? raw.yearCloses : [],
    tasks: Array.isArray(raw.tasks) ? raw.tasks : [],
    losses: Array.isArray(raw.losses) ? raw.losses : [],
  };
}

export function migratePersistedState(raw: unknown): { state: AppState; version: number; migrated: boolean } {
  if (!raw || typeof raw !== "object") throw new Error("Los datos guardados no son válidos.");
  const candidate = raw as LegacyState;

  if (candidate.version === PERSISTED_VERSION && candidate.data && typeof candidate.data === "object") {
    return { state: normalizeState(candidate.data as LegacyState), version: PERSISTED_VERSION, migrated: false };
  }

  if (candidate.version === 1 || candidate.version === undefined) {
    return { state: normalizeState(candidate), version: PERSISTED_VERSION, migrated: true };
  }

  throw new Error(`Versión de datos no compatible: ${String(candidate.version)}`);
}

export function makePersistedState(state: AppState) {
  return { version: PERSISTED_VERSION, data: state };
}

export function emptyState(): AppState {
  return structuredClone(EMPTY_STATE);
}
