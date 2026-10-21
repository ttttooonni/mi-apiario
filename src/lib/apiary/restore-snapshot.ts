// Copia de seguridad previa a una restauración. Es un requisito, no un "mejor esfuerzo":
// si no se puede guardar y releer en ningún sitio, la restauración no debe continuar.
export type SnapshotTarget = {
  name: string;
  write: (payload: string) => void | Promise<void>;
  read: () => string | null | undefined | Promise<string | null | undefined>;
};

export const PRE_RESTORE_FAILED_MESSAGE =
  "No se ha restaurado la copia: no se pudo guardar antes una copia de seguridad de tus datos actuales " +
  "(probablemente falta espacio en el dispositivo). Tus datos no se han tocado. " +
  "Descarga primero una copia desde «Guardar copia» y libera espacio antes de volver a intentarlo.";

export class PreRestoreSnapshotError extends Error {
  constructor() { super(PRE_RESTORE_FAILED_MESSAGE); this.name = "PreRestoreSnapshotError"; }
}

/** Guarda la copia en el primer destino que permita escribirla y releerla idéntica. */
export async function savePreRestoreSnapshot(payload: string, targets: SnapshotTarget[]): Promise<string> {
  for (const target of targets) {
    try {
      await target.write(payload);
      const back = await target.read();
      if (back === payload) return target.name;
    } catch { /* probamos el siguiente destino */ }
  }
  throw new PreRestoreSnapshotError();
}
