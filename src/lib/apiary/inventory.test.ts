import assert from "node:assert/strict";
import test from "node:test";
import { inventoryForColony } from "./inventory.ts";
import type { ColonyAction } from "./types.ts";

function action(id: string, type: ColonyAction["type"], extra: Partial<ColonyAction> = {}): ColonyAction {
  return { id, colonyId: "hive-1", type, date: "2026-10-04", createdAt: "2026-10-04T12:00:00.000Z", ...extra };
}

test("adding a super changes only the super count, never frame counts", () => {
  const result = inventoryForColony([
    action("a1", "add_frames", { framesKind: "standard", framesQty: 8 }),
    action("a2", "add_super", { supersQty: 2 }),
  ], "hive-1");
  assert.deepEqual(result, { standardFrames: 8, mediumFrames: 0, supers: 2 });
});

test("frame kinds and supers remain independent through additions and removals", () => {
  const result = inventoryForColony([
    action("a1", "add_frames", { framesKind: "standard", framesQty: 10 }),
    action("a2", "add_frames", { framesKind: "medium", framesQty: 5 }),
    action("a3", "remove_frames", { framesKind: "standard", framesQty: 2 }),
    action("a4", "add_super", { supersQty: 3 }),
    action("a5", "remove_super", { supersQty: 1 }),
  ], "hive-1");
  assert.deepEqual(result, { standardFrames: 8, mediumFrames: 5, supers: 2 });
});

test("actions for another colony do not affect this colony's inventory", () => {
  const result = inventoryForColony([
    action("a1", "add_super", { supersQty: 2 }),
    action("a2", "add_frames", { colonyId: "hive-2", framesKind: "standard", framesQty: 12 }),
  ], "hive-1");
  assert.deepEqual(result, { standardFrames: 0, mediumFrames: 0, supers: 2 });
});

test("legacy super actions without a quantity count as one super", () => {
  const result = inventoryForColony([action("a1", "add_super")], "hive-1");
  assert.equal(result.supers, 1);
});
