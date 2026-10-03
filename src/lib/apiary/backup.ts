import { z } from "zod";
import { todayISO } from "./dates";
import { replaceAll } from "./idb";
import { APP_ID, DATA_VERSION, type AppState, type BackupFile } from "./types";

export type BackupSaveResult = "saved" | "downloaded" | "copied" | "cancelled";

const MAX_BACKUP_CHARS = 6_000_000;
const MAX_ROWS = 80_000;
const MAX_NOTE = 8_000;
const MAX_NAME = 200;
const MAX_ID = 128;

const Iso = z.string().min(4).max(40);
const Id = z.string().min(1).max(MAX_ID);
const Note = z.string().max(MAX_NOTE).optional();

const ColonyKindSchema = z.enum(["hive", "nuc"]);
const FrameKindSchema = z.enum(["standard", "medium"]);
const ProductKindSchema = z.enum(["honey", "propolis", "pollen", "wax", "royal_jelly"]);
const ActionTypeSchema = z.enum([
  "inspection",
  "harvest",
  "change_queen",
  "add_frames",
  "remove_frames",
  "add_super",
  "remove_super",
  "treatment",
  "split",
  "create_nuc",
  "move",
  "note",
]);
const HealthTopicSchema = z.enum([
  "varroa",
  "nosema",
  "foulbrood",
  "chalkbrood",
  "hornet",
  "surveillance",
  "other",
]);
const HealthKindSchema = z.enum(["treatment", "observation", "sampling"]);

const Qty = z.number().finite().min(0).max(1_000_000);

const ApiarySchema = z.object({
  id: Id,
  name: z.string().min(1).max(MAX_NAME),
  location: z.string().max(MAX_NAME).default(""),
  notes: Note,
  createdAt: Iso,
  updatedAt: Iso,
});

const ColonySchema = z.object({
  id: Id,
  apiaryId: Id,
  kind: ColonyKindSchema,
  number: z.string().min(1).max(40),
  notes: Note,
  createdAt: Iso,
  updatedAt: Iso,
});

const QueenSchema = z.object({
  id: Id,
  colonyId: Id,
  introducedAt: Iso,
  retiredAt: Iso.optional(),
  retireReason: Note,
  origin: z.string().max(MAX_NAME).optional(),
});

const ActionSchema = z.object({
  id: Id,
  colonyId: Id,
  type: ActionTypeSchema,
  date: Iso,
  notes: Note,
  framesKind: FrameKindSchema.optional(),
  framesQty: z.number().int().min(0).max(1_000).optional(),
  supersQty: z.number().int().min(0).max(100).optional(),
  treatmentProduct: z.string().max(MAX_NAME).optional(),
  harvestQty: Qty.optional(),
  moveToApiaryId: Id.optional(),
  queenIntroducedAt: Iso.optional(),
  queenOrigin: z.string().max(MAX_NAME).optional(),
  queenRetireReason: Note,
  createdAt: Iso,
});

const HealthSchema = z.object({
  id: Id,
  colonyId: Id,
  topic: HealthTopicSchema,
  kind: HealthKindSchema,
  date: Iso,
  product: z.string().max(MAX_NAME).optional(),
  notes: Note,
  actionId: Id.optional(),
  createdAt: Iso,
});

const ProductionSchema = z.object({
  id: Id,
  product: ProductKindSchema,
  date: Iso,
  quantity: Qty,
  lot: z.string().max(80).default(""),
  notes: Note,
  createdAt: Iso,
});

const YearCloseSchema = z.object({
  year: z.number().int().min(1990).max(2100),
  hives: z.number().int().min(0).max(100_000),
  nucs: z.number().int().min(0).max(100_000),
  closedAt: Iso,
  notes: Note,
});

const rows = <T extends z.ZodType>(schema: T) => z.array(schema).max(MAX_ROWS);

const BackupSchema = z.object({
  app: z.string(),
  version: z.number().int().min(1).max(20),
  exportedAt: z.string().min(4).max(40),
  data: z.object({
    apiaries: rows(ApiarySchema),
    colonies: rows(ColonySchema),
    queens: rows(QueenSchema),
    actions: rows(ActionSchema),
    health: rows(HealthSchema).optional(),
    production: rows(ProductionSchema),
    yearCloses: rows(YearCloseSchema).optional(),
  }),
});

type SavePicker = (options: {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{
  createWritable: () => Promise<{
    write: (data: string) => Promise<void>;
    close: () => Promise<void>;
  }>;
}>;

export function buildBackup(state: AppState): BackupFile {
  return {
    app: APP_ID,
    version: DATA_VERSION,
    exportedAt: new Date().toISOString(),
    data: state,
  };
}

export function backupFilename(): string {
  return `mi-apiario-backup-${todayISO()}.json`;
}

export function backupJson(state: AppState): string {
  return JSON.stringify(buildBackup(state), null, 2);
}

function inEmbeddedFrame(): boolean {
  try {
    return typeof window !== "undefined" && window.self !== window.top;
  } catch {
    return true;
  }
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function triggerDownload(payload: string, filename: string): void {
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function tryFilePicker(payload: string, filename: string): Promise<boolean> {
  const picker = (window as Window & { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
  if (!picker) return false;
  const handle = await picker({
    suggestedName: filename,
    types: [
      {
        description: "Copia de mi-apiario",
        accept: { "application/json": [".json"] },
      },
    ],
  });
  const writable = await handle.createWritable();
  await writable.write(payload);
  await writable.close();
  return true;
}

export function downloadBackup(state: AppState): void {
  triggerDownload(backupJson(state), backupFilename());
}

export async function copyBackup(state: AppState): Promise<void> {
  const payload = backupJson(state);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(payload);
    return;
  }
  throw new Error("El portapapeles no está disponible");
}

/** Save a JSON copy onto the device. Falls back to clipboard inside an iframe. */
export async function saveBackupLocally(state: AppState): Promise<BackupSaveResult> {
  const payload = backupJson(state);
  const filename = backupFilename();

  try {
    if (await tryFilePicker(payload, filename)) return "saved";
  } catch (error) {
    if (isAbort(error)) return "cancelled";
  }

  try {
    triggerDownload(payload, filename);
    if (inEmbeddedFrame()) {
      try {
        await copyBackup(state);
        return "copied";
      } catch {
        return "downloaded";
      }
    }
    return "downloaded";
  } catch {
    await copyBackup(state);
    return "copied";
  }
}

function zodMessage(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return "El archivo no tiene el formato de una copia de mi-apiario.";
  if (first.code === "too_big") return "La copia es demasiado grande o tiene demasiados registros.";
  return "El archivo no tiene el formato de una copia de mi-apiario.";
}

export function parseBackup(raw: string): AppState {
  if (raw.length > MAX_BACKUP_CHARS) {
    throw new Error("El archivo es demasiado grande para importarlo con seguridad.");
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("El archivo no es un JSON válido.");
  }
  const parsed = BackupSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(zodMessage(parsed.error));
  }
  if (parsed.data.app !== APP_ID) {
    throw new Error("El archivo no pertenece a mi-apiario.");
  }
  const data = parsed.data.data;
  return {
    apiaries: data.apiaries,
    colonies: data.colonies,
    queens: data.queens,
    actions: data.actions,
    health: data.health ?? [],
    production: data.production,
    yearCloses: data.yearCloses ?? [],
  };
}

export async function importBackup(raw: string): Promise<void> {
  const state = parseBackup(raw);
  await replaceAll(state);
}
