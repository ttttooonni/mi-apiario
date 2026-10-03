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
    data.production.length > 0 || data.yearCloses.length > 0 || data.colonies.length > 0;

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

              {row.closed?.notes ? (
                <p className="mt-3 text-sm text-muted-foreground">{row.closed.notes}</p>
              ) : null}

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
        defaultHives={hiveCount(data)}
        defaultNucs={nucCount(data)}
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
