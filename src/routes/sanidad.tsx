import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/apiary/confirm-delete";
import { EmptyState } from "@/components/apiary/empty-state";
import { HealthFormDialog } from "@/components/apiary/health-form";
import { StatCard } from "@/components/apiary/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  COLONY_KIND_LABEL, HEALTH_KIND_LABEL, HEALTH_TOPIC_LABEL, HEALTH_TOPIC_ORDER,
  apiaryOf, coloniesMissingVarroa, colonyOf, currentYear, formatDate,
  healthOfYear, healthSummary, healthYears, unifiedHealth, useAppMutations,
  useNotebook, varroaTreatedIds, type HealthRecord, type HealthTopic,
} from "@/lib/apiary";

export const Route = createFileRoute("/sanidad")({ component: SanidadPage });

function SanidadPage() {
  const { data } = useNotebook();
  const { saveHealthMany, removeHealthRecord } = useAppMutations();
  const yearNow = currentYear();
  const [formOpen, setFormOpen] = useState(false);
  const [presetTopic, setPresetTopic] = useState<HealthTopic>("varroa");
  const [topicFilter, setTopicFilter] = useState<HealthTopic | "all">("all");
  const [yearFilter, setYearFilter] = useState<number | "all">(yearNow);
  const [deleting, setDeleting] = useState<HealthRecord | null>(null);
  const years = healthYears(data);
  const yearRows = healthOfYear(data, yearNow);
  const treated = varroaTreatedIds(data, yearNow);
  const pending = coloniesMissingVarroa(data, yearNow);
  const varroaCount = yearRows.filter((row) => row.topic === "varroa" && row.kind === "treatment").length;
  const otherCount = yearRows.filter((row) => row.topic !== "varroa").length;
  const rows = useMemo(() => {
    const list = yearFilter === "all" ? unifiedHealth(data) : healthOfYear(data, yearFilter);
    return topicFilter === "all" ? list : list.filter((row) => row.topic === topicFilter);
  }, [data, topicFilter, yearFilter]);

  return <div className="space-y-5">
    <PageHeader title="Sanidad" description="Tratamientos de varroa por colmena y vigilancia sanitaria: loque, nosema, pollo escayolado, velutina y muestreos."
      actions={<><Button onClick={() => { setPresetTopic("varroa"); setFormOpen(true); }}>Tratamiento varroa</Button><Button variant="outline" onClick={() => { setPresetTopic("surveillance"); setFormOpen(true); }}>Otro registro</Button></>} />
    {data.colonies.length === 0 ? <EmptyState title="Sin colonias" description="Crea un apiario y añade colmenas para llevar el cuaderno sanitario." actions={<Button asChild><Link to="/apiarios">Ir a apiarios</Link></Button>} /> : <>
      <Card className="border-emerald-800/20 bg-emerald-50/60 p-5 dark:bg-emerald-950/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Temporada actual</p><h2 className="mt-1 font-display text-2xl font-semibold">Sanidad {yearNow}</h2><p className="mt-1 text-sm text-muted-foreground">Resumen anual de tratamientos y vigilancia</p></div>
          <span className="rounded-full bg-emerald-800/10 px-3 py-1 text-sm font-medium text-emerald-900 dark:text-emerald-100">En curso</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Tratamientos varroa" value={varroaCount} />
          <StatCard label="Colonias tratadas" value={`${treated.size}/${data.colonies.length}`} />
          <StatCard label="Pendientes" value={pending.length} />
          <StatCard label="Otros registros" value={otherCount} />
        </div>
        {pending.length > 0 ? <div className="mt-4 rounded-xl border border-amber-700/20 bg-amber-50 p-3 dark:bg-amber-950/20"><p className="font-medium">Colonias pendientes de varroa</p><ul className="mt-2 flex flex-wrap gap-2">{pending.map((colony) => { const apiary = apiaryOf(data, colony.apiaryId); return <li key={colony.id}><Link to="/colonias/$colonyId" params={{ colonyId: colony.id }} className="inline-flex rounded-lg bg-card px-3 py-2 text-sm underline-offset-2 hover:underline">{COLONY_KIND_LABEL[colony.kind]} {colony.number}{apiary ? ` · ${apiary.name}` : ""}</Link></li>; })}</ul></div> : <p className="mt-4 rounded-xl bg-emerald-800/10 p-3 text-sm">Todas las colonias tienen al menos un tratamiento registrado este año.</p>}
      </Card>
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2"><h2 className="mr-auto font-display text-lg font-medium">Histórico sanitario</h2>{years.map((item) => <FilterChip key={item} active={yearFilter === item} onClick={() => setYearFilter(item)}>{String(item)}</FilterChip>)}<FilterChip active={yearFilter === "all"} onClick={() => setYearFilter("all")}>Todos</FilterChip></div>
        <div className="mb-3 flex flex-wrap items-center gap-2"><FilterChip active={topicFilter === "all"} onClick={() => setTopicFilter("all")}>Todos</FilterChip>{HEALTH_TOPIC_ORDER.map((topic) => <FilterChip key={topic} active={topicFilter === topic} onClick={() => setTopicFilter(topic)}>{HEALTH_TOPIC_LABEL[topic]}</FilterChip>)}</div>
        {rows.length === 0 ? <EmptyState title="Sin registros sanitarios" description="Empieza por un tratamiento de varroa: colonia, fecha, producto y una nota si hace falta." actions={<Button onClick={() => { setPresetTopic("varroa"); setFormOpen(true); }}>Tratamiento varroa</Button>} /> :
          <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]">{rows.map((row) => { const colony = colonyOf(data, row.colonyId); const apiary = colony ? apiaryOf(data, colony.apiaryId) : undefined; const summary = healthSummary(row); const details = healthDetailRows(row); return <li key={row.id} className="flex items-start justify-between gap-3 px-4 py-3"><div className="min-w-0 flex-1"><p className="text-base font-medium">{HEALTH_TOPIC_LABEL[row.topic]}<span className="ml-2 font-normal text-muted-foreground">{HEALTH_KIND_LABEL[row.kind]}</span></p><p className="text-sm text-muted-foreground">{formatDate(row.date)}{colony ? <>{" · "}<Link to="/colonias/$colonyId" params={{ colonyId: colony.id }} className="hover:text-foreground">{COLONY_KIND_LABEL[colony.kind]} {colony.number}</Link></> : null}{apiary ? ` · ${apiary.name}` : ""}</p>{summary ? <p className="mt-1 text-sm">{summary}</p> : null}{row.notes ? <p className="mt-1 text-sm text-muted-foreground">{row.notes}</p> : null}{details.length ? <details className="mt-2 rounded-lg bg-secondary/40 px-3 py-2"><summary className="cursor-pointer text-sm font-medium text-primary">Ver ficha sanitaria completa ({details.length} datos)</summary><dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">{details.map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>)}</dl></details> : null}</div><button type="button" className="shrink-0 text-sm text-muted-foreground hover:text-destructive" onClick={() => setDeleting(row)}>Quitar</button></li>; })}</ul>}
      </section>
    </>}
    <HealthFormDialog open={formOpen} onOpenChange={setFormOpen} state={data} presetTopic={presetTopic} onSubmit={async (rowsToSave) => { await saveHealthMany.mutateAsync(rowsToSave); toast.success(rowsToSave.length > 1 ? `${rowsToSave.length} registros guardados` : "Registro guardado"); }} />
    <ConfirmDelete open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(null); }} title="Quitar este registro" description="Desaparecerá del cuaderno sanitario." confirmLabel="Quitar" onConfirm={async () => { if (!deleting) return; await removeHealthRecord.mutateAsync(deleting.id); setDeleting(null); }} />
  </div>;
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return <button type="button" onClick={onClick} className={active ? "rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" : "rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"}>{children}</button>;
}


function healthDetailRows(row: HealthRecord): Array<[string, string | number]> {
  const details: Array<[string, string | number]> = [];
  const add = (label: string, value: string | number | undefined) => {
    if (value !== undefined && value !== "") details.push([label, value]);
  };
  const food: Record<NonNullable<HealthRecord["foodReserve"]>, string> = { good: "Buena", low: "Escasa", very_low: "Muy escasa" };
  const pollen: Record<NonNullable<HealthRecord["pollenReserve"]>, string> = { good: "Bueno", low: "Escaso", absent: "Ausente" };
  const feedingForm: Record<NonNullable<HealthRecord["feedingForm"]>, string> = { liquid: "Líquida", paste: "Pasta" };
  const feedingType: Record<NonNullable<HealthRecord["feedingType"]>, string> = { syrup: "Jarabe", fondant: "Fondant", protein: "Proteica", other: "Otra" };
  const brood: Record<NonNullable<HealthRecord["broodStatus"]>, string> = { good: "Buena", regular: "Regular", poor: "Pobre" };
  const strength: Record<NonNullable<HealthRecord["colonyStrength"]>, string> = { strong: "Fuerte", medium: "Media", weak: "Débil" };
  const behavior: Record<NonNullable<HealthRecord["behavior"]>, string> = { calm: "Tranquila", normal: "Normal", nervous: "Nerviosa", aggressive: "Agresiva" };
  add("Método de muestreo", row.varroaMethod);
  add("Ácaros contados", row.varroaCount);
  add("Abejas muestreadas", row.varroaSampleSize);
  add("Reservas de miel", row.foodReserve ? food[row.foodReserve] : undefined);
  add("Reservas de polen", row.pollenReserve ? pollen[row.pollenReserve] : undefined);
  add("Necesita alimentación", row.feedingNeeded === undefined ? undefined : row.feedingNeeded ? "Sí" : "No");
  add("Forma de alimentación", row.feedingForm ? feedingForm[row.feedingForm] : undefined);
  add("Tipo de alimento", row.feedingType ? feedingType[row.feedingType] : undefined);
  add("Cantidad suministrada", row.feedingAmount);
  add("Reina vista", row.queenSeen === undefined ? undefined : row.queenSeen ? "Sí" : "No");
  add("Estado de la cría", row.broodStatus ? brood[row.broodStatus] : undefined);
  add("Fuerza de la colonia", row.colonyStrength ? strength[row.colonyStrength] : undefined);
  add("Comportamiento", row.behavior ? behavior[row.behavior] : undefined);
  add("Producto", row.product);
  add("Observaciones", row.notes);
  add("Creado el", row.createdAt ? new Date(row.createdAt).toLocaleString("es-ES") : undefined);
  return details;
}
