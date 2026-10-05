import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ApiaryFormDialog } from "@/components/apiary/apiary-form";
import { ApiaryBulkActions } from "@/components/apiary/apiary-bulk-actions";
import { ColonyLossDialog } from "@/components/apiary/colony-loss-dialog";
import { ColonyFormDialog } from "@/components/apiary/colony-form";
import { ColonyKindBadge } from "@/components/apiary/colony-kind-badge";
import { ConfirmDelete } from "@/components/apiary/confirm-delete";
import { EmptyState } from "@/components/apiary/empty-state";
import { QueenSwatch } from "@/components/apiary/queen-swatch";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ACTION_LABEL, coloniesOf, COLONY_LOSS_CAUSE_LABEL, currentQueen, formatDate, healthOfColony, lastAction, newId, nowIso, queenColorFromDate, QUEEN_COLOR_META, useAppMutations, useNotebook, varroaInfestationPercent, varroaLevel, VARROA_LEVEL_LABEL, VARROA_LEVEL_CLASS, latestVarroaCheck, inventoryForColony, type AppState, type Colony, type ColonyKind } from "@/lib/apiary";

export const Route = createFileRoute("/apiarios/$apiaryId")({ component: ApiaryDetailPage });
const QUEEN_GENETICS_LABEL: Record<string, string> = {
  abeja_negra_canaria: "Negra canaria",
  abeja_negra_iberica: "Negra ibérica",
  buckfast: "Buckfast",
  carnica: "Cárnica",
  ligustica: "Ligústica",
  caucasica: "Caucásica",
  hibrido: "Híbrida",
  otra: "Otra",
  desconocida: "Desconocida",
};

function ApiaryDetailPage() {
  const { apiaryId } = Route.useParams(); const navigate = useNavigate(); const { data } = useNotebook();
  const { saveApiary, saveColony, removeApiary, saveLoss, removeLoss } = useAppMutations();
  const [editOpen, setEditOpen] = useState(false); const [deleteOpen, setDeleteOpen] = useState(false);
  const [colonyKind, setColonyKind] = useState<ColonyKind>("hive"); const [colonyOpen, setColonyOpen] = useState(false); const [lossOpen, setLossOpen] = useState(false);
  const apiary = data.apiaries.find((item) => item.id === apiaryId);
  if (!apiary) return <EmptyState title="Apiario no encontrado" description="Puede que lo hayas eliminado." actions={<Button asChild><Link to="/apiarios">Volver a apiarios</Link></Button>} />;
  const colonies = coloniesOf(data, apiary.id); const hives = colonies.filter((item) => item.kind === "hive"); const nucs = colonies.filter((item) => item.kind === "nuc");
  return <div className="space-y-6">
    <PageHeader title={apiary.name} description={apiary.location || undefined} backTo="/apiarios" backLabel="Apiarios" actions={<><Button variant="outline" className="min-h-11" onClick={() => setEditOpen(true)}>Editar</Button><Button variant="outline" className="min-h-11" onClick={() => setDeleteOpen(true)}>Eliminar</Button></>} />
    {apiary.photo && <img src={apiary.photo} alt={`Foto del apiario ${apiary.name}`} className="max-h-64 w-full rounded-2xl border object-cover" />}
    {apiary.notes && <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{apiary.notes}</p>}
    {colonies.length > 0 ? <ApiaryBulkActions state={data} colonies={colonies} /> : null}
    <section className="mb-7">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl font-semibold">Histórico del apiario</h2><p className="text-sm text-muted-foreground">Pérdidas por temporada y causa. Las colonias no se borran al registrarlas.</p></div><Button size="lg" variant="outline" className="min-h-12 px-4 text-base" onClick={() => setLossOpen(true)}>Registrar pérdida</Button></div>
      {data.losses.filter((loss) => loss.apiaryId === apiary.id).length ? <div className="grid gap-2">{[...data.losses].filter((loss) => loss.apiaryId === apiary.id).sort((a,b) => b.date.localeCompare(a.date)).map((loss) => <div key={loss.id} className="flex items-center gap-3 rounded-xl border bg-card p-3"><div className="min-w-0 flex-1"><p className="font-medium">{loss.kind === "hive" ? "Colmena" : "Núcleo"} {loss.colonyNumber} · {loss.year}</p><p className="text-sm text-muted-foreground">{COLONY_LOSS_CAUSE_LABEL[loss.cause]} · {formatDate(loss.date)}{loss.notes ? " · " + loss.notes : ""}</p></div><button type="button" className="rounded-lg px-2 py-1 text-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Eliminar pérdida" onClick={() => { if (window.confirm("¿Eliminar este registro histórico?")) void removeLoss.mutateAsync(loss.id); }}>✕</button></div>)}</div> : <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No hay pérdidas registradas.</p>}
      <ColonyLossDialog open={lossOpen} onOpenChange={setLossOpen} apiaryId={apiary.id} colonies={colonies} onSubmit={async (loss) => { await saveLoss.mutateAsync(loss); toast.success("Pérdida registrada en el histórico"); }} />
    </section>
    <ColonySection title="Colmenas" empty="Todavía no hay colmenas en este apiario." actionLabel="Añadir colmena" colonies={hives} onAdd={() => { setColonyKind("hive"); setColonyOpen(true); }} state={data} />
    <ColonySection title="Núcleos" empty="Todavía no hay núcleos en este apiario." actionLabel="Añadir núcleo" colonies={nucs} onAdd={() => { setColonyKind("nuc"); setColonyOpen(true); }} state={data} />
    <ApiaryFormDialog open={editOpen} onOpenChange={setEditOpen} initial={apiary} onSubmit={async (values) => { await saveApiary.mutateAsync({ ...apiary, ...values, updatedAt: nowIso() }); toast.success("Apiario actualizado"); }} />
    <ColonyFormDialog open={colonyOpen} onOpenChange={setColonyOpen} kind={colonyKind} onSubmit={async (values) => { await saveColony.mutateAsync({ id: newId(), apiaryId: apiary.id, kind: colonyKind, number: values.number, notes: values.notes, photo: values.photo, temperament: values.temperament, productivity: values.productivity, swarmingTendency: values.swarmingTendency, hygiene: values.hygiene, queenDominance: values.queenDominance, createdAt: nowIso(), updatedAt: nowIso() }); toast.success(colonyKind === "hive" ? "Colmena añadida" : "Núcleo añadido"); }} />
    <ConfirmDelete open={deleteOpen} onOpenChange={setDeleteOpen} title={`Eliminar ${apiary.name}`} description="Se eliminarán las colmenas, los núcleos y todo su historial." onConfirm={async () => { await removeApiary.mutateAsync(apiary.id); toast.success("Apiario eliminado"); await navigate({ to: "/apiarios" }); }} />
  </div>;
}
function ColonySection({ title, empty, actionLabel, colonies, onAdd, state }: { title: string; empty: string; actionLabel: string; colonies: Colony[]; onAdd: () => void; state: AppState }) {
  return <section className="mb-7">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-xl font-semibold">{title}<span className="ml-2 font-sans text-base font-medium text-muted-foreground tabular-nums">{colonies.length}</span></h2><Button size="lg" variant="outline" className="min-h-12 px-4 text-base" onClick={onAdd}>{actionLabel}</Button></div>
    {colonies.length === 0 ? <p className="rounded-xl border border-dashed p-4 text-base text-muted-foreground">{empty}</p> :
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">{colonies.map((colony) => <ColonyRow key={colony.id} colony={colony} state={state} />)}</ul>}
  </section>;
}
function ColonyRow({ colony, state }: { colony: Colony; state: AppState }) {
  const queen = currentQueen(state, colony.id);
  const action = lastAction(state, colony.id);
  const inventory = inventoryForColony(state.actions, colony.id, {
    standardFrames: colony.materialStandardAdjustment,
    mediumFrames: colony.materialMediumAdjustment,
    supers: colony.materialSupersAdjustment,
  });
  const latestHealth = healthOfColony(state, colony.id)[0];
  const varroaCheck = latestVarroaCheck(state, colony.id);
  const varroaPercent = varroaCheck ? varroaInfestationPercent(varroaCheck) : undefined;
  const varroaStatus = varroaLevel(varroaPercent);
  const queenMeta = queen ? QUEEN_COLOR_META[queenColorFromDate(queen.introducedAt)] : undefined;
  const profileLabels = { temperament: { very_calm: "Muy tranquila", calm: "Tranquila", normal: "Normal", nervous: "Nerviosa", aggressive: "Agresiva" }, productivity: { very_high: "Productividad muy alta", high: "Productividad alta", normal: "Productividad normal", low: "Productividad baja", very_low: "Productividad muy baja" }, swarmingTendency: { very_low: "Enjambrazón muy baja", low: "Enjambrazón baja", medium: "Enjambrazón media", high: "Enjambrazón alta", very_high: "Enjambrazón muy alta" }, hygiene: { very_good: "Higiene muy buena", good: "Higiene buena", normal: "Higiene normal", low: "Higiene baja" }, queenDominance: { low: "Reina: dominancia baja", normal: "Reina: dominancia normal", high: "Reina: dominancia alta" } } as const;
  const quickInfo = [
    queenMeta ? `Reina ${queenMeta.label.toLowerCase()}` : null,
    `📦 ${inventory.standardFrames} cuadros${inventory.mediumFrames ? ` + ${inventory.mediumFrames} media alza` : ""} · ${inventory.supers} alzas`,\n    queen?.genetics ? `🧬 ${QUEEN_GENETICS_LABEL[queen.genetics] ?? queen.genetics}${queen.line ? ` · ${queen.line}` : ""}` : null,
    colony.temperament ? `🐝 ${profileLabels.temperament[colony.temperament]}` : null,
    colony.productivity ? `🍯 ${profileLabels.productivity[colony.productivity]}` : null,
    colony.swarmingTendency ? `↗ ${profileLabels.swarmingTendency[colony.swarmingTendency]}` : null,
    colony.hygiene ? `🧼 ${profileLabels.hygiene[colony.hygiene]}` : null,
    colony.queenDominance ? `👑 ${profileLabels.queenDominance[colony.queenDominance]}` : null,
    varroaCheck && varroaPercent !== undefined && varroaStatus
      ? `🕷️ Varroa ${varroaPercent.toFixed(1)} % · ${VARROA_LEVEL_LABEL[varroaStatus]}`
      : latestHealth?.topic === "varroa" && latestHealth.varroaCount !== undefined
        ? `Varroa ${latestHealth.varroaCount}`
        : latestHealth?.topic === "inspection" && latestHealth.feedingNeeded
        ? `Alimentación ${latestHealth.feedingForm === "paste" ? "pasta" : "líquida"}`
        : latestHealth?.topic === "inspection" && latestHealth.colonyStrength
          ? `Fuerza ${({ strong: "fuerte", medium: "media", weak: "débil" } as const)[latestHealth.colonyStrength]}`
          : latestHealth?.topic === "inspection" && latestHealth.foodReserve
            ? `Miel ${({ good: "buena", low: "escasa", very_low: "muy escasa" } as const)[latestHealth.foodReserve]}`
            : null,
  ].filter(Boolean).join(" · ");
  return <li><Link to="/colonias/$colonyId" params={{ colonyId: colony.id }} className={`flex min-w-0 items-center gap-4 rounded-2xl border p-4 shadow-[var(--shadow-border)] transition-colors hover:bg-secondary/60 ${varroaStatus ? VARROA_LEVEL_CLASS[varroaStatus] : "border-border bg-card"}`}>
    {colony.photo ? <img src={colony.photo} alt={`Foto de ${colony.kind === "hive" ? "colmena" : "núcleo"} ${colony.number}`} className="size-20 shrink-0 rounded-xl object-cover" /> : <span className={`flex size-20 shrink-0 items-center justify-center rounded-xl text-2xl font-bold ${colony.kind === "hive" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950"}`}>{colony.kind === "hive" ? "C" : "N"}</span>}
    <div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="font-display text-2xl font-semibold leading-none tabular-nums">{colony.number}</span><ColonyKindBadge kind={colony.kind} />{queen && <QueenSwatch date={queen.introducedAt} />}</div><p className="text-sm leading-snug text-muted-foreground">{action ? `${ACTION_LABEL[action.type]} · ${formatDate(action.date)}` : "Sin acciones registradas"}</p>{quickInfo ? <p className="mt-1 truncate text-xs text-muted-foreground">{quickInfo}</p> : null}</div>
  </Link></li>;
}
