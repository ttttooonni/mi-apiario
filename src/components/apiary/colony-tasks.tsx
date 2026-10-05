import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ACTION_LABEL, newId, nowIso, type ColonyTask, type TaskPriority, type ColonyAction } from "@/lib/apiary";

const PRIORITY_LABEL: Record<TaskPriority, string> = { high: "Alta", normal: "Normal", low: "Baja" };

export function ColonyTasks({ colonyId, tasks, onSave, onRemove, onCompleteAction }: {
  colonyId: string;
  tasks: ColonyTask[];
  onSave: (task: ColonyTask) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onCompleteAction?: (action: ColonyAction) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const active = tasks.filter((task) => !task.completedAt).sort((a,b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  const done = tasks.filter((task) => task.completedAt).sort((a,b) => (b.completedAt || "").localeCompare(a.completedAt || "")).slice(0,5);

  async function addTask(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await onSave({ id: crypto.randomUUID(), colonyId, title: title.trim(), dueDate: dueDate || undefined, priority, notes: notes.trim() || undefined, createdAt: new Date().toISOString() });
      setTitle(""); setDueDate(""); setPriority("normal"); setNotes("");
      toast.success("Tarea añadida");
    } catch { toast.error("No se pudo guardar la tarea"); }
    finally { setBusy(false); }
  }

  async function complete(task: ColonyTask) {
    try {
      const completedAt = new Date().toISOString();
      if (task.actionType && onCompleteAction) {
        await onCompleteAction({ id: newId(), colonyId, type: task.actionType, date: task.dueDate || completedAt.slice(0, 10), notes: task.notes, createdAt: completedAt });
      }
      await onSave({ ...task, completedAt });
      toast.success(task.actionType ? "Tarea completada y acción registrada" : "Tarea completada");
    }
    catch { toast.error("No se pudo actualizar la tarea"); }
  }

  return <section className="mb-6">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div><h2 className="font-display text-xl font-medium">Tareas pendientes</h2><p className="text-sm text-muted-foreground">Seguimiento práctico de esta colonia</p></div>
      <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold tabular-nums">{active.length}</span>
    </div>
    <Card className="p-4 sm:p-5">
      {active.length ? <ul className="divide-y divide-border">
        {active.map((task) => <li key={task.id} className="flex items-start gap-3 py-3 first:pt-0">
          <input type="checkbox" aria-label={`Completar: ${task.title}`} className="mt-1 size-5 accent-primary" onChange={() => void complete(task)} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><p className="font-medium">{task.title}</p>{task.actionType ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{ACTION_LABEL[task.actionType]}</span> : null}<span className={`rounded-full px-2 py-0.5 text-xs ${task.priority === "high" ? "bg-amber-100 text-amber-900" : "bg-secondary text-secondary-foreground"}`}>{PRIORITY_LABEL[task.priority]}</span></div>
            {task.dueDate ? <p className="mt-1 text-sm text-muted-foreground">Fecha: {new Date(`${task.dueDate}T12:00:00`).toLocaleDateString("es-ES")}</p> : null}
            {task.notes ? <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{task.notes}</p> : null}
          </div>
          <button type="button" className="text-sm text-muted-foreground hover:text-destructive" onClick={() => { if (window.confirm("¿Eliminar esta tarea?")) void onRemove(task.id); }}>Eliminar</button>
        </li>)}
      </ul> : <p className="py-2 text-sm text-muted-foreground">No hay tareas pendientes para esta colonia.</p>}
      <form onSubmit={(event) => void addTask(event)} className="mt-4 grid gap-3 border-t pt-4">
        <label className="grid gap-1 text-sm font-medium">Nueva tarea <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Revisar puesta, añadir alza…" maxLength={200} required /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm font-medium">Fecha prevista <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>
          <label className="grid gap-1 text-sm font-medium">Prioridad <select className="h-11 rounded-md border border-input bg-card px-3 text-base" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}><option value="high">Alta</option><option value="normal">Normal</option><option value="low">Baja</option></select></label>
        </div>
        <label className="grid gap-1 text-sm font-medium">Nota (opcional) <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Detalles para cuando vuelvas al apiario" /></label>
        <div><Button type="submit" disabled={busy || !title.trim()}>{busy ? "Guardando…" : "Añadir tarea"}</Button></div>
      </form>
      {done.length ? <details className="mt-4 border-t pt-3"><summary className="cursor-pointer text-sm font-medium text-muted-foreground">Completadas recientes ({done.length})</summary><ul className="mt-2 space-y-2">{done.map((task) => <li key={task.id} className="flex items-start justify-between gap-2 text-sm"><span className="text-muted-foreground line-through">{task.title}</span><button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => { if (window.confirm("¿Eliminar esta tarea completada?")) void onRemove(task.id); }}>Eliminar</button></li>)}</ul></details> : null}
    </Card>
  </section>;
}
