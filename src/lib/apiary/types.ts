export type ColonyKind = "hive" | "nuc";

export type ActionType =
  | "inspection" | "harvest" | "change_queen" | "add_frames" | "remove_frames"
  | "add_super" | "remove_super" | "treatment" | "split" | "create_nuc" | "move" | "note";
export type FrameKind = "standard" | "medium";
export type ProductKind = "honey" | "propolis" | "pollen" | "wax" | "royal_jelly";
export type QueenColor = "white" | "yellow" | "red" | "green" | "blue";
export type HealthTopic = "varroa" | "inspection" | "nosema" | "foulbrood" | "chalkbrood" | "hornet" | "surveillance" | "other";
export type HealthKind = "treatment" | "observation" | "sampling";
export type ColonyTemperament = "very_calm" | "calm" | "normal" | "nervous" | "aggressive";
export type ColonyProductivity = "very_high" | "high" | "normal" | "low" | "very_low";
export type ColonySwarming = "very_low" | "low" | "medium" | "high" | "very_high";
export type ColonyHygiene = "very_good" | "good" | "normal" | "low";
export type QueenDominance = "low" | "normal" | "high";
export type ColonyLossCause = "dead" | "absconded" | "queenless" | "weak" | "robbed" | "disease" | "varroa" | "pesticide" | "swarming" | "unknown" | "other";

export interface Apiary { id: string; name: string; location: string; notes?: string; photo?: string; createdAt: string; updatedAt: string; }
export interface Colony { id: string; apiaryId: string; kind: ColonyKind; number: string; notes?: string; photo?: string; temperament?: ColonyTemperament; productivity?: ColonyProductivity; swarmingTendency?: ColonySwarming; hygiene?: ColonyHygiene; queenDominance?: QueenDominance; materialStandardAdjustment?: number; materialMediumAdjustment?: number; materialSupersAdjustment?: number; createdAt: string; updatedAt: string; }
export interface Queen { id: string; colonyId: string; introducedAt: string; retiredAt?: string; retireReason?: string; origin?: string; genetics?: string; line?: string; }
export interface ColonyAction { id: string; colonyId: string; type: ActionType; date: string; notes?: string; framesKind?: FrameKind; framesQty?: number; supersQty?: number; treatmentProduct?: string; harvestQty?: number; moveToApiaryId?: string; queenIntroducedAt?: string; queenOrigin?: string; queenRetireReason?: string; createdAt: string; }
export interface HealthRecord { id: string; colonyId: string; topic: HealthTopic; kind: HealthKind; date: string; product?: string; notes?: string; actionId?: string; createdAt: string; varroaMethod?: string; varroaCount?: number; varroaSampleSize?: number; foodReserve?: "good" | "low" | "very_low"; pollenReserve?: "good" | "low" | "absent"; feedingNeeded?: boolean; feedingForm?: "liquid" | "paste"; feedingType?: "syrup" | "fondant" | "protein" | "other"; feedingAmount?: string; queenSeen?: boolean; broodStatus?: "good" | "regular" | "poor"; colonyStrength?: "strong" | "medium" | "weak"; behavior?: "calm" | "normal" | "nervous" | "aggressive"; }
export interface ProductionRecord { id: string; product: ProductKind; date: string; quantity: number; lot: string; notes?: string; createdAt: string; }
export interface YearClose { year: number; hives: number; nucs: number; closedAt: string; notes?: string; }
export interface ColonyLoss { id: string; apiaryId: string; colonyId?: string; colonyNumber: string; kind: ColonyKind; year: number; date: string; cause: ColonyLossCause; notes?: string; createdAt: string; }
export type TaskPriority = "high" | "normal" | "low";
export interface ColonyTask { id: string; colonyId: string; title: string; dueDate?: string; priority: TaskPriority; notes?: string; actionType?: ActionType; actionTreatmentProduct?: string; actionFramesKind?: FrameKind; actionFramesQty?: number; actionSupersQty?: number; completedAt?: string; createdAt: string; }
export interface AppState { apiaries: Apiary[]; colonies: Colony[]; queens: Queen[]; actions: ColonyAction[]; health: HealthRecord[]; production: ProductionRecord[]; yearCloses: YearClose[]; tasks: ColonyTask[]; losses: ColonyLoss[]; }
export const EMPTY_STATE: AppState = { apiaries: [], colonies: [], queens: [], actions: [], health: [], production: [], yearCloses: [], tasks: [], losses: [] };
export const DATA_VERSION = 2;
export const APP_VERSION = "2.2.15";
export const APP_BUILD_ID = "20261007-01";
export const APP_ID = "mi-apiario";
export interface BackupFile { app: typeof APP_ID; version: number; exportedAt: string; data: AppState; }