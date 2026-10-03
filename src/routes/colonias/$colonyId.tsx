import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ActionFormDialog } from "@/components/apiary/action-form";
import { ColonyFormDialog } from "@/components/apiary/colony-form";
import { ColonyKindBadge } from "@/components/apiary/colony-kind-badge";
import { ConfirmDelete } from "@/components/apiary/confirm-delete";
import { EmptyState } from "@/components/apiary/empty-state";
import { HealthFormDialog } from "@/components/apiary/health-form";
import { QueenFormDialog } from "@/components/apiary/queen-form";
import { QueenColorCaption, QueenSwatch } from "@/components/apiary/queen-swatch";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ACTION_LABEL,
  actionSummary,
  actionsOf,
  apiaryOf,
  COLONY_KIND_LABEL,
  currentQueen,
  formatDate,
  HEALTH_KIND_LABEL,
  HEALTH_TOPIC_LABEL,
  healthOfColony,
  healthSummary,
  lastVarroaTreatment,
  newId,
  queenHistory,
  useAppMutations,
  useNotebook,
  type ActionType,
} from "@/lib/apiary";

export const Route = createFileRoute("/colonias/$colonyId")({
  component: ColonyPage,
});

function ColonyPage() {
  const { colonyId } = Route.useParams();
  const navigate = useNavigate();
  const { data } = useNotebook();
  const { saveColony, saveQueen, saveAction, saveHealthMany, removeColony, removeAction } = useAppMutations();
  const [actionOpen, setActionOpen] = useState(false);
  const [presetType, setPresetType] = useState<ActionType | undefined>();
  const [healthOpen, setHealthOpen] = useState(false);
  const [queenOpen, setQueenOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAction, setDeletingAction] = useState<string | null>(null);
  const [showAllLogs, setShowAllLogs] = useState(false);

  const colony = data.colonies.find((item) => item.id === colonyId);
  if (!colony) {
    return (
      <EmptyState
        title="No encontrada"
        description="Esta colmena o núcleo ya no existe."
        actions={
          <Button asChild>
            <Link to="/apiarios">Volver a apiarios</Link>
          </Button>
        }
      />
    );
  }

  const apiary = apiaryOf(data, colony.apiaryId);
  const queen = currentQueen(data, colony.id);
  const history = queenHistory(data, colony.id);
  const previous = history.filter((item) => item.retiredAt);
  const logs = actionsOf(data, colony.id);
  const visibleLogs = showAllLogs ? logs : logs.slice(0, 40);
  const healthRows = healthOfColony(data, colony.id);
  const lastVarroa = lastVarroaTreatment(data, colony.id);
  const noun = COLONY_KIND_LABEL[colony.kind];

  return (
    <div>
      <PageHeader
        title={`${noun} ${colony.number}`}
        description={apiary?.name}
        backTo={apiary ? `/apiarios/${apiary.id}` : "/apiarios"}
        backLabel={apiary?.name ?? "Apiarios"}
        actions={
          <>
            <Button
              onClick={() => {
                setPresetType("inspection");
                setActionOpen(true);
              }}
            >
              Registrar acción
            </Button>
            <Button variant="outline" onClick={() => setHealthOpen(true)}>
              Tratamiento varroa
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              Editar
            </Button>
            <Button variant="outline" onClick={() => setDeleteOpen(true)}>
              Eliminar
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ColonyKindBadge kind={colony.kind} />
        {apiary ? (
          <Link
            to="/apiarios/$apiaryId"
            params={{ apiaryId: apiary.id }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {apiary.name}
            {apiary.location ? ` · ${apiary.location}` : ""}
          </Link>
        ) : null}
      </div>

      {colony.notes ? (
        <p className="mb-5 max-w-2xl text-sm text-muted-foreground">{colony.notes}</p>
      ) : null}

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-medium">Reina</h2>
            {queen ? (
              <div className="mt-3 space-y-1.5">
                <QueenColorCaption date={queen.introducedAt} />
                <p className="text-sm text-muted-foreground">
                  Introducida el {formatDate(queen.introducedAt)}
                  {queen.origin ? ` · ${queen.origin}` : ""}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Sin reina registrada.</p>
            )}
          </div>
          {queen ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setPresetType("change_queen");
                setActionOpen(true);
              }}
            >
              Cambiar reina
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setQueenOpen(true)}>
              Registrar reina
            </Button>
          )}
        </div>

        {previous.length > 0 ? (
          <>
            <Separator className="my-4" />
            <h3 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Reinas anteriores
            </h3>
            <ul className="mt-3 space-y-3">
              {previous.map((item) => (
                <li key={item.id} className="flex items-start gap-3 text-sm">
                  <QueenSwatch date={item.introducedAt} className="mt-1" />
                  <div>
                    <p>
                      {formatDate(item.introducedAt)}
                      {item.retiredAt ? ` — ${formatDate(item.retiredAt)}` : ""}
                    </p>
                    <p className="text-muted-foreground">
                      {item.retireReason || "Sin motivo indicado"}
                      {item.origin ? ` · ${item.origin}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Card>

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-medium">Sanidad</h2>
            {lastVarroa ? (
              <p className="mt-2 text-sm">
                Último varroa: {formatDate(lastVarroa.date)}
                {lastVarroa.product ? ` · ${lastVarroa.product}` : ""}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Sin tratamiento de varroa registrado.</p>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => setHealthOpen(true)}>
            Nuevo registro
          </Button>
        </div>
        {healthRows.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {healthRows.slice(0, 5).map((row) => {
              const summary = healthSummary(row);
              return (
                <li key={row.id} className="text-sm">
                  <p className="font-medium">
                    {HEALTH_TOPIC_LABEL[row.topic]}
                    <span className="ml-2 font-normal text-muted-foreground">
                      {HEALTH_KIND_LABEL[row.kind]} · {formatDate(row.date)}
                    </span>
                  </p>
                  {summary ? <p className="text-muted-foreground">{summary}</p> : null}
                  {row.notes ? <p className="text-muted-foreground">{row.notes}</p> : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </Card>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium">Historial</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPresetType(undefined);
              setActionOpen(true);
            }}
          >
            Nueva acción
          </Button>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay acciones. Usa el menú de acciones habituales para llevar un registro
            homogéneo.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]">
            {visibleLogs.map((action) => {
              const summary = actionSummary(action, data);
              return (
                <li key={action.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{ACTION_LABEL[action.type]}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(action.date)}</p>
                    {summary ? <p className="mt-1 text-sm">{summary}</p> : null}
                    {action.notes ? (
                      <p className="mt-1 text-sm text-muted-foreground">{action.notes}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => setDeletingAction(action.id)}
                  >
                    Quitar
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {logs.length > 40 && !showAllLogs ? (
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => setShowAllLogs(true)}
          >
            Ver las {logs.length - 40} anteriores
          </Button>
        ) : null}
      </section>

      <ActionFormDialog
        open={actionOpen}
        onOpenChange={setActionOpen}
        state={data}
        colonyId={colony.id}
        presetType={presetType}
        onSubmit={async (action) => {
          await saveAction.mutateAsync(action);
          toast.success("Acción guardada");
        }}
      />

      <HealthFormDialog
        open={healthOpen}
        onOpenChange={setHealthOpen}
        state={data}
        presetColonyId={colony.id}
        presetTopic="varroa"
        onSubmit={async (rows) => {
          await saveHealthMany.mutateAsync(rows);
          toast.success(rows.length > 1 ? `${rows.length} registros guardados` : "Registro sanitario guardado");
        }}
      />

      <QueenFormDialog
        open={queenOpen}
        onOpenChange={setQueenOpen}
        onSubmit={async (values) => {
          await saveQueen.mutateAsync({
            id: newId(),
            colonyId: colony.id,
            ...values,
          });
          toast.success("Reina registrada");
        }}
      />

      <ColonyFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        kind={colony.kind}
        initial={colony}
        onSubmit={async (values) => {
          await saveColony.mutateAsync({
            ...colony,
            ...values,
            updatedAt: new Date().toISOString(),
          });
          toast.success("Datos actualizados");
        }}
      />

      <ConfirmDelete
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Eliminar ${noun.toLowerCase()} ${colony.number}`}
        description="Se eliminará el historial de acciones y de reinas de esta colonia."
        onConfirm={async () => {
          const parent = colony.apiaryId;
          await removeColony.mutateAsync(colony.id);
          toast.success("Eliminada");
          await navigate({ to: "/apiarios/$apiaryId", params: { apiaryId: parent } });
        }}
      />

      <ConfirmDelete
        open={Boolean(deletingAction)}
        onOpenChange={(open) => {
          if (!open) setDeletingAction(null);
        }}
        title="Quitar esta acción"
        description="El registro desaparecerá del historial. Un cambio de reina ya aplicado no se revierte."
        confirmLabel="Quitar"
        onConfirm={async () => {
          if (!deletingAction) return;
          await removeAction.mutateAsync(deletingAction);
          setDeletingAction(null);
        }}
      />
    </div>
  );
}
