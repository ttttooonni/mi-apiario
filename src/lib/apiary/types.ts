export type ColonyKind = "hive" | "nuc";

export type ActionType =
  | "inspection"
  | "harvest"
  | "change_queen"
  | "add_frames"
  | "remove_frames"
  | "add_super"
  | "remove_super"
  | "treatment"
  | "split"
  | "create_nuc"
  | "move"
  | "note";

export type FrameKind = "standard" | "medium";

export type ProductKind = "honey" | "propolis" | "pollen" | "wax" | "royal_jelly";

export type QueenColor = "white" | "yellow" | "red" | "green" | "blue";

export type HealthTopic =
  | "varroa"
  | "nosema"
  | "foulbrood"
  | "chalkbrood"
  | "hornet"
  | "surveillance"
  | "other";

export type HealthKind = "treatment" | "observation" | "sampling";

export interface Apiary {
  id: string;
  name: string;
  location: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Colony {
  id: string;
  apiaryId: string;
  kind: ColonyKind;
  number: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Queen {
  id: string;
  colonyId: string;
  introducedAt: string;
  retiredAt?: string;
  retireReason?: string;
  origin?: string;
}

export interface ColonyAction {
  id: string;
  colonyId: string;
  type: ActionType;
  date: string;
  notes?: string;
  framesKind?: FrameKind;
  framesQty?: number;
  supersQty?: number;
  treatmentProduct?: string;
  harvestQty?: number;
  moveToApiaryId?: string;
  queenIntroducedAt?: string;
  queenOrigin?: string;
  queenRetireReason?: string;
  createdAt: string;
}

export interface HealthRecord {
  id: string;
  colonyId: string;
  topic: HealthTopic;
  kind: HealthKind;
  date: string;
  product?: string;
  notes?: string;
  actionId?: string;
  createdAt: string;
}

export interface ProductionRecord {
  id: string;
  product: ProductKind;
  date: string;
  quantity: number;
  lot: string;
  notes?: string;
  createdAt: string;
}

export interface YearClose {
  year: number;
  hives: number;
  nucs: number;
  closedAt: string;
  notes?: string;
}

export interface AppState {
  apiaries: Apiary[];
  colonies: Colony[];
  queens: Queen[];
  actions: ColonyAction[];
  health: HealthRecord[];
  production: ProductionRecord[];
  yearCloses: YearClose[];
}

export const EMPTY_STATE: AppState = {
  apiaries: [],
  colonies: [],
  queens: [],
  actions: [],
  health: [],
  production: [],
  yearCloses: [],
};

export const DATA_VERSION = 1;
export const APP_ID = "mi-apiario";

export interface BackupFile {
  app: typeof APP_ID;
  version: number;
  exportedAt: string;
  data: AppState;
}
