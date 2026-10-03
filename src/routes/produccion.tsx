import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/apiary/confirm-delete";
import { EmptyState } from "@/components/apiary/empty-state";
import { Field } from "@/components/apiary/field";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  formatDate,
  formatKg,
  newId,
  nowIso,
  PRODUCT_LABEL,
  PRODUCT_ORDER,
  suggestLot,
  todayISO,
  useAppMutations,
  useNotebook,
  type ProductKind,
  type ProductionRecord,
} from "@/lib/apiary";

export const Route = createFileRoute("/produccion")({ component: ProductionPage });

function ProductionPage() {
  const { data } = useNotebook();
  const { saveProduction, removeProduction } = useAppMutations();
  const [product, setProduct] = useState<ProductKind>("honey");
  const [date, setDate] = useState(todayISO());
  const [quantity, setQuantity] = useState("");
  const [lot, setLot] = useState("");
  const [notes, setNotes] = useState("");
  const [lotTouched, setLotTouched] = useState(false);
  const [deleting, setDeleting] = useState<ProductionRecord | null>(null);

  const lots = useMemo(
    () => data.production.map((item) => item.lot),
    [data],
  );

  const suggested = useMemo(() => suggestLot(product, date, lots), [product, date, lots]);

  const records = [...data.production].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Indica una cantidad válida");
      return;
    }
    const resolvedLot = (lotTouched ? lot : suggested).trim();
    if (!resolvedLot) {
      toast.error("El lote es obligatorio");
      return;
    }
    await saveProduction.mutateAsync({
      id: newId(),
      product,
      date,
      quantity: qty,
      lot: resolvedLot,
      notes: notes.trim() || undefined,
      createdAt: nowIso(),
    });
    toast.success("Producción registrada");
    setQuantity("");
    setNotes("");
    setLotTouched(false);
    setLot("");
  }

  return (
    <div>
      <PageHeader
        title="Producción"
        description="Registro de lo obtenido en la sala de extracción. Independiente de apiarios y números de colmena."
      />

      <Card className="mb-8 p-5">
        <h2 className="font-display text-lg font-medium">Nuevo registro</h2>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(event) => void handleSubmit(event)}>
          <Field label="Producto">
            <Select
              value={product}
              onValueChange={(value) => {
                setProduct(value as ProductKind);
                setLotTouched(false);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_ORDER.map((item) => (
                  <SelectItem key={item} value={item}>
                    {PRODUCT_LABEL[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Fecha" htmlFor="prod-date">
            <Input
              id="prod-date"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setLotTouched(false);
              }}
              required
            />
          </Field>
          <Field label="Cantidad (kg)" htmlFor="prod-qty">
            <Input
              id="prod-qty"
              type="number"
              min={0.01}
              step="0.01"
              inputMode="decimal"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
            />
          </Field>
          <Field label="Lote" htmlFor="prod-lot" hint="Obligatorio. Se sugiere a partir del producto y la fecha.">
            <Input
              id="prod-lot"
              value={lotTouched ? lot : suggested}
              onChange={(event) => {
                setLotTouched(true);
                setLot(event.target.value);
              }}
              required
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notas" htmlFor="prod-notes" hint="Opcional">
              <Textarea
                id="prod-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Guardar registro</Button>
          </div>
        </form>
      </Card>

      <h2 className="mb-3 font-display text-lg font-medium">Registros</h2>
      {records.length === 0 ? (
        <EmptyState
          title="Sin producción registrada"
          description="Los lotes se guardan aquí, no en la ficha de cada colmena."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-card shadow-[var(--shadow-border)]">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cantidad</th>
                <th className="px-4 py-3 font-medium">Lote</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{PRODUCT_LABEL[record.product]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(record.date)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatKg(record.quantity)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{record.lot}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleting(record)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDelete
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Eliminar registro"
        description={
          deleting ? `Se quitará el lote ${deleting.lot} (${formatKg(deleting.quantity)}).` : ""
        }
        onConfirm={async () => {
          if (!deleting) return;
          await removeProduction.mutateAsync(deleting.id);
          toast.success("Registro eliminado");
          setDeleting(null);
        }}
      />
    </div>
  );
}
