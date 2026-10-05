import assert from "node:assert/strict";
import test from "node:test";
import { parseBackup } from "./backup.ts";

const exportedAt = "2026-10-06T09:00:00.000Z";

test("restaura una copia con colecciones opcionales ausentes como arrays vacíos", () => {
  const raw = JSON.stringify({
    app: "mi-apiario",
    version: 2,
    exportedAt,
    data: {
      apiaries: [],
      colonies: [],
      queens: [],
      actions: [],
      production: [],
    },
  });

  const state = parseBackup(raw);

  assert.deepEqual(state.health, []);
  assert.deepEqual(state.yearCloses, []);
  assert.deepEqual(state.tasks, []);
  assert.deepEqual(state.losses, []);
});

test("rechaza una copia con una entidad incompleta", () => {
  const raw = JSON.stringify({
    app: "mi-apiario",
    version: 2,
    exportedAt,
    data: {
      apiaries: [{ id: "a1", name: "Apiario incompleto" }],
      colonies: [],
      queens: [],
      actions: [],
      production: [],
    },
  });

  assert.throws(() => parseBackup(raw), /formato de una copia/);
});

test("conserva campos nuevos de una entidad durante la importación", () => {
  const raw = JSON.stringify({
    app: "mi-apiario",
    version: 2,
    exportedAt,
    data: {
      apiaries: [{
        id: "a1",
        name: "Apiario",
        location: "",
        createdAt: exportedAt,
        updatedAt: exportedAt,
        campoNuevo: "conservar",
      }],
      colonies: [],
      queens: [],
      actions: [],
      production: [],
    },
  });

  const state = parseBackup(raw);

  assert.equal((state.apiaries[0] as unknown as Record<string, unknown>).campoNuevo, "conservar");
});
