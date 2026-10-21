import assert from "node:assert/strict";
import test from "node:test";
import { findMissingCollections, MissingCollectionsError, missingCollectionsMessage } from "./backup-check.ts";
import { PreRestoreSnapshotError, savePreRestoreSnapshot, type SnapshotTarget } from "./restore-snapshot.ts";

function memoryTarget(name: string, opts: { quota?: boolean; corrupt?: boolean } = {}): SnapshotTarget & { stored: string | null } {
  const t = {
    name,
    stored: null as string | null,
    write(payload: string) {
      if (opts.quota) throw new DOMException("QuotaExceededError", "QuotaExceededError");
      t.stored = opts.corrupt ? payload.slice(0, -1) : payload;
    },
    read() { return t.stored; },
  };
  return t;
}

test("snapshot: se guarda y verifica en localStorage", async () => {
  const ls = memoryTarget("localStorage");
  assert.equal(await savePreRestoreSnapshot('{"a":1}', [ls]), "localStorage");
  assert.equal(ls.stored, '{"a":1}');
});

test("snapshot: si localStorage está lleno usa IndexedDB", async () => {
  const idb = memoryTarget("indexedDB");
  assert.equal(await savePreRestoreSnapshot("datos", [memoryTarget("localStorage", { quota: true }), idb]), "indexedDB");
  assert.equal(idb.stored, "datos");
});

test("snapshot: una relectura distinta no cuenta como copia válida", async () => {
  await assert.rejects(savePreRestoreSnapshot("datos", [memoryTarget("localStorage", { corrupt: true })]), PreRestoreSnapshotError);
});

test("snapshot: si no hay ningún destino válido se aborta con mensaje en español", async () => {
  await assert.rejects(
    savePreRestoreSnapshot("datos", [memoryTarget("localStorage", { quota: true }), memoryTarget("indexedDB", { quota: true })]),
    (error: Error) => error instanceof PreRestoreSnapshotError && /No se ha restaurado la copia/.test(error.message),
  );
});

test("copia v1 sin colecciones nuevas es legítima", () => {
  assert.deepEqual(findMissingCollections({ apiaries: [] }, 1), []);
});

test("copia actual (v2) sin colecciones se detecta", () => {
  const data = { apiaries: [], colonies: [], queens: [], actions: [], production: [], health: [], tasks: [] };
  assert.deepEqual(findMissingCollections(data, 2), ["yearCloses", "losses"]);
});

test("copia actual completa no avisa", () => {
  const data = { health: [], yearCloses: [], tasks: [], losses: [] };
  assert.deepEqual(findMissingCollections(data, 2), []);
});

test("el aviso lista en español lo que falta", () => {
  const msg = missingCollectionsMessage(["health", "losses"]);
  assert.match(msg, /sanidad, pérdidas de colonias/);
  const err = new MissingCollectionsError(["tasks"]);
  assert.deepEqual(err.missing, ["tasks"]);
  assert.match(err.message, /tareas/);
});
