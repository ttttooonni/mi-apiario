import assert from "node:assert/strict";
import test from "node:test";
import { makePersistedState, migratePersistedState, PERSISTED_VERSION } from "./migration";

test("migra el formato v1 conservando todos los datos", () => {
  const legacy = {
    apiaries: [{ id: "a1" }],
    colonies: [{ id: "c1", apiaryId: "a1" }],
    queens: [{ id: "q1", colonyId: "c1" }],
    actions: [{ id: "x1", colonyId: "c1" }],
    health: [{ id: "h1", colonyId: "c1" }],
    production: [{ id: "p1" }],
    yearCloses: [{ year: 2025 }],
    tasks: [{ id: "t1", colonyId: "c1" }],
    losses: [],
  };
  const result = migratePersistedState(legacy);
  assert.equal(result.version, PERSISTED_VERSION);
  assert.equal(result.migrated, true);
  assert.deepEqual(result.state, legacy);
});

test("el formato actual no vuelve a migrarse", () => {
  const state = {
    apiaries: [],
    colonies: [],
    queens: [],
    actions: [],
    health: [],
    production: [],
    yearCloses: [],
    tasks: [],
    losses: [],
  };
  const result = migratePersistedState(makePersistedState(state));
  assert.equal(result.migrated, false);
  assert.deepEqual(result.state, state);
});

test("una versión futura no se acepta silenciosamente", () => {
  assert.throws(() => migratePersistedState({ version: 99, data: {} }), /no compatible/);
});
