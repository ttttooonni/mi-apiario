// Colecciones que se añadieron después de la versión 1 del formato de copia.
// En las copias de versión 1 pueden faltar legítimamente; desde la versión 2 (DATA_VERSION actual),
// mi-apiario las exporta siempre, así que si faltan la copia está incompleta o manipulada.
export const LATER_COLLECTIONS = ["health", "yearCloses", "tasks", "losses"] as const;
export const COLLECTIONS_REQUIRED_SINCE_VERSION = 2;

export const COLLECTION_LABELS: Record<(typeof LATER_COLLECTIONS)[number], string> = {
  health: "sanidad",
  yearCloses: "cierres de año",
  tasks: "tareas",
  losses: "pérdidas de colonias",
};

export function findMissingCollections(data: unknown, version: number): string[] {
  if (version < COLLECTIONS_REQUIRED_SINCE_VERSION) return [];
  const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  return LATER_COLLECTIONS.filter((key) => !Array.isArray(record[key]));
}

export function missingCollectionsMessage(missing: string[]): string {
  const names = missing.map((key) => COLLECTION_LABELS[key as keyof typeof COLLECTION_LABELS] ?? key);
  return (
    `Esta copia parece incompleta: le falta ${names.join(", ")}. ` +
    "Si continúas, esos apartados quedarán vacíos y se perderán los que tienes ahora en el dispositivo. " +
    "¿Quieres restaurarla de todos modos?"
  );
}

export class MissingCollectionsError extends Error {
  readonly missing: string[];
  constructor(missing: string[]) {
    super(missingCollectionsMessage(missing));
    this.name = "MissingCollectionsError";
    this.missing = missing;
  }
}
