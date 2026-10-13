import { currentQueen } from "./selectors";
import { deleteRecord, loadState, transactionWrite } from "./idb";
import { newId, nowIso } from "./dates";
import { isLegacyHealthId, legacyActionId } from "./health";
import type { ColonyAction, HealthRecord } from "./types";

/** Persists an action and applies side effects (reina, traslado) atomically. */
export async function commitAction(action: ColonyAction): Promise<void> {
  const state = await loadState();
  await transactionWrite(["actions", "queens", "colonies"], (tx) => {
    if (action.type === "change_queen") {
      const current = currentQueen(state, action.colonyId);
      if (current) tx.objectStore("queens").put({ ...current, retiredAt: action.date, retireReason: action.queenRetireReason });
      tx.objectStore("queens").put({
        id: newId(), colonyId: action.colonyId,
        introducedAt: action.queenIntroducedAt || action.date, origin: action.queenOrigin,
      });
    }
    if (action.type === "move" && action.moveToApiaryId) {
      const colony = state.colonies.find((item) => item.id === action.colonyId);
      if (colony) tx.objectStore("colonies").put({ ...colony, apiaryId: action.moveToApiaryId, updatedAt: nowIso() });
    }
    tx.objectStore("actions").put(action);
  });
}

export async function commitHealth(row: HealthRecord): Promise<void> {
  await transactionWrite(["health"], (tx) => { tx.objectStore("health").put(row); });
}

export async function commitHealthMany(rows: HealthRecord[]): Promise<void> {
  await transactionWrite(["health"], (tx) => {
    for (const row of rows) tx.objectStore("health").put(row);
  });
}

export async function removeHealth(id: string): Promise<void> {
  const state = await loadState();
  if (isLegacyHealthId(id)) {
    await deleteRecord("actions", legacyActionId(id));
    return;
  }
  const row = (state.health ?? []).find((item) => item.id === id);
  const stores: ("health" | "actions")[] = ["health"];
  if (row?.actionId) stores.push("actions");
  await transactionWrite(stores, (tx) => {
    tx.objectStore("health").delete(id);
    if (row?.actionId) tx.objectStore("actions").delete(row.actionId);
  });
}

export async function removeAction(id: string): Promise<void> {
  const state = await loadState();
  const linked = (state.health ?? []).filter((item) => item.actionId === id);
  await transactionWrite(["actions", "health"], (tx) => {
    tx.objectStore("actions").delete(id);
    for (const row of linked) {
      const health = { ...row };
      delete health.actionId;
      tx.objectStore("health").put(health);
    }
  });
}
