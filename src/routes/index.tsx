import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Activity, Archive, ArrowRight, CalendarClock, CheckSquare, Flower2, MapPin, Plus, ScanLine, ShieldCheck } from "lucide-react";
import { ApiaryFormDialog } from "@/components/apiary/apiary-form";
import { EmptyState } from "@/components/apiary/empty-state";
import { InstallAppButton } from "@/components/apiary/install-app";
import { useTutorial } from "@/components/apiary/tutorial";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  coloniesMissingVarroa,
  currentYear,
  formatKg,
  hiveCount,
  honeyThisYear,
  newId,
  nowIso,
  nucCount,
  PRODUCT_LABEL,
  PRODUCT_ORDER,
  productionOfYear,
  useAppMutations,
  useNotebook,
  varroaTreatedIds,
  COLONY_KIND_LABEL,
} from "@/lib/apiary";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { data, error } = useNotebook();
  const { saveApiary, saveTask, loadSample } = useAppMutations();
  const { show } = useTutorial();
  const [createOpen, setCreateOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [taskApiaryId, setTaskApiaryId] = useState("");
  const [taskColonyId, setTaskColonyId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<"high" | "normal" | "low">("normal");
  const [taskNotes, setTaskNotes] = useState("");
  const [taskBusy, setTaskBusy] = useState(false);
  const year = currentYear();

  if (error) {
    return <EmptyState title="No se pueden leer los datos" description={error.message} />;
  }

  const empty = data.apiaries.length === 0;
  const products = productionOfYear(data.production, year);
  const treated = varroaTreatedIds(data, year);
  const pendingVarroa = coloniesMissingVarroa(data, year);
  const pendingTasks = (data.tasks ?? []).filter((task) => !task.completedAt).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  const overdueTasks = pendingTasks.filter((task) => task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10));
  const effectiveApiaryId = taskApiaryId || data.apiaries[0]?.id || "";
  const taskColonies = data.colonies.filter((colony) => colony.apiaryId === effectiveApiaryId);
  const effectiveColonyId = taskColonies.some((colony) => colony.id === taskColonyId) ? taskColonyId : taskColonies[0]?.id || "";

  return (
    <div className="pb-3">
      <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">Temporada {year}</p>
      <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">Inicio</h1>
      <p className="mt-1 mb-5 max-w-xl text-sm text-muted-foreground">Tu apiario, las tareas y los registros importantes.</p>

      {empty ? (
        <EmptyState
          title="Todavía no hay apiarios"
          description="Crea el primero o carga un ejemplo. La guía explica cómo está organizado el cuaderno."
          actions={<><Button onClick={() => setCreateOpen(true)}>Crear apiario</Button><Button variant="outline" disabled={loadSample.isPending} onClick={() => { void loadSample.mutateAsync().then(() => toast.success("Ejemplo cargado")).catch((err: unknown) => toast.error(err instanceof Error ? err.message : "No se pudo cargar")); }}>{loadSample.isPending ? "Cargando…" : "Cargar ejemplo"}</Button><Button variant="ghost" onClick={show}>Ver guía</Button></>}
        />
      ) : (
        <>
          <Card className="p-2.5 sm:p-3">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
              <Link to="/apiarios" className="group flex min-h-20 items-center gap-3 rounded-xl p-3 transition-colors hover:bg-secondary/60 focus-visible:outline-2 focus-visible:outline-primary">
                <MapPin className="size-5 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0"><p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Apiarios</p><p className="font-display text-2xl leading-tight tabular-nums">{data.apiaries.length}</p></div><ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground opacity-70" />
              </Link>
              <Link to="/apiarios" className="group flex min-h-20 items-center gap-3 rounded-xl p-3 transition-colors hover:bg-secondary/60 focus-visible:outline-2 focus-visible:outline-primary">
                <Warehouse className="size-5 shrink-0 text-honey" aria-hidden="true" />
                <div className="min-w-0"><p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Colmenas</p><p className="font-display text-2xl leading-tight tabular-nums">{hiveCount(data)}</p></div><ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground opacity-70" />
              </Link>
              <Link to="/apiarios" className="group flex min-h-20 items-center gap-3 rounded-xl p-3 transition-colors hover:bg-secondary/60 focus-visible:outline-2 focus-visible:outline-primary">
                <Flower2 className="size-5 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0"><p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Núcleos</p><p className="font-display text-2xl leading-tight tabular-nums">{nucCount(data)}</p></div><ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground opacity-70" />
              </Link>
              <Link to="/produccion" className="group flex min-h-20 items-center gap-3 rounded-xl p-3 transition-colors hover:bg-secondary/60 focus-visible:outline-2 focus-visible:outline-primary">
                <span className="text-xl leading-none" aria-hidden="true">🍯</span>
                <div className="min-w-0"><p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Miel {year}</p><p className="font-display text-2xl leading-tight tabular-nums">{formatKg(honeyThisYear(data))}</p></div><ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground opacity-70" />
              </Link>
            </div>
          </Card>

          <div className="mt-4">
            <Link to="/apiarios" className="flex min-h-20 items-center gap-3 rounded-2xl border bg-card px-4 py-4 transition-colors hover:bg-secondary/50">
              <MapPin className="size-6 shrink-0 text-primary" />
              <span className="min-w-0 flex-1"><span className="block font-semibold">Apiarios y colonias</span><span className="mt-1 block text-sm text-muted-foreground">Elige un apiario y gestiona sus colmenas, núcleos, revisiones y fichas.</span></span>
              <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          </div>

          <Card className="mt-4 overflow-hidden p-0">
            <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <CheckSquare className="size-5 shrink-0 text-primary" />
                <div><h2 className="font-display text-xl font-medium">Tareas pendientes</h2><p className="text-xs text-muted-foreground">{overdueTasks.length ? `${overdueTasks.length} vencida${overdueTasks.length === 1 ? "" : "s"} · ` : ""}{pendingTasks.length} por completar</p></div>
              </div>
              <Button size="sm" onClick={() => setTaskFormOpen((open) => !open)}><Plus className="mr-1 size-4" />{taskFormOpen ? "Cerrar" : "Añadir tarea"}</Button>
            </div>
            {taskFormOpen ? (
              <form className="grid gap-3 border-t px-4 py-4" onSubmit={async (event) => {
                event.preventDefault();
                if (!effectiveColonyId || !taskTitle.trim()) {
                  toast.error("Elige una colonia y escribe la tarea");
                  return;
                }
                setTaskBusy(true);
                try {
                  const task = { id: crypto.randomUUID(), colonyId: effectiveColonyId, title: taskTitle.trim(), dueDate: taskDueDate || undefined, priority: taskPriority, notes: taskNotes.trim() || undefined, createdAt: new Date().toISOString() };
                  await saveTask.mutateAsync(task);
                  setTaskTitle(""); setTaskDueDate(""); setTaskPriority("normal"); setTaskNotes(""); setTaskFormOpen(false);
                  toast.success("Tarea guardada");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "No se pudo guardar la tarea");
                } finally { setTaskBusy(false); }
              }}>
                {data.colonies.length ? (
                  <>
                    <label className="grid gap-1 text-sm font-medium">Apiario
                      <select className="h-11 rounded-md border border-input bg-card px-3 text-base" value={effectiveApiaryId} onChange={(event) => { setTaskApiaryId(event.target.value); setTaskColonyId(""); }}>
                        {data.apiaries.map((apiary) => <option key={apiary.id} value={apiary.id}>{apiary.name}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-medium">Colmena o núcleo
                      <select className="h-11 rounded-md border border-input bg-card px-3 text-base" value={effectiveColonyId} onChange={(event) => setTaskColonyId(event.target.value)} required>
                        {taskColonies.map((colony) => <option key={colony.id} value={colony.id}>{COLONY_KIND_LABEL[colony.kind]} {colony.number}</option>)}
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-medium">Tarea
                      <Input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Ej. Revisar puesta o colocar alza" maxLength={200} required />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-1 text-sm font-medium">Fecha prevista
                        <Input type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} />
                      </label>
                      <label className="grid gap-1 text-sm font-medium">Prioridad
                        <select className="h-11 rounded-md border border-input bg-card px-3 text-base" value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as "high" | "normal" | "low")}>
                          <option value="high">Alta</option><option value="normal">Normal</option><option value="low">Baja</option>
                        </select>
                      </label>
                    </div>
                    <label className="grid gap-1 text-sm font-medium">Nota (opcional)
                      <Textarea value={taskNotes} onChange={(event) => setTaskNotes(event.target.value)} rows={2} placeholder="Detalles para la próxima visita" />
                    </label>
                    <div className="flex flex-wrap gap-2"><Button type="submit" disabled={taskBusy || !effectiveColonyId || !taskTitle.trim()}>{taskBusy ? "Guardando…" : "Guardar tarea"}</Button><Button type="button" variant="ghost" onClick={() => setTaskFormOpen(false)}>Cancelar</Button></div>
                  </>
                ) : (
                  <div className="rounded-xl bg-secondary/50 p-3 text-sm text-muted-foreground">Primero crea una colmena o núcleo desde «Apiarios y colonias» para poder vincular la tarea.</div>
                )}
              </form>
            ) : null}
            {pendingTasks.length ? (
              <div>
                {pendingTasks.slice(0, 5).map((task) => {
                  const colony = data.colonies.find((item) => item.id === task.colonyId);
                  const apiary = colony ? data.apiaries.find((item) => item.id === colony.apiaryId) : undefined;
                  const overdue = Boolean(task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10));
                  return <Link key={task.id} to="/colonias/$colonyId" params={{ colonyId: task.colonyId }} className="flex items-center gap-3 border-t px-4 py-3 transition-colors hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-primary">
                    <span className={"flex size-11 shrink-0 flex-col items-center justify-center rounded-xl text-xs font-semibold leading-tight " + (overdue ? "bg-red-100 text-red-800" : task.priority === "high" ? "bg-amber-100 text-amber-900" : "bg-secondary text-secondary-foreground")}>{task.dueDate ? new Date(task.dueDate + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).replace(".", "") : "—"}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{task.title}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{colony ? COLONY_KIND_LABEL[colony.kind] + " " + colony.number : "Colonia"}{apiary ? " · " + apiary.name : ""}</span></span>
                    <span className={"shrink-0 rounded-full px-2 py-1 text-[11px] font-medium " + (overdue ? "bg-red-100 text-red-800" : task.priority === "high" ? "bg-amber-100 text-amber-900" : "bg-secondary text-secondary-foreground")}>{overdue ? "Vencida" : task.priority === "high" ? "Alta" : "Pendiente"}</span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>;
                })}
                {pendingTasks.length > 5 ? <p className="border-t px-4 py-3 text-xs text-muted-foreground">Mostrando 5 de {pendingTasks.length}. Abre una colonia para ver sus tareas.</p> : null}
              </div>
            ) : <p className="border-t px-4 py-4 text-sm text-muted-foreground">No tienes tareas pendientes. Puedes añadirlas aquí y vincularlas a un apiario y una colmena o núcleo.</p>}
          </Card>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link to="/sanidad" className="rounded-2xl border border-primary/15 bg-primary/5 p-4 transition-colors hover:bg-primary/10">
              <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-6 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="text-xs font-semibold tracking-wide text-primary uppercase">Temporada sanitaria</p><h2 className="mt-1 font-display text-xl font-semibold">Sanidad {year}</h2><p className="mt-1 text-sm text-muted-foreground">{treated.size} de {data.colonies.length} colonias con tratamiento registrado</p><div className="mt-3 flex items-center justify-between text-sm"><span className="font-medium">{pendingVarroa.length} pendientes</span><ArrowRight className="size-4" /></div></div></div>
            </Link>
            <Link to="/produccion" className="rounded-2xl border border-amber-700/15 bg-amber-50/70 p-4 transition-colors hover:bg-amber-50">
              <div className="flex items-start gap-3"><Activity className="mt-0.5 size-6 shrink-0 text-honey" /><div className="min-w-0 flex-1"><p className="text-xs font-semibold tracking-wide text-honey uppercase">Producción anual</p><h2 className="mt-1 font-display text-xl font-semibold">Miel {year}</h2><p className="mt-1 text-sm text-muted-foreground">{formatKg(honeyThisYear(data))} registrados</p><div className="mt-3 flex items-center justify-between text-sm"><span className="font-medium">Ver producción</span><ArrowRight className="size-4" /></div></div></div>
            </Link>
          </div>

          <Card className="mt-4 p-4">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><CalendarClock className="size-5 text-muted-foreground" /><div><h2 className="font-display text-lg font-medium">Resumen de producción</h2><p className="text-xs text-muted-foreground">Registros de {year}</p></div></div><Link to="/produccion" className="text-sm font-semibold text-primary">Ver todo →</Link></div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-5">{PRODUCT_ORDER.map((product) => <div key={product}><dt className="text-xs text-muted-foreground">{PRODUCT_LABEL[product]}</dt><dd className="mt-0.5 font-semibold tabular-nums">{products[product] > 0 ? formatKg(products[product]) : "—"}</dd></div>)}</dl>
          </Card>

          <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => setCreateOpen(true)}>Nuevo apiario</Button><Button variant="outline" asChild><Link to="/apiarios">Ver apiarios</Link></Button><Button variant="outline" asChild><Link to="/historico"><Archive className="mr-2 size-4" />Histórico</Link></Button><InstallAppButton variant="outline" label="Instalar aplicación" /></div>
        </>
      )}
      <ApiaryFormDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={async (values) => { await saveApiary.mutateAsync({ id: newId(), ...values, createdAt: nowIso(), updatedAt: nowIso() }); toast.success("Apiario creado"); }} />
    </div>
  );
}
