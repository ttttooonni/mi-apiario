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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  hiveCount,
  newId,
  nowIso,
  nucCount,
  useAppMutations,
  useNotebook,
  type Apiary,
} from "@/lib/apiary";

export const Route = createFileRoute("/apiarios/")({ component: ApiariesPage });

function ApiariesPage() {
  const { data } = useNotebook();
  const { saveApiary, removeApiary } = useAppMutations();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Apiary | null>(null);
  const [deleting, setDeleting] = useState<Apiary | null>(null);

  const apiaries = [...data.apiaries].sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <div>
      <PageHeader
        title="Apiarios"
        description="Cada apiario tiene su ficha, con colmenas y núcleos por separado."
        actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}>Nuevo apiario</Button>}
      />

      {apiaries.length === 0 ? (
        <EmptyState
          title="Sin apiarios"
          description="Crea el primero para empezar a registrar colmenas."
          actions={
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>Crear apiario</Button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {apiaries.map((apiary) => {
            const hives = hiveCount(data, apiary.id);
            const nucs = nucCount(data, apiary.id);
            return (
              <li key={apiary.id}>
                <Card className="relative overflow-hidden border-l-4 border-l-emerald-700/70 bg-emerald-50/40 p-5 dark:bg-emerald-950/10">
                  <Link to="/apiarios/$apiaryId" params={{ apiaryId: apiary.id }} className="block pr-10">
                    <span className="mb-2 inline-flex items-center rounded-full bg-emerald-800/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-emerald-900 dark:text-emerald-200">
                      APIARIO
                    </span>
                    <h2 className="font-display text-xl font-medium tracking-tight">{apiary.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {apiary.location || "Sin ubicación"}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm tabular-nums">
                      <span className="rounded-lg border border-emerald-800/15 bg-background/80 px-3 py-1.5">
                        {hives} {hives === 1 ? "colmena" : "colmenas"}
                      </span>
                      <span className="rounded-lg border border-amber-700/20 bg-amber-50/80 px-3 py-1.5 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
                        {nucs} {nucs === 1 ? "núcleo" : "núcleos"}
                      </span>
                    </div>
                  </Link>
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Acciones">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to="/apiarios/$apiaryId" params={{ apiaryId: apiary.id }}>
                            Abrir
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditing(apiary);
                            setFormOpen(true);
                          }}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() => setDeleting(apiary)}
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <ApiaryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSubmit={async (values) => {
          const now = nowIso();
          await saveApiary.mutateAsync({
            id: editing?.id ?? newId(),
            createdAt: editing?.createdAt ?? now,
            updatedAt: now,
            ...values,
          });
          toast.success(editing ? "Apiario actualizado" : "Apiario creado");
          setEditing(null);
        }}
      />

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Eliminar ${deleting?.name ?? "apiario"}`}
        description="Se eliminarán también sus colmenas, núcleos y todo el historial asociado. Esta acción no se puede deshacer."
        onConfirm={async () => {
          if (!deleting) return;
          await removeApiary.mutateAsync(deleting.id);
          toast.success("Apiario eliminado");
          setDeleting(null);
        }}
      />
    </div>
  );
}
