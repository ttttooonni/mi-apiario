import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ACTION_LABEL, newId, nowIso, todayISO, type ActionType, type AppState, type Colony, useAppMutations } from "@/lib/apiary";

const BULK_TYPES: Array<{ type: ActionType; label: string }> = [
  { type: "inspection", label: "Revisión" }, { type: "treatment", label: "Tratamiento" },
  { type: "add_frames", label: "Añadir marcos" }, { type: "remove_frames", label: "Retirar marcos" },
  { type: "add_super", label: "Colocar alza" }, { type: "remove_super", label: "Retirar alza" },
  { type: "harvest", label: "Cosecha" }, { type: "note", label: "Nota" },
];

export function ApiaryBulkActions({ state: _state, colonies }: { state: AppState; colonies: Colony[] }) {
  const { saveAction, saveTask } = useAppMutations();
  const [selected, setSelected] = useState<string[]>(() => colonies.map((colony) => colony.id));
  const [type, setType] = useState<ActionType>("inspection");
  const [date, setDate] = useState(todayISO());
  const [product, setProduct] = useState("");
  const [notes, setNotes] = useState("");
  const [framesQty, setFramesQty] = useState("1");
  const [supersQty, setSupersQty] = useState("1");
  const [createTasks, setCreateTasks] = useState(true);
  const [busy, setBusy] = useState(false);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const excluded = colonies.filter((colony) => !selectedSet.has(colony.id));
  const allSelected = colonies.length > 0 && selected.length === colonies.length;

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function submit() {
    if (!selected.length) return toast.error("Selecciona al menos una colonia");
    if (type === "treatment" && !product.trim()) return toast.error("Indica el producto");
    if (type === "note" && !notes.trim()) return toast.error("Escribe una nota");
    setBusy(true);
    try {
      const createdAt = nowIso();
      for (const colonyId of selected) {
        await saveAction.mutateAsync({
          id: newId(), colonyId, type, date, notes: notes.trim() || undefined, createdAt,
          treatmentProduct: type === "treatment" ? product.trim() : undefined,
          framesKind: type === "add_frames" || type === "remove_frames" ? "standard" : undefined,
          framesQty: type === "add_frames" || type === "remove_frames" ? Math.max(1, Number(framesQty) || 1) : undefined,
          supersQty: type === "add_super" || type === "remove_super" ? Math.max(1, Number(supersQty) || 1) : undefined,
        });
      }
      if (createTasks) {
        for (const colony of excluded) {
          await saveTask.mutateAsync({
            id: newId(), colonyId: colony.id,
            title: "Pendiente: " + ACTION_LABEL[type].toLowerCase(),
            priority: "normal",
            notes: "Quedó fuera de la acción colectiva del " + date + (notes.trim() ? ". " + notes.trim() : ""),
            createdAt,
          });
        }
      }
      toast.success(selected.length + " registradas" + (createTasks && excluded.length ? " · " + excluded.length + " tareas pendientes" : ""));
      setSelected(colonies.map((colony) => colony.id)); setNotes(""); setProduct("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo completar la acción");
    } finally { setBusy(false); }
  }

  return <Card className="mb-6 p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="font-display text-lg font-medium">⚡ Acciones del apiario</h2><p className="mt-1 text-sm text-muted-foreground">Aplica una acción a varias colonias y convierte las que queden fuera en tareas.</p></div>
      <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold">{selected.length}/{colonies.length}</span>
    </div>
    <div className="mt-4 flex gap-2">
      <Button type="button" size="sm" variant="outline" onClick={() => setSelected(allSelected ? [] : colonies.map((colony) => colony.id))}>{allSelected ? "Quitar todas" : "Seleccionar todas"}</Button>
      <Button type="button" size="sm" variant="outline" onClick={() => setSelected([])}>Ninguna</Button>
    </div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {colonies.map((colony) => <label key={colony.id} className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 hover:bg-secondary/40">
        <input type="checkbox" checked={selectedSet.has(colony.id)} onChange={() => toggle(colony.id)} className="size-5 accent-primary" />
        <span className="flex-1 font-semibold">{colony.kind === "hive" ? "Colmena" : "Núcleo"} {colony.number}</span>
        {!selectedSet.has(colony.id) ? <span className="text-xs text-amber-700">Pendiente</span> : null}
      </label>)}
    </div>
    <div className="mt-5 grid gap-3 border-t pt-4">
      <label className="grid gap-1 text-sm font-medium">Acción<select className="h-11 rounded-md border border-input bg-card px-3 text-base" value={type} onChange={(event) => setType(event.target.value as ActionType)}>{BULK_TYPES.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium">Fecha<input className="h-11 rounded-md border border-input bg-card px-3 text-base" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
      {type === "treatment" ? <label className="grid gap-1 text-sm font-medium">Producto<input className="h-11 rounded-md border border-input bg-card px-3 text-base" value={product} onChange={(event) => setProduct(event.target.value)} placeholder="Ácido oxálico, timol…" /></label> : null}
      {type === "add_frames" || type === "remove_frames" ? <label className="grid gap-1 text-sm font-medium">Cantidad de marcos<input className="h-11 rounded-md border border-input bg-card px-3 text-base" type="number" min="1" value={framesQty} onChange={(event) => setFramesQty(event.target.value)} /></label> : null}
      {type === "add_super" || type === "remove_super" ? <label className="grid gap-1 text-sm font-medium">Número de alzas<input className="h-11 rounded-md border border-input bg-card px-3 text-base" type="number" min="1" value={supersQty} onChange={(event) => setSupersQty(event.target.value)} /></label> : null}
      <label className="grid gap-1 text-sm font-medium">Observaciones<textarea className="min-h-20 rounded-md border border-input bg-card px-3 py-2 text-base" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      <label className="flex items-center gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" checked={createTasks} onChange={(event) => setCreateTasks(event.target.checked)} className="size-5 accent-primary" /><span><strong>Crear tareas para las que queden fuera</strong><span className="block text-xs text-muted-foreground">{excluded.length} pendientes</span></span></label>
      <Button type="button" disabled={busy || !selected.length} onClick={() => void submit()}>{busy ? "Registrando…" : "Registrar en " + selected.length + " seleccionadas"}</Button>
    </div>
  </Card>;
}
