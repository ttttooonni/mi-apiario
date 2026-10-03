import { currentYear, yearOf } from "./dates";
import { PRODUCT_ORDER } from "./labels";
import type {
  AppState,
  Colony,
  ColonyAction,
  ProductKind,
  ProductionRecord,
  Queen,
  YearClose,
} from "./types";

const actionIndexCache = new WeakMap<AppState, Map<string, ColonyAction[]>>();
const queenIndexCache = new WeakMap<AppState, Map<string, Queen[]>>();

function actionsByColony(state: AppState): Map<string, ColonyAction[]> {
  const hit = actionIndexCache.get(state);
  if (hit) return hit;
  const index = new Map<string, ColonyAction[]>();
  for (const action of state.actions) {
    const list = index.get(action.colonyId);
    if (list) list.push(action);
    else index.set(action.colonyId, [action]);
  }
  actionIndexCache.set(state, index);
  return index;
}

function queensByColony(state: AppState): Map<string, Queen[]> {
  const hit = queenIndexCache.get(state);
  if (hit) return hit;
  const index = new Map<string, Queen[]>();
  for (const queen of state.queens) {
    const list = index.get(queen.colonyId);
    if (list) list.push(queen);
    else index.set(queen.colonyId, [queen]);
  }
  queenIndexCache.set(state, index);
  return index;
}

export function sortColonies(colonies: Colony[]): Colony[] {
  return [...colonies].sort((a, b) =>
    a.number.localeCompare(b.number, "es", { numeric: true, sensitivity: "base" }),
  );
}

export function coloniesOf(state: AppState, apiaryId: string): Colony[] {
  return sortColonies(state.colonies.filter((item) => item.apiaryId === apiaryId));
}

export function hiveCount(state: AppState, apiaryId?: string): number {
  return state.colonies.filter(
    (item) => item.kind === "hive" && (apiaryId ? item.apiaryId === apiaryId : true),
  ).length;
}

export function nucCount(state: AppState, apiaryId?: string): number {
  return state.colonies.filter(
    (item) => item.kind === "nuc" && (apiaryId ? item.apiaryId === apiaryId : true),
  ).length;
}

export function currentQueen(state: AppState, colonyId: string): Queen | undefined {
  const list = queensByColony(state).get(colonyId);
  if (!list) return undefined;
  return list.find((queen) => !queen.retiredAt);
}

export function queenHistory(state: AppState, colonyId: string): Queen[] {
  const list = queensByColony(state).get(colonyId) ?? [];
  return [...list].sort((a, b) => b.introducedAt.localeCompare(a.introducedAt));
}

export function actionsOf(state: AppState, colonyId: string): ColonyAction[] {
  const list = actionsByColony(state).get(colonyId) ?? [];
  return [...list].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function lastAction(state: AppState, colonyId: string): ColonyAction | undefined {
  const list = actionsByColony(state).get(colonyId);
  if (!list || list.length === 0) return undefined;
  return list.reduce((best, action) =>
    action.date > best.date || (action.date === best.date && action.createdAt > best.createdAt)
      ? action
      : best,
  );
}

export function apiaryOf(state: AppState, id: string) {
  return state.apiaries.find((item) => item.id === id);
}

export function colonyOf(state: AppState, id: string) {
  return state.colonies.find((item) => item.id === id);
}

export function productionOfYear(
  records: ProductionRecord[],
  year: number,
): Record<ProductKind, number> {
  const totals = emptyProductTotals();
  for (const record of records) {
    if (yearOf(record.date) !== year) continue;
    totals[record.product] += record.quantity;
  }
  return totals;
}

export function emptyProductTotals(): Record<ProductKind, number> {
  return {
    honey: 0,
    propolis: 0,
    pollen: 0,
    wax: 0,
    royal_jelly: 0,
  };
}

export function honeyThisYear(state: AppState): number {
  return productionOfYear(state.production, currentYear()).honey;
}

export interface YearHistoryRow {
  year: number;
  hives: number | null;
  nucs: number | null;
  closed: YearClose | null;
  isCurrent: boolean;
  products: Record<ProductKind, number>;
}

export function yearlyHistory(state: AppState): YearHistoryRow[] {
  const yearNow = currentYear();
  const years = new Set<number>([yearNow]);
  for (const record of state.production) years.add(yearOf(record.date));
  for (const close of state.yearCloses) years.add(close.year);
  const closes = new Map(state.yearCloses.map((item) => [item.year, item]));

  return [...years]
    .sort((a, b) => b - a)
    .map((year) => {
      const closed = closes.get(year) ?? null;
      const isCurrent = year === yearNow;
      return {
        year,
        hives: isCurrent ? hiveCount(state) : (closed?.hives ?? null),
        nucs: isCurrent ? nucCount(state) : (closed?.nucs ?? null),
        closed,
        isCurrent,
        products: productionOfYear(state.production, year),
      };
    });
}

export { PRODUCT_ORDER };
