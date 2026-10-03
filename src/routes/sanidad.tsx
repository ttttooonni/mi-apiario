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
  COLONY_KIND_LABEL,
  HEALTH_KIND_LABEL,
  HEALTH_TOPIC_LABEL,
  HEALTH_TOPIC_ORDER,
  apiaryOf,
  coloniesMissingVarroa,
  colonyOf,
  currentYear,
  formatDate,
  healthOfYear,
  healthSummary,
  healthYears,
  unifiedHealth,
  useAppMutations,
  useNotebook,
  varroaTreatedIds,
  type HealthRecord,
  type HealthTopic,
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
    if (topicFilter === "all") return list;
    return list.filter((row) => row.topic === topicFilter);
  }, [data, topicFilter, yearFilter]);

  return (
    <div>
      <PageHeader
        title="Sanidad"
        description="Tratamientos de varroa por colmena, y el resto de vigilancia: loque, nosema, pollo escayolado, velutina y muestreos."
        actions={
          <>
            <Button
              onClick={() => {
                setPresetTopic("varroa");
                setFormOpen(true);
              }}
            >
              Tratamiento varroa
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPresetTopic("surveillance");
                setFormOpen(true);
              }}
            >
              Otro registro
            </Button>
          </>
        }
      />

      {data.colonies.length === 0 ? (
        <EmptyState
          title="Sin colonias"
          description="Crea un apiario y añade colmenas para llevar el cuaderno sanitario."
          actions={
            <Button asChild>
              <Link to="/apiarios">Ir a apiarios</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label={`Varroa ${yearNow}`} value={varroaCount} />
            <StatCard label="Colonias tratadas" value={`${treated.size}/${data.colonies.length}`} />
            <StatCard label="Pendientes" value={pending.length} />
            <StatCard label="Otros registros" value={otherCount} />
          </div>

          {pending.length > 0 ? (
            <Card className="mt-4 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-lg font-medium">Pendiente de varroa {yearNow}</h2>
                <p className="text-sm text-muted-foreground">
                  Colonias sin tratamiento registrado este año.
                </p>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {pending.map((colony) => {
                  const apiary = apiaryOf(data, colony.apiaryId);
                  return (
                    <li key={colony.id}>
                      <Link
                        to="/colonias/$colonyId"
                        params={{ colonyId: colony.id }}
                        className="inline-flex rounded-md bg-secondary px-2.5 py-1 text-sm hover:bg-accent"
                      >
                        {COLONY_KIND_LABEL[colony.kind]} {colony.number}
                        {apiary ? ` · ${apiary.name}` : ""}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : (
            <Card className="mt-4 p-5">
              <h2 className="font-display text-lg font-medium">Varroa {yearNow}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Todas las colonias tienen al menos un tratamiento registrado este año.
              </p>
            </Card>
          )}

          <div className="mt-8 mb-3 flex flex-wrap items-center gap-2">
            <h2 className="mr-auto font-display text-lg font-medium">Registros</h2>
            {years.map((item) => (
              <FilterChip
                key={item}
                active={yearFilter === item}
                onClick={() => setYearFilter(item)}
              >
                {String(item)}
              </FilterChip>
            ))}
            <FilterChip active={yearFilter === "all"} onClick={() => setYearFilter("all")}>
              Todos
            </FilterChip>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <FilterChip active={topicFilter === "all"} onClick={() => setTopicFilter("all")}>
              Todos
            </FilterChip>
            {HEALTH_TOPIC_ORDER.map((topic) => (
              <FilterChip
                key={topic}
                active={topicFilter === topic}
                onClick={() => setTopicFilter(topic)}
              >
                {HEALTH_TOPIC_LABEL[topic]}
              </FilterChip>
            ))}
          </div>

          {rows.length === 0 ? (
            <EmptyState
              title="Sin registros sanitarios"
              description="Empieza por un tratamiento de varroa: colonia, fecha, producto y una nota si hace falta."
              actions={
                <Button
                  onClick={() => {
                    setPresetTopic("varroa");
                    setFormOpen(true);
                  }}
                >
                  Tratamiento varroa
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]">
              {rows.map((row) => {
                const colony = colonyOf(data, row.colonyId);
                const apiary = colony ? apiaryOf(data, colony.apiaryId) : undefined;
                const summary = healthSummary(row);
                return (
                  <li key={row.id} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {HEALTH_TOPIC_LABEL[row.topic]}
                        <span className="ml-2 font-normal text-muted-foreground">
                          {HEALTH_KIND_LABEL[row.kind]}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(row.date)}
                        {colony ? (
                          <>
                            {" · "}
                            <Link
                              to="/colonias/$colonyId"
                              params={{ colonyId: colony.id }}
                              className="hover:text-foreground"
                            >
                              {COLONY_KIND_LABEL[colony.kind]} {colony.number}
                            </Link>
                          </>
                        ) : null}
                        {apiary ? ` · ${apiary.name}` : ""}
                      </p>
                      {summary ? <p className="mt-1 text-sm">{summary}</p> : null}
                      {row.notes ? (
                        <p className="mt-1 text-sm text-muted-foreground">{row.notes}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleting(row)}
                    >
                      Quitar
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <HealthFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        state={data}
        presetTopic={presetTopic}
        onSubmit={async (rowsToSave) => {
          await saveHealthMany.mutateAsync(rowsToSave);
          toast.success(
            rowsToSave.length > 1 ? `${rowsToSave.length} registros guardados` : "Registro guardado",
          );
        }}
      />

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Quitar este registro"
        description="Desaparecerá del cuaderno sanitario."
        confirmLabel="Quitar"
        onConfirm={async () => {
          if (!deleting) return;
          await removeHealthRecord.mutateAsync(deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
          : "rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      }
    >
      {children}
    </button>
  );
}
