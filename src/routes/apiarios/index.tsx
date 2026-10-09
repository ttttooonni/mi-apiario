import { createFileRoute, Link } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ApiaryFormDialog } from "@/components/apiary/apiary-form";
import { ConfirmDelete } from "@/components/apiary/confirm-delete";
import { EmptyState } from "@/components/apiary/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { hiveCount, newId, nowIso, nucCount, useAppMutations, useNotebook, type Apiary } from "@/lib/apiary";

export const Route = createFileRoute("/apiarios/")({ component: ApiariesPage });
function ApiariesPage() {
  const { data } = useNotebook();
  const { saveApiary, removeApiary } = useAppMutations();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Apiary | null>(null);
  const [deleting, setDeleting] = useState<Apiary | null>(null);
  const apiaries = [...data.apiaries].sort((a, b) => a.name.localeCompare(b.name, "es"));

  return <div>
    <PageHeader title="Apiarios" description="Cada apiario tiene su ficha, con colmenas y núcleos por separado." actions={<Button className="min-h-12 px-5 text-base" onClick={() => { setEditing(null); setFormOpen(true); }}>Nuevo apiario</Button>} />
    {apiaries.length === 0 ? <EmptyState title="Sin apiarios" description="Crea el primero para empezar a registrar colmenas." actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}>Crear apiario</Button>} /> :
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {apiaries.map((apiary) => {
          const hives = hiveCount(data, apiary.id); const nucs = nucCount(data, apiary.id);
          return <li key={apiary.id}>
            <Card className="relative h-full overflow-hidden border-l-4 border-l-emerald-700/70 bg-emerald-50/40 p-5 sm:p-6 dark:bg-emerald-950/10">
              <Link to="/apiarios/$apiaryId" params={{ apiaryId: apiary.id }} className="block pr-10">
                {apiary.photo ? <img src={apiary.photo} alt="" className="mb-4 h-36 w-full rounded-xl object-cover" /> : null}
                <span className="mb-3 inline-flex items-center rounded-full bg-emerald-800/10 px-3 py-1.5 text-sm font-bold tracking-wide text-emerald-900 dark:text-emerald-200">APIARIO</span>
                <h2 className="font-display text-2xl font-semibold leading-tight tracking-tight">{apiary.name}</h2>
                <p className="mt-2 text-base text-muted-foreground">{apiary.location || "Sin ubicación"}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-base font-medium tabular-nums">
                  <span className="rounded-xl border border-emerald-800/15 bg-background/80 px-4 py-2.5">{hives} {hives === 1 ? "colmena" : "colmenas"}</span>
                  <span className="rounded-xl border border-amber-700/20 bg-amber-50/80 px-4 py-2.5 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">{nucs} {nucs === 1 ? "núcleo" : "núcleos"}</span>
                </div>
              </Link>
              <details className="mt-4 border-t border-border/60 pt-3">
                <summary className="cursor-pointer text-sm font-medium text-primary">Más información del apiario</summary>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-muted-foreground">Ubicación</dt><dd className="break-words">{apiary.location || "Sin ubicación registrada"}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Pérdidas anotadas</dt><dd>{data.losses.filter((loss) => loss.apiaryId === apiary.id).length}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Creado</dt><dd>{apiary.createdAt ? new Date(apiary.createdAt).toLocaleDateString("es-ES") : "Sin fecha"}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Última modificación</dt><dd>{apiary.updatedAt ? new Date(apiary.updatedAt).toLocaleDateString("es-ES") : "Sin fecha"}</dd></div>
                  <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Notas</dt><dd className="whitespace-pre-wrap break-words">{apiary.notes || "Sin notas registradas"}</dd></div>
                </dl>
                <Link to="/apiarios/$apiaryId" params={{ apiaryId: apiary.id }} className="mt-3 inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline">Abrir historial y fichas del apiario →</Link>
              </details>
              <div className="absolute right-3 top-3"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-11" aria-label="Acciones"><MoreHorizontal className="size-5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
                <DropdownMenuItem asChild><Link to="/apiarios/$apiaryId" params={{ apiaryId: apiary.id }}>Abrir</Link></DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { setEditing(apiary); setFormOpen(true); }}>Editar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(apiary)}>Eliminar</DropdownMenuItem>
              </DropdownMenuContent></DropdownMenu></div>
            </Card>
          </li>;
        })}
      </ul>}
    <ApiaryFormDialog open={formOpen} onOpenChange={setFormOpen} initial={editing} onSubmit={async (values) => {
      const now = nowIso();
      await saveApiary.mutateAsync({ id: editing?.id ?? newId(), createdAt: editing?.createdAt ?? now, updatedAt: now, ...values });
      toast.success(editing ? "Apiario actualizado" : "Apiario creado"); setEditing(null);
    }} />
    <ConfirmDelete open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(null); }} title={`Eliminar ${deleting?.name ?? "apiario"}`} description="Se eliminarán sus colmenas, núcleos, reinas, acciones, sanidad y tareas. Las pérdidas registradas se conservarán en el histórico. Esta acción no se puede deshacer." onConfirm={async () => {
      if (!deleting) return; await removeApiary.mutateAsync(deleting.id); toast.success("Apiario eliminado"); setDeleting(null);
    }} />
  </div>;
}
