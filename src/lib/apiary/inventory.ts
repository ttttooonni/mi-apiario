import type { ColonyAction, FrameKind } from "./types";

export interface ColonyInventory {
  standardFrames: number;
  mediumFrames: number;
  supers: number;
}

/**
 * Derives material counts from the action ledger instead of storing multiple
 * mutable counters that can overwrite one another. Negative totals are kept
 * visible so inconsistent historical records are not silently hidden.
 */
export function inventoryForColony(actions: ColonyAction[], colonyId: string, adjustments?: { standardFrames?: number; mediumFrames?: number; supers?: number }): ColonyInventory {
  const inventory: ColonyInventory = { standardFrames: 0, mediumFrames: 0, supers: 0 };

  for (const action of actions) {
    if (action.colonyId !== colonyId) continue;

    if (
      (action.type === "add_frames" || action.type === "remove_frames") &&
      action.framesKind &&
      Number.isFinite(action.framesQty)
    ) {
      const sign = action.type === "add_frames" ? 1 : -1;
      addFrames(inventory, action.framesKind, sign * (action.framesQty ?? 0));
    }

    if (action.type === "add_super" || action.type === "remove_super") {
      const sign = action.type === "add_super" ? 1 : -1;
      inventory.supers += sign * (action.supersQty ?? 1);
    }
  }

  inventory.standardFrames += adjustments?.standardFrames ?? 0;
  inventory.mediumFrames += adjustments?.mediumFrames ?? 0;
  inventory.supers += adjustments?.supers ?? 0;

  return inventory;
}

function addFrames(inventory: ColonyInventory, kind: FrameKind, quantity: number): void {
  if (kind === "medium") inventory.mediumFrames += quantity;
  else inventory.standardFrames += quantity;
}
