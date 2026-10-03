import type {
  ActionType,
  AppState,
  ColonyAction,
  ColonyKind,
  FrameKind,
  ProductKind,
} from "./types";

export const ACTION_TYPES: { id: ActionType; label: string }[] = [
  { id: "inspection", label: "Inspección" },
  { id: "harvest", label: "Cosecha" },
  { id: "change_queen", label: "Cambio de reina" },
  { id: "add_frames", label: "Añadir cuadros" },
  { id: "remove_frames", label: "Retirar cuadros" },
  { id: "add_super", label: "Añadir alza" },
  { id: "remove_super", label: "Retirar alza" },
  { id: "treatment", label: "Tratamiento" },
  { id: "split", label: "Dividir colmena" },
  { id: "create_nuc", label: "Crear núcleo" },
  { id: "move", label: "Mover colmena" },
  { id: "note", label: "Nota" },
];

export const ACTION_LABEL: Record<ActionType, string> = Object.fromEntries(
  ACTION_TYPES.map((item) => [item.id, item.label]),
) as Record<ActionType, string>;

export const FRAME_KIND_LABEL: Record<FrameKind, string> = {
  standard: "Normal",
  medium: "Media alza",
};

export const PRODUCT_LABEL: Record<ProductKind, string> = {
  honey: "Miel",
  propolis: "Propóleo",
  pollen: "Polen",
  wax: "Cera",
  royal_jelly: "Jalea real",
};

export const PRODUCT_PREFIX: Record<ProductKind, string> = {
  honey: "M",
  propolis: "PR",
  pollen: "P",
  wax: "C",
  royal_jelly: "JR",
};

export const PRODUCT_ORDER: ProductKind[] = [
  "honey",
  "propolis",
  "pollen",
  "wax",
  "royal_jelly",
];

export const COLONY_KIND_LABEL: Record<ColonyKind, string> = {
  hive: "Colmena",
  nuc: "Núcleo",
};

export function framesPhrase(kind: FrameKind, qty: number): string {
  const noun = kind === "medium" ? "cuadros de media alza" : "cuadros normales";
  return `${qty} ${noun}`;
}

export function actionSummary(action: ColonyAction, state: AppState): string | null {
  switch (action.type) {
    case "add_frames":
      if (!action.framesQty || !action.framesKind) return null;
      return `Añadió ${framesPhrase(action.framesKind, action.framesQty)}`;
    case "remove_frames":
      if (!action.framesQty || !action.framesKind) return null;
      return `Retiró ${framesPhrase(action.framesKind, action.framesQty)}`;
    case "add_super":
      return action.supersQty
        ? `Añadió ${action.supersQty} ${action.supersQty === 1 ? "alza" : "alzas"}`
        : "Añadió alza";
    case "remove_super":
      return action.supersQty
        ? `Retiró ${action.supersQty} ${action.supersQty === 1 ? "alza" : "alzas"}`
        : "Retiró alza";
    case "treatment":
      return action.treatmentProduct ? `Producto: ${action.treatmentProduct}` : null;
    case "harvest":
      return action.harvestQty != null ? `${formatKg(action.harvestQty)}` : null;
    case "move": {
      const dest = state.apiaries.find((item) => item.id === action.moveToApiaryId);
      return dest ? `Destino: ${dest.name}` : null;
    }
    case "change_queen": {
      const bits = [];
      if (action.queenRetireReason) bits.push(`Motivo: ${action.queenRetireReason}`);
      if (action.queenOrigin) bits.push(`Origen: ${action.queenOrigin}`);
      return bits.length ? bits.join(" · ") : null;
    }
    default:
      return null;
  }
}

export function formatKg(value: number): string {
  const abs = Math.abs(value);
  const formatted =
    abs >= 100 ? value.toFixed(0) : abs >= 10 ? trimNum(value, 1) : trimNum(value, 2);
  return `${formatted} kg`;
}

function trimNum(value: number, digits: number): string {
  return value.toFixed(digits).replace(/\.?0+$/, "");
}

export function suggestLot(
  product: ProductKind,
  date: string,
  existing: string[],
): string {
  const prefix = PRODUCT_PREFIX[product];
  const [year, month] = date.split("-");
  const base = `${prefix}${year}-${month}-`;
  let seq = 1;
  const used = new Set(existing);
  while (used.has(`${base}${String(seq).padStart(2, "0")}`)) {
    seq += 1;
  }
  return `${base}${String(seq).padStart(2, "0")}`;
}
