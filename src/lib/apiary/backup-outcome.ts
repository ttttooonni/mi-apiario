// Qué hacer tras intentar guardar una copia. Un enlace de descarga iniciado NO garantiza
// que el archivo se haya guardado (el navegador puede bloquearlo sin avisar), así que en ese
// caso no se marca la copia como hecha hasta que la persona lo confirme.
export type BackupSaveResult = "saved" | "downloaded" | "copied" | "cancelled";

export type BackupOutcome =
  | { kind: "done"; message: string }
  | { kind: "confirm"; message: string }
  | { kind: "silent" };

export const DOWNLOAD_CONFIRM_MESSAGE = "¿Se ha guardado el archivo? Compruébalo en Descargas.";

export function backupOutcome(result: BackupSaveResult): BackupOutcome {
  switch (result) {
    case "saved": return { kind: "done", message: "Copia guardada en este dispositivo" };
    case "copied": return { kind: "done", message: "JSON copiado. Pégalo en un archivo .json para guardarlo." };
    case "downloaded": return { kind: "confirm", message: DOWNLOAD_CONFIRM_MESSAGE };
    case "cancelled": return { kind: "silent" };
  }
}

export type ConfirmAnswer = "yes" | "no" | "copy-ok" | "copy-failed" | "dismissed";

/** Solo una respuesta afirmativa o una copia al portapapeles correcta cuentan como copia hecha. */
export function shouldMarkBackupDone(answer: ConfirmAnswer): boolean {
  return answer === "yes" || answer === "copy-ok";
}
