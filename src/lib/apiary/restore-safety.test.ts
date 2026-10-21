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

// --- Camino completo de restauración (decisión + copia previa + escritura) ---
import { applyMissingCollectionsDecision, runRestore } from "./restore-flow.ts";

const ALL = ["apiaries", "colonies", "queens", "actions", "health", "production", "yearCloses", "tasks", "losses"] as const;
type Store = Record<string, unknown[]>;

function fakeStore(): Store {
  return Object.fromEntries(ALL.map((k) => [k, [{ id: `old-${k}` }]]));
}

// Igual que writeWholeState: recorre cada colección; con undefined lanzaría TypeError.
function writeWhole(store: Store, next: Record<string, unknown>) {
  const staged: Store = {};
  for (const key of ALL) {
    const rows: unknown[] = [];
    for (const row of next[key] as unknown[]) rows.push(row);
    staged[key] = rows;
  }
  Object.assign(store, staged);
}

const incompleteV2 = { apiaries: [{ id: "a1" }], colonies: [], queens: [], actions: [], production: [], health: [{ id: "h1" }], tasks: [] };

async function restore(store: Store, data: Record<string, unknown>, version: number, accept: boolean, targets: SnapshotTarget[]) {
  const next = applyMissingCollectionsDecision(data, version, { allowMissingCollections: accept });
  await runRestore({ snapshotPayload: JSON.stringify(store), snapshotTargets: targets, write: () => writeWhole(store, next) });
}

test("restauración: copia v2 incompleta se rechaza sin aceptación y no toca nada", async () => {
  const store = fakeStore();
  const before = JSON.stringify(store);
  const ls = memoryTarget("localStorage");
  await assert.rejects(restore(store, incompleteV2, 2, false, [ls]), MissingCollectionsError);
  assert.equal(JSON.stringify(store), before);
  assert.equal(ls.stored, null, "ni siquiera se hace la copia previa");
});

test("restauración: tras aceptar, se completa sin excepción ni estado parcial", async () => {
  const store = fakeStore();
  const before = JSON.stringify(store);
  const ls = memoryTarget("localStorage");
  await restore(store, incompleteV2, 2, true, [ls]);
  assert.equal(ls.stored, before, "copia previa verificada del estado anterior");
  assert.deepEqual(store.apiaries, [{ id: "a1" }]);
  assert.deepEqual(store.health, [{ id: "h1" }]);
  assert.deepEqual(store.yearCloses, []);
  assert.deepEqual(store.losses, []);
  for (const key of ALL) assert.ok(Array.isArray(store[key]), key);
  assert.equal("yearCloses" in incompleteV2, false, "no se modifica el objeto de entrada");
});

test("restauración: copia v1 antigua se completa sin pedir confirmación", async () => {
  const store = fakeStore();
  await restore(store, { apiaries: [], colonies: [], queens: [], actions: [], production: [] }, 1, false, [memoryTarget("localStorage")]);
  assert.deepEqual(store.tasks, []);
});

test("restauración: si falla la copia previa, los datos actuales no cambian", async () => {
  const store = fakeStore();
  const before = JSON.stringify(store);
  await assert.rejects(
    restore(store, incompleteV2, 2, true, [memoryTarget("localStorage", { quota: true }), memoryTarget("indexedDB", { quota: true })]),
    PreRestoreSnapshotError,
  );
  assert.equal(JSON.stringify(store), before);
});
