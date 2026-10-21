import assert from "node:assert/strict";
import test from "node:test";
import { backupOutcome, DOWNLOAD_CONFIRM_MESSAGE, shouldMarkBackupDone } from "./backup-outcome.ts";

test("guardado con el selector de archivos cuenta como copia hecha", () => {
  assert.equal(backupOutcome("saved").kind, "done");
});

test("copia al portapapeles (iframe) cuenta como copia hecha", () => {
  assert.equal(backupOutcome("copied").kind, "done");
});

test("descarga iniciada pide confirmación y no marca la copia", () => {
  assert.deepEqual(backupOutcome("downloaded"), { kind: "confirm", message: DOWNLOAD_CONFIRM_MESSAGE });
  assert.match(DOWNLOAD_CONFIRM_MESSAGE, /Descargas/);
});

test("cancelar es silencioso", () => {
  assert.deepEqual(backupOutcome("cancelled"), { kind: "silent" });
});

test("solo Sí o una copia al portapapeles correcta marcan la copia", () => {
  assert.equal(shouldMarkBackupDone("yes"), true);
  assert.equal(shouldMarkBackupDone("copy-ok"), true);
  assert.equal(shouldMarkBackupDone("no"), false);
  assert.equal(shouldMarkBackupDone("copy-failed"), false);
  assert.equal(shouldMarkBackupDone("dismissed"), false);
});
