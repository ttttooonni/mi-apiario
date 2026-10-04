import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/apiary/confirm-delete";
import { EmptyState } from "@/components/apiary/empty-state";
import { Field } from "@/components/apiary/field";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  currentYear, formatDate, formatKg, newId, nowIso, PRODUCT_LABEL, PRODUCT_ORDER,
  productionOfYear, suggestLot, todayISO, useAppMutations, useNotebook, yearOf,
  type ProductKind, type ProductionRecord,
} from "@/lib/apiary";

export const Route = createFileRoute("/produccion")({ component: ProductionPage });

function ProductionPage() {
  const { data } = useNotebook();
  const { saveProduction, removeProduction } = useAppMutations();
  const year = currentYear();
  const [product, setProduct] = useState<ProductKind>("honey");
  const [date, setDate] = useState(todayISO());
  const [quantity, setQuantity] = useState("");
  const [lot, setLot] = useState("");
  const [notes, setNotes] = useState("");
  const [lotTouched, setLotTouched] = useState(false);
  const [deleting, setDeleting] = useState<ProductionRecord | null>(null);
  const [yearFilter, setYearFilter] = useState<number | "all">(year);
  const lots = useMemo(() => data.production.map((item) => item.lot), [data]);
  const suggested = useMemo(() => suggestLot(product, date, lots), [product, date, lots]);
  const totals = productionOfYear(data.production, year);
  const years = [...new Set([year, ...data.production.map((item) => yearOf(item.date))])].sort((a, b) => b - a);
  const records = [...data.production].filter((item) => yearFilter === "all" || yearOf(item.date) === yearFilter).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) { toast.error("Indica una cantidad válida"); return; }
    const resolvedLot = (lotTouched ? lot : suggested).trim();
    if (!resolvedLot) { toast.error("El lote es obligatorio"); return; }
    await saveProduction.mutateAsync({ id: newId(), product, date, quantity: qty, lot: resolvedLot, notes: notes.trim() || undefined, createdAt: nowIso() });
    toast.success("Producción registrada");
    setQuantity(""); setNotes(""); setLotTouched(false); setLot("");
  }

  return <div className="space-y-5">
    <PageHeader title="Producción" description="Registro de lo obtenido en la sala de extracción. Independiente de apiarios y números de colmena." />
    <Card className="border-amber-800/20 bg-amber-50/60 p-5 dark:bg-amber-950/20">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Temporada actual</p><h2 className="mt-1 font-display text-2xl font-semibold">Producción {year}</h2><p className="mt-1 text-sm text-muted-foreground">Totales calculados con los registros fechados en este año.</p></div><Button asChild variant="outline"><Link to="/historico">Ver cierre anual</Link></Button></div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{PRODUCT_ORDER.map((item) => <div key={item} className="rounded-xl border border-border/70 bg-card p-3"><dt className="text-sm text-muted-foreground">{PRODUCT_LABEL[item]}</dt><dd className="mt-1 font-display text-2xl font-semibold tabular-nums">{totals[item] > 0 ? formatKg(totals[item]) : "—"}</dd><dd className="text-xs text-muted-foreground">kg registrados</dd></div>)}</dl>
    </Card>
    <Card className="p-5">
      <h2 className="font-display text-lg font-medium">Nuevo registro</h2>
      <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(event) => void handleSubmit(event)}>
        <Field label="Producto"><Select value={product} onValueChange={(value) => { setProduct(value as ProductKind); setLotTouched(false); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRODUCT_ORDER.map((item) => <SelectItem key={item} value={item}>{PRODUCT_LABEL[item]}</SelectItem>)}</SelectContent></Select></Field>
        <Field label="Fecha" htmlFor="prod-date"><Input id="prod-date" type="date" value={date} onChange={(event) => { setDate(event.target.value); setLotTouched(false); }} required /></Field>
        <Field label="Cantidad (kg)" htmlFor="prod-qty"><Input id="prod-qty" type="number" min={0.01} step="0.01" inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></Field>
        <Field label="Lote" htmlFor="prod-lot" hint="Obligatorio. Se sugiere a partir del producto y la fecha."><Input id="prod-lot" value={lotTouched ? lot : suggested} onChange={(event) => { setLotTouched(true); setLot(event.target.value); }} required /></Field>
        <div className="sm:col-span-2"><Field label="Notas" htmlFor="prod-notes" hint="Opcional"><Textarea id="prod-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} /></Field></div>
        <div className="sm:col-span-2"><Button type="submit">Guardar registro</Button></div>
      </form>
    </Card>
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-2"><h2 className="mr-auto font-display text-lg font-medium">Registros</h2>{years.map((item) => <YearChip key={item} active={yearFilter === item} onClick={() => setYearFilter(item)}>{String(item)}</YearChip>)}<YearChip active={yearFilter === "all"} onClick={() => setYearFilter("all")}>Todos</YearChip></div>
      <p className="mb-3 text-sm text-muted-foreground">{yearFilter === "all" ? "Todos los años" : `Temporada ${yearFilter}`} · {records.length} registros</p>
      {records.length === 0 ? <EmptyState title="Sin producción registrada" description="No hay lotes registrados en esta temporada." /> : <div className="overflow-x-auto rounded-2xl bg-card shadow-[var(--shadow-border)]"><table className="w-full min-w-[32rem] text-left text-sm"><thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase"><tr><th className="px-4 py-3 font-medium">Producto</th><th className="px-4 py-3 font-medium">Fecha</th><th className="px-4 py-3 font-medium">Cantidad</th><th className="px-4 py-3 font-medium">Lote</th><th className="px-4 py-3 font-medium"><span className="sr-only">Acciones</span></th></tr></thead><tbody>{records.map((record) => <tr key={record.id} className="border-b border-border last:border-0"><td className="px-4 py-3">{PRODUCT_LABEL[record.product]}</td><td className="px-4 py-3 text-muted-foreground">{formatDate(record.date)}</td><td className="px-4 py-3 tabular-nums">{formatKg(record.quantity)}</td><td className="px-4 py-3 font-mono text-xs">{record.lot}</td><td className="px-4 py-3 text-right"><button type="button" className="text-sm text-muted-foreground hover:text-destructive" onClick={() => setDeleting(record)}>Eliminar</button></td></tr>)}</tbody></table></div>}
    </section>
    <ConfirmDelete open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(null); }} title="Eliminar registro" description={deleting ? `Se quitará el lote ${deleting.lot} (${formatKg(deleting.quantity)}).` : ""} onConfirm={async () => { if (!deleting) return; await removeProduction.mutateAsync(deleting.id); toast.success("Registro eliminado"); setDeleting(null); }} />
  </div>;
}

function YearChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return <button type="button" onClick={onClick} className={active ? "rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" : "rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"}>{children}</button>;
}
