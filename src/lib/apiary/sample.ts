import { replaceAll } from "./idb";
import type { AppState } from "./types";

function iso(stamp: string): string {
  return `${stamp}T09:00:00.000Z`;
}

/** Datos de ejemplo realistas para explorar la aplicación. */
export function sampleState(): AppState {
  return {
    apiaries: [
      {
        id: "apiary-dehesa",
        name: "La Dehesa",
        location: "Valencia de Alcántara, Cáceres",
        notes: "Encinas y jarales. Floración principal en mayo.",
        createdAt: iso("2024-03-12"),
        updatedAt: iso("2026-04-02"),
      },
      {
        id: "apiary-relumbrar",
        name: "El Relumbrar",
        location: "Villarrobledo, Albacete",
        notes: "Romero y tomillo. Acceso por pista en buen estado.",
        createdAt: iso("2025-02-18"),
        updatedAt: iso("2026-06-11"),
      },
    ],
    colonies: [
      hive("c-1", "apiary-dehesa", "1", "2024-03-12"),
      hive("c-2", "apiary-dehesa", "2", "2024-03-12"),
      hive("c-4", "apiary-dehesa", "4", "2024-04-03"),
      hive("c-7", "apiary-dehesa", "7", "2025-04-19"),
      hive("c-8", "apiary-dehesa", "8", "2025-04-19"),
      hive("c-11", "apiary-dehesa", "11", "2026-03-28"),
      nuc("c-n1", "apiary-dehesa", "N1", "2026-04-12"),
      nuc("c-n2", "apiary-dehesa", "N2", "2026-05-03"),
      hive("c-12", "apiary-relumbrar", "12", "2025-02-18"),
      hive("c-14", "apiary-relumbrar", "14", "2025-02-18"),
      hive("c-18", "apiary-relumbrar", "18", "2025-03-09"),
      hive("c-21", "apiary-relumbrar", "21", "2025-06-02"),
      hive("c-24", "apiary-relumbrar", "24", "2026-03-21"),
      nuc("c-n3", "apiary-relumbrar", "N3", "2026-04-26"),
    ],
    queens: [
      queen("q-1a", "c-1", "2024-03-12", "2026-04-02", "Reina vieja, postura irregular", "Criadero propio"),
      queen("q-1b", "c-1", "2026-04-02", undefined, undefined, "Núcleo N1"),
      queen("q-2", "c-2", "2025-04-08", undefined, undefined, "Compra"),
      queen("q-4", "c-4", "2024-04-03", undefined, undefined, "Enjambrazón"),
      queen("q-7", "c-7", "2025-04-19", undefined, undefined, "División"),
      queen("q-8", "c-8", "2025-04-19", undefined, undefined, "División"),
      queen("q-11", "c-11", "2026-03-28", undefined, undefined, "Núcleo invernado"),
      queen("q-n1", "c-n1", "2026-04-12", undefined, undefined, "Realera de la 4"),
      queen("q-n2", "c-n2", "2026-05-03", undefined, undefined, "Realera de la 7"),
      queen("q-12", "c-12", "2025-02-18", undefined, undefined, "Compra"),
      queen("q-14", "c-14", "2025-02-18", undefined, undefined, "Compra"),
      queen("q-18", "c-18", "2025-03-09", undefined, undefined, "Criadero propio"),
      queen("q-21", "c-21", "2025-06-02", undefined, undefined, "Enjambrazón"),
      queen("q-24", "c-24", "2026-03-21", undefined, undefined, "Núcleo invernado"),
      queen("q-n3", "c-n3", "2026-04-26", undefined, undefined, "Realera de la 18"),
    ],
    actions: [
      action("a-1", "c-1", "inspection", "2026-03-15", "Limpieza de piquera. Reserva suficiente."),
      action("a-2", "c-1", "change_queen", "2026-04-02", "Introducida en jaula.", {
        queenIntroducedAt: "2026-04-02",
        queenOrigin: "Núcleo N1",
        queenRetireReason: "Reina vieja, postura irregular",
      }),
      action("a-3", "c-1", "add_frames", "2026-04-18", undefined, {
        framesKind: "standard",
        framesQty: 2,
      }),
      action("a-4", "c-1", "add_super", "2026-05-12", "Inicio de mielada.", { supersQty: 1 }),
      action("a-5", "c-1", "harvest", "2026-07-22", "Alza de primavera.", { harvestQty: 18 }),
      action("a-6", "c-2", "inspection", "2026-04-18", "Cría compacta. Buena población."),
      action("a-7", "c-2", "add_frames", "2026-04-18", undefined, {
        framesKind: "standard",
        framesQty: 3,
      }),
      action("a-8", "c-4", "create_nuc", "2026-04-12", "Núcleo N1 con dos cuadros de cría y realera."),
      action("a-9", "c-7", "treatment", "2026-08-08", "Tras la cosecha.", {
        treatmentProduct: "Ácido oxálico sublimado",
      }),
      action("a-10", "c-12", "inspection", "2026-03-21", "Invernada correcta. Consumo de reserva bajo."),
      action("a-11", "c-12", "add_frames", "2026-04-09", undefined, {
        framesKind: "medium",
        framesQty: 4,
      }),
      action("a-12", "c-18", "split", "2026-04-26", "División para núcleo N3."),
      action("a-13", "c-24", "inspection", "2026-06-11", "Núcleo pasado a colmena. Aceptó bien el alza."),
      action("a-14", "c-24", "add_super", "2026-06-11", undefined, { supersQty: 1 }),
      action("a-15", "c-14", "harvest", "2026-07-28", undefined, { harvestQty: 12 }),
      action("a-16", "c-n1", "inspection", "2026-05-20", "Reina en postura. Subir a colmena en otoño si cierra bien."),
      action("a-v1", "c-1", "treatment", "2026-08-08", "Tratamiento de fin de mielada.", {
        treatmentProduct: "Ácido oxálico sublimado",
      }),
      action("a-v2", "c-2", "treatment", "2026-08-08", undefined, {
        treatmentProduct: "Ácido oxálico sublimado",
      }),
      action("a-v4", "c-4", "treatment", "2026-08-08", undefined, {
        treatmentProduct: "Ácido oxálico sublimado",
      }),
      action("a-v8", "c-8", "treatment", "2026-08-09", undefined, {
        treatmentProduct: "Ácido oxálico sublimado",
      }),
      action("a-v12", "c-12", "treatment", "2026-08-11", "Apiario Relumbrar, mismo protocolo.", {
        treatmentProduct: "Ácido oxálico sublimado",
      }),
      action("a-v14", "c-14", "treatment", "2026-08-11", undefined, {
        treatmentProduct: "Ácido oxálico sublimado",
      }),
      action("a-v18", "c-18", "treatment", "2026-08-11", undefined, {
        treatmentProduct: "Ácido oxálico sublimado",
      }),
      action("a-v21", "c-21", "treatment", "2026-08-11", undefined, {
        treatmentProduct: "Ácido oxálico sublimado",
      }),
    ],
    health: [
      health("h-7", "c-7", "varroa", "treatment", "2026-08-08", "Ácido oxálico sublimado", "Tras la cosecha.", "a-9"),
      health("h-1", "c-1", "varroa", "treatment", "2026-08-08", "Ácido oxálico sublimado", "Tratamiento de fin de mielada.", "a-v1"),
      health("h-2", "c-2", "varroa", "treatment", "2026-08-08", "Ácido oxálico sublimado", undefined, "a-v2"),
      health("h-4", "c-4", "varroa", "treatment", "2026-08-08", "Ácido oxálico sublimado", undefined, "a-v4"),
      health("h-8", "c-8", "varroa", "treatment", "2026-08-09", "Ácido oxálico sublimado", undefined, "a-v8"),
      health("h-12", "c-12", "varroa", "treatment", "2026-08-11", "Ácido oxálico sublimado", "Apiario Relumbrar, mismo protocolo.", "a-v12"),
      health("h-14", "c-14", "varroa", "treatment", "2026-08-11", "Ácido oxálico sublimado", undefined, "a-v14"),
      health("h-18", "c-18", "varroa", "treatment", "2026-08-11", "Ácido oxálico sublimado", undefined, "a-v18"),
      health("h-21", "c-21", "varroa", "treatment", "2026-08-11", "Ácido oxálico sublimado", undefined, "a-v21"),
      health("h-nos", "c-4", "nosema", "observation", "2026-03-22", undefined, "Abdomen dilatado en algunas pecoreadoras. Vigilar heces en piquera."),
      health("h-vel", "c-12", "hornet", "observation", "2026-07-14", undefined, "Velutina en vuelo frente a piquera. Colocar trampa la semana que viene."),
      health("h-vig", "c-2", "surveillance", "sampling", "2026-04-18", undefined, "Muestreo de cría. Sin signos de loque."),
      health("h-poll", "c-18", "chalkbrood", "observation", "2026-05-03", undefined, "Algunas momias en el suelo. Ventilación correcta; no tratar."),
    ],
    production: [
      rec("p-1", "honey", "2025-08-12", 210, "M2025-08-01", "Cosecha de primavera-verano."),
      rec("p-2", "wax", "2025-08-13", 6.4, "C2025-08-01"),
      rec("p-3", "pollen", "2025-07-04", 9.2, "P2025-07-01"),
      rec("p-4", "propolis", "2025-09-02", 0.7, "PR2025-09-01"),
      rec("p-5", "honey", "2026-07-22", 95, "M2026-07-01", "Primera extracción. Romero y encina."),
      rec("p-6", "honey", "2026-08-18", 40, "M2026-08-01", "Segunda extracción."),
      rec("p-7", "pollen", "2026-07-10", 3.5, "P2026-07-01"),
      rec("p-8", "propolis", "2026-08-18", 0.8, "PR2026-08-01"),
      rec("p-9", "wax", "2026-08-19", 2.1, "C2026-08-01"),
    ],
    yearCloses: [
      {
        year: 2025,
        hives: 10,
        nucs: 2,
        closedAt: "2025-12-31",
        notes: "Cierre de temporada. Dos núcleos invernados.",
      },
    ],
  };
}

function hive(id: string, apiaryId: string, number: string, created: string) {
  return {
    id,
    apiaryId,
    kind: "hive" as const,
    number,
    createdAt: iso(created),
    updatedAt: iso(created),
  };
}

function nuc(id: string, apiaryId: string, number: string, created: string) {
  return {
    id,
    apiaryId,
    kind: "nuc" as const,
    number,
    createdAt: iso(created),
    updatedAt: iso(created),
  };
}

function queen(
  id: string,
  colonyId: string,
  introducedAt: string,
  retiredAt?: string,
  retireReason?: string,
  origin?: string,
) {
  return { id, colonyId, introducedAt, retiredAt, retireReason, origin };
}

function action(
  id: string,
  colonyId: string,
  type: AppState["actions"][number]["type"],
  date: string,
  notes?: string,
  extra?: Partial<AppState["actions"][number]>,
) {
  return {
    id,
    colonyId,
    type,
    date,
    notes,
    createdAt: iso(date),
    ...extra,
  };
}

function rec(
  id: string,
  product: AppState["production"][number]["product"],
  date: string,
  quantity: number,
  lot: string,
  notes?: string,
) {
  return { id, product, date, quantity, lot, notes, createdAt: iso(date) };
}

function health(
  id: string,
  colonyId: string,
  topic: AppState["health"][number]["topic"],
  kind: AppState["health"][number]["kind"],
  date: string,
  product?: string,
  notes?: string,
  actionId?: string,
) {
  return { id, colonyId, topic, kind, date, product, notes, actionId, createdAt: iso(date) };
}

export async function loadSampleData(): Promise<void> {
  await replaceAll(sampleState());
}
