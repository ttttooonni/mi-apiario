import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/apiary/empty-state";
import { YearCloseDialog } from "@/components/apiary/year-close-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatDate,
  formatKg,
  hiveCount,
  nucCount,
  COLONY_LOSS_CAUSE_LABEL,
  PRODUCT_LABEL,
  PRODUCT_ORDER,
  todayISO,
  useAppMutations,
  useNotebook,
  yearlyHistory,
} from "@/lib/apiary";

export const Route = createFileRoute("/historico")({ component: HistoryPage });

function HistoryPage() {
  const { data } = useNotebook();
  const { saveYearClose } = useAppMutations();
  const [closingYear, setClosingYear] = useState<number | null>(null);

  const rows = yearlyHistory(data);
  const hasAnything =
    data.production.length > 0 || data.yearCloses.length > 0 || data.colonies.length > 0 || (data.losses ?? []).length > 0;

  return (
    <div>
      <PageHeader
        title="Histórico"
        description="Comparación por años. El censo de colmenas de un año cerrado no se inventa a partir de las colmenas actuales."
      />

      {!hasAnything ? (
        <EmptyState
          title="Todavía no hay histórico"
          description="Cuando registres producción o un cierre anual, los años aparecerán aquí."
        />
      ) : (
        <div className="grid gap-4">
          {rows.map((row) => (
            <Card key={row.year} className="p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-2xl font-medium tracking-tight">{row.year}</h2>
                <p className="text-xs text-muted-foreground">
                  {row.isCurrent
                    ? "Año en curso · censo actual"
                    : row.closed
                      ? `Cierre ${formatDate(row.closed.closedAt)}`
                      : "Sin cierre anual"}
                </p>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Count label="Colmenas" value={row.hives} />
                <Count label="Núcleos" value={row.nucs} />
              </dl>

              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-5">
                {PRODUCT_ORDER.map((product) => (
                  <div key={product}>
                    <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                      {PRODUCT_LABEL[product]}
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {row.products[product] > 0 ? formatKg(row.products[product]) : "—"}
                    </dd>
                  </div>
                ))}
              </dl>

              {(() => {
                const lots = data.production.filter((item) => Number(item.date.slice(0, 4)) === row.year)
                  .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
                if (!lots.length) return null;
                return <details className="mt-4 rounded-xl border px-3 py-3">
                  <summary className="cursor-pointer text-sm font-medium text-primary">Ver lotes de producción ({lots.length})</summary>
                  <ul className="mt-3 divide-y divide-border">
                    {lots.map((lot) => <li key={lot.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium">{PRODUCT_LABEL[lot.product]} · {formatDate(lot.date)}</p><p className="mt-1 text-xs text-muted-foreground">Lote <span className="font-mono">{lot.lot}</span></p></div><p className="font-semibold tabular-nums">{formatKg(lot.quantity)} kg</p></div>
                      {lot.notes ? <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{lot.notes}</p> : null}
                    </li>)}
                  </ul>
                </details>;
              })()}

              {row.closed?.notes ? (
                <p className="mt-3 text-sm text-muted-foreground">{row.closed.notes}</p>
              ) : null}

              {(() => {
                const losses = data.losses.filter((loss) => loss.year === row.year).sort((a, b) => b.date.localeCompare(a.date));
                if (!losses.length) return null;
                const causes = new Map<string, number>();
                for (const loss of losses) causes.set(loss.cause, (causes.get(loss.cause) ?? 0) + 1);
                return <details className="mt-4 rounded-xl border border-destructive/15 bg-destructive/5 p-3">
                  <summary className="cursor-pointer font-medium">Pérdidas: {losses.length} · Ver causas y fichas</summary>
                  <p className="mt-2 text-sm text-muted-foreground">{[...causes.entries()].map(([cause, count]) => `${COLONY_LOSS_CAUSE_LABEL[cause as keyof typeof COLONY_LOSS_CAUSE_LABEL]}: ${count}`).join(" · ")}</p>
                  <ul className="mt-3 divide-y divide-border/70">
                    {losses.map((loss) => {
                      const apiary = data.apiaries.find((item) => item.id === loss.apiaryId);
                      return <li key={loss.id} className="py-3 first:pt-0 last:pb-0">
                        <p className="font-medium">{loss.kind === "hive" ? "Colmena" : "Núcleo"} {loss.colonyNumber} · {formatDate(loss.date)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{COLONY_LOSS_CAUSE_LABEL[loss.cause]}{apiary ? ` · ${apiary.name}` : ""}</p>
                        {loss.notes ? <p className="mt-1 whitespace-pre-wrap text-sm">{loss.notes}</p> : null}
                      </li>;
                    })}
                  </ul>
                </details>;
              })()}

              {!row.isCurrent && !row.closed ? (
                <Button
                  className="mt-4"
                  size="sm"
                  variant="outline"
                  onClick={() => setClosingYear(row.year)}
                >
                  Cerrar {row.year}
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <YearCloseDialog
        open={closingYear !== null}
        onOpenChange={(open) => {
          if (!open) setClosingYear(null);
        }}
        year={closingYear ?? new Date().getFullYear()}
        defaultHives={null}
        defaultNucs={null}
        onSubmit={async (values) => {
          if (closingYear === null) return;
          await saveYearClose.mutateAsync({
            year: closingYear,
            hives: values.hives,
            nucs: values.nucs,
            notes: values.notes,
            closedAt: todayISO(),
          });
          toast.success(`Cierre de ${closingYear} guardado`);
          setClosingYear(null);
        }}
      />
    </div>
  );
}

function Count({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="font-display text-2xl font-medium tabular-nums">
        {value === null ? "—" : value}
      </dd>
    </div>
  );
}
