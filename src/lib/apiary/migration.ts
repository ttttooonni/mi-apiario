import { EMPTY_STATE, type AppState } from "./types";

export const PERSISTED_VERSION = 3;

type LegacyState = Partial<AppState> & {
  version?: unknown;
  data?: unknown;
  app?: unknown;
};

function normalizeState(raw: LegacyState): AppState {
  const source = raw.data && typeof raw.data === "object" ? raw.data as LegacyState : raw;
  return {
    apiaries: Array.isArray(source.apiaries) ? source.apiaries : [],
    colonies: Array.isArray(source.colonies) ? source.colonies : [],
    queens: Array.isArray(source.queens) ? source.queens : [],
    actions: Array.isArray(source.actions) ? source.actions : [],
    health: Array.isArray(source.health) ? source.health : [],
    production: Array.isArray(source.production) ? source.production : [],
    yearCloses: Array.isArray(source.yearCloses) ? source.yearCloses : [],
    tasks: Array.isArray(source.tasks) ? source.tasks : [],
    losses: Array.isArray(source.losses) ? source.losses : [],
  };
}

/**
 * Universal reader for Mi Apiario data.
 *
 * It intentionally does not require an exact historical version number:
 * every older persisted/backup version is normalized to the current model.
 * Unknown fields inside records are preserved by the backup layer.
 */
export function migratePersistedState(raw: unknown): { state: AppState; version: number; migrated: boolean } {
  if (!raw || typeof raw !== "object") throw new Error("Los datos guardados no son válidos.");
  const candidate = raw as LegacyState;
  const source = candidate.data && typeof candidate.data === "object"
    ? candidate.data as LegacyState
    : candidate;

  const rawVersion = typeof candidate.version === "number" && Number.isFinite(candidate.version)
    ? candidate.version
    : 1;

  if (rawVersion > PERSISTED_VERSION) {
    throw new Error(`Los datos proceden de una versión más nueva (${rawVersion}) que esta aplicación no conoce todavía.`);
  }
  if (rawVersion < 1) {
    throw new Error(`Versión de datos no válida: ${String(rawVersion)}`);
  }

  return {
    state: normalizeState(source),
    version: rawVersion,
    migrated: rawVersion !== PERSISTED_VERSION,
  };
}

export function makePersistedState(state: AppState) {
  return { version: PERSISTED_VERSION, data: state };
}

export function emptyState(): AppState {
  return structuredClone(EMPTY_STATE);
}
