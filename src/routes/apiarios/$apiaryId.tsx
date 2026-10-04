import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { ApiaryFormDialog } from "@/components/apiary/apiary-form";
import { ColonyFormDialog } from "@/components/apiary/colony-form";
import { ColonyKindBadge } from "@/components/apiary/colony-kind-badge";
import { ConfirmDelete } from "@/components/apiary/confirm-delete";
import { EmptyState } from "@/components/apiary/empty-state";
import { QueenSwatch } from "@/components/apiary/queen-swatch";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ACTION_LABEL, coloniesOf, currentQueen, formatDate, lastAction, newId, nowIso, useAppMutations, useNotebook, type AppState, type Colony, type ColonyKind } from "@/lib/apiary";

export const Route = createFileRoute("/apiarios/$apiaryId")({ component: ApiaryDetailPage });
function ApiaryDetailPage() {
  const { apiaryId } = Route.useParams(); const navigate = useNavigate(); const { data } = useNotebook();
  const { saveApiary, saveColony, removeApiary } = useAppMutations();
  const [editOpen, setEditOpen] = useState(false); const [deleteOpen, setDeleteOpen] = useState(false);
  const [colonyKind, setColonyKind] = useState<ColonyKind>("hive"); const [colonyOpen, setColonyOpen] = useState(false);
  const apiary = data.apiaries.find((item) => item.id === apiaryId);
  if (!apiary) return <EmptyState title="Apiario no encontrado" description="Puede que lo hayas eliminado." actions={<Button asChild><Link to="/apiarios">Volver a apiarios</Link></Button>} />;
  const colonies = coloniesOf(data, apiary.id); const hives = colonies.filter((item) => item.kind === "hive"); const nucs = colonies.filter((item) => item.kind === "nuc");
  return <div>
    <PageHeader title={apiary.name} description={apiary.location || undefined} backTo="/apiarios" backLabel="Apiarios" actions={<><Button variant="outline" onClick={() => setEditOpen(true)}>Editar</Button><Button variant="outline" onClick={() => setDeleteOpen(true)}>Eliminar</Button></>} />
    {apiary.photo && <img src={apiary.photo} alt={`Foto del apiario ${apiary.name}`} className="mb-5 max-h-64 w-full rounded-2xl border object-cover" />}
    {apiary.notes && <p className="mb-5 max-w-2xl text-sm text-muted-foreground">{apiary.notes}</p>}
    <ColonySection title="Colmenas" empty="Todavía no hay colmenas en este apiario." actionLabel="Añadir colmena" colonies={hives} onAdd={() => { setColonyKind("hive"); setColonyOpen(true); }} state={data} />
    <ColonySection title="Núcleos" empty="Todavía no hay núcleos en este apiario." actionLabel="Añadir núcleo" colonies={nucs} onAdd={() => { setColonyKind("nuc"); setColonyOpen(true); }} state={data} />
    <ApiaryFormDialog open={editOpen} onOpenChange={setEditOpen} initial={apiary} onSubmit={async (values) => { await saveApiary.mutateAsync({ ...apiary, ...values, updatedAt: nowIso() }); toast.success("Apiario actualizado"); }} />
    <ColonyFormDialog open={colonyOpen} onOpenChange={setColonyOpen} kind={colonyKind} onSubmit={async (values) => { await saveColony.mutateAsync({ id: newId(), apiaryId: apiary.id, kind: colonyKind, number: values.number, notes: values.notes, photo: values.photo, createdAt: nowIso(), updatedAt: nowIso() }); toast.success(colonyKind === "hive" ? "Colmena añadida" : "Núcleo añadido"); }} />
    <ConfirmDelete open={deleteOpen} onOpenChange={setDeleteOpen} title={`Eliminar ${apiary.name}`} description="Se eliminarán las colmenas, los núcleos y todo su historial." onConfirm={async () => { await removeApiary.mutateAsync(apiary.id); toast.success("Apiario eliminado"); await navigate({ to: "/apiarios" }); }} />
  </div>;
}
function ColonySection({ title, empty, actionLabel, colonies, onAdd, state }: { title: string; empty: string; actionLabel: string; colonies: Colony[]; onAdd: () => void; state: AppState }) {
  return <section className="mb-8"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-medium">{title}<span className="ml-2 text-sm font-sans font-normal text-muted-foreground tabular-nums">{colonies.length}</span></h2><Button size="sm" variant="outline" onClick={onAdd}>{actionLabel}</Button></div>
    {colonies.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : <ul className="grid gap-2 sm:grid-cols-2">{colonies.map((colony) => <ColonyRow key={colony.id} colony={colony} state={state} />)}</ul>}
  </section>;
}
function ColonyRow({ colony, state }: { colony: Colony; state: AppState }) {
  const queen = currentQueen(state, colony.id); const action = lastAction(state, colony.id);
  return <li><Link to="/colonias/$colonyId" params={{ colonyId: colony.id }} className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-border)] transition-colors hover:bg-secondary/60">
    {colony.photo ? <img src={colony.photo} alt="" className="size-16 shrink-0 rounded-lg object-cover" /> : <span className={`flex size-16 shrink-0 items-center justify-center rounded-lg text-lg font-semibold ${colony.kind === "hive" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950"}`}>{colony.kind === "hive" ? "C" : "N"}</span>}
    <div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-2"><span className="font-display text-lg font-medium tabular-nums">{colony.number}</span><ColonyKindBadge kind={colony.kind} />{queen && <QueenSwatch date={queen.introducedAt} />}</div><p className="truncate text-xs text-muted-foreground">{action ? `${ACTION_LABEL[action.type]} · ${formatDate(action.date)}` : "Sin acciones"}</p></div>
  </Link></li>;
}
