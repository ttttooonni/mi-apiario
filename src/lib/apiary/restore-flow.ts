import { findMissingCollections, LATER_COLLECTIONS, MissingCollectionsError } from "./backup-check.ts";
import { savePreRestoreSnapshot, type SnapshotTarget } from "./restore-snapshot.ts";

export type CollectionDecisionOptions = { allowMissingCollections?: boolean };

/**
 * Decide qué hacer con las colecciones ausentes de una copia.
 * - Versión antigua (v1): se completan con [] (formato anterior, legítimo).
 * - Versión actual sin aceptación: se rechaza con MissingCollectionsError y no se toca nada.
 * - Versión actual con aceptación explícita: se completan con [] para que la restauración sea total.
 * Devuelve una copia nueva; nunca modifica el objeto recibido.
 */
export function applyMissingCollectionsDecision<T extends Record<string, unknown>>(
  data: T,
  version: number,
  options: CollectionDecisionOptions = {},
): T {
  const missing = findMissingCollections(data, version);
  if (missing.length > 0 && !options.allowMissingCollections) throw new MissingCollectionsError(missing);
  const out: Record<string, unknown> = { ...data };
  for (const key of LATER_COLLECTIONS) if (!Array.isArray(out[key])) out[key] = [];
  return out as T;
}

/** Copia previa verificada y, solo si se ha guardado, escritura del nuevo estado. */
export async function runRestore(params: {
  snapshotPayload: string | null;
  snapshotTargets: SnapshotTarget[];
  write: () => void | Promise<void>;
}): Promise<void> {
  if (params.snapshotPayload !== null) await savePreRestoreSnapshot(params.snapshotPayload, params.snapshotTargets);
  await params.write();
}
