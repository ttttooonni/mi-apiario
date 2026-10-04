import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ApiaryFormDialog } from "@/components/apiary/apiary-form";
import { EmptyState } from "@/components/apiary/empty-state";
import { InstallAppButton } from "@/components/apiary/install-app";
import { useTutorial } from "@/components/apiary/tutorial";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  const { saveApiary, loadSample } = useAppMutations();
  const { show } = useTutorial();
  const [createOpen, setCreateOpen] = useState(false);
  const year = currentYear();

  if (error) {
    return <EmptyState title="No se pueden leer los datos" description={error.message} />;
  }

  const empty = data.apiaries.length === 0;
  const products = productionOfYear(data.production, year);
  const treated = varroaTreatedIds(data, year);
  const pendingVarroa = coloniesMissingVarroa(data, year);
  const pendingTasks = (data.tasks ?? []).filter((task) => !task.completedAt).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));

  return (
    <div>
      <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">Temporada {year}</p>
      <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">Inicio</h1>
      <p className="mt-1 mb-6 max-w-xl text-sm text-muted-foreground">Cuaderno de explotación. Lo importante, a mano.</p>

      {empty ? (
        <EmptyState
          title="Todavía no hay apiarios"
          description="Crea el primero o carga un ejemplo. La guía explica cómo está organizado el cuaderno."
          actions={<><Button onClick={() => setCreateOpen(true)}>Crear apiario</Button><Button variant="outline" disabled={loadSample.isPending} onClick={() => { void loadSample.mutateAsync().then(() => toast.success("Ejemplo cargado")).catch((err: unknown) => toast.error(err instanceof Error ? err.message : "No se pudo cargar")); }}>{loadSample.isPending ? "Cargando…" : "Cargar ejemplo"}</Button><Button variant="ghost" onClick={show}>Ver guía</Button></>}
        />
      ) : (
        <>
          <Card className="p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-medium">Resumen del apiario</h2>
              <span className="text-xs text-muted-foreground">{year}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Link to="/apiarios" className="group rounded-xl border border-border/80 bg-background/70 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="block text-xs font-medium tracking-wide text-muted-foreground">Apiarios</span>
                <span className="mt-1 block font-display text-2xl font-semibold tabular-nums group-hover:text-primary">{data.apiaries.length}</span>
                <span className="mt-1 block text-xs text-muted-foreground">Ver apiarios →</span>
              </Link>
              <Link to="/colonias" className="group rounded-xl border border-border/80 bg-background/70 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="block text-xs font-medium tracking-wide text-muted-foreground">Colmenas</span>
                <span className="mt-1 block font-display text-2xl font-semibold tabular-nums group-hover:text-primary">{hiveCount(data)}</span>
                <span className="mt-1 block text-xs text-muted-foreground">Ver colonias →</span>
              </Link>
              <Link to="/colonias" className="group rounded-xl border border-border/80 bg-background/70 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="block text-xs font-medium tracking-wide text-muted-foreground">Núcleos</span>
                <span className="mt-1 block font-display text-2xl font-semibold tabular-nums group-hover:text-primary">{nucCount(data)}</span>
                <span className="mt-1 block text-xs text-muted-foreground">Ver colonias →</span>
              </Link>
              <Link to="/produccion" className="group rounded-xl border border-border/80 bg-background/70 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="block text-xs font-medium tracking-wide text-muted-foreground">Miel {year}</span>
                <span className="mt-1 block font-display text-2xl font-semibold tabular-nums group-hover:text-primary">{formatKg(honeyThisYear(data))}</span>
                <span className="mt-1 block text-xs text-muted-foreground">Ver producción →</span>
              </Link>
            </div>
          </Card>

          <Card className="mt-5 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="font-display text-xl font-medium">Tareas pendientes</h2><p className="mt-1 text-sm text-muted-foreground">Lo próximo que tienes que revisar en el apiario.</p></div>
              <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold tabular-nums">{pendingTasks.length}</span>
            </div>
            {pendingTasks.length ? <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm">
              <thead><tr className="border-b text-xs tracking-wide text-muted-foreground uppercase"><th className="py-2 pr-3 font-medium">Tarea</th><th className="py-2 pr-3 font-medium">Colonia</th><th className="py-2 pr-3 font-medium">Fecha</th><th className="py-2 font-medium">Prioridad</th></tr></thead>
              <tbody>{pendingTasks.slice(0, 8).map((task) => { const colony = data.colonies.find((item) => item.id === task.colonyId); const apiary = colony ? data.apiaries.find((item) => item.id === colony.apiaryId) : undefined; return <tr key={task.id} className="border-b last:border-0"><td className="py-3 pr-3 font-medium"><Link to="/colonias/$colonyId" params={{ colonyId: task.colonyId }} className="hover:text-primary hover:underline">{task.title}</Link>{task.notes ? <p className="mt-0.5 max-w-48 truncate text-xs font-normal text-muted-foreground">{task.notes}</p> : null}</td><td className="py-3 pr-3"><Link to="/colonias/$colonyId" params={{ colonyId: task.colonyId }} className="text-muted-foreground hover:text-primary">{colony ? COLONY_KIND_LABEL[colony.kind] + " " + colony.number : "Colonia"}{apiary ? " · " + apiary.name : ""}</Link></td><td className="py-3 pr-3 whitespace-nowrap text-muted-foreground">{task.dueDate ? new Date(task.dueDate + "T12:00:00").toLocaleDateString("es-ES") : "—"}</td><td className="py-3"><span className={"rounded-full px-2 py-1 text-xs " + (task.priority === "high" ? "bg-amber-100 text-amber-900" : "bg-secondary text-secondary-foreground")}>{task.priority === "high" ? "Alta" : task.priority === "low" ? "Baja" : "Normal"}</span></td></tr>; })}</tbody>
            </table>{pendingTasks.length > 8 ? <p className="pt-2 text-xs text-muted-foreground">Mostrando 8 de {pendingTasks.length} tareas. Entra en una colonia para gestionar su lista.</p> : null}</div> : <p className="mt-3 rounded-xl bg-secondary/50 p-3 text-sm text-muted-foreground">No tienes tareas pendientes. Puedes añadirlas desde la ficha de cada colmena o núcleo.</p>}
          </Card>

          <Card className="mt-5 border-primary/20 bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Temporada sanitaria</p>
                <h2 className="mt-1 font-display text-2xl font-semibold">Sanidad {year}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Seguimiento de varroa de todas tus colonias.</p>
              </div>
              <Button asChild variant="outline" className="min-h-11"><Link to="/sanidad">Abrir sanidad</Link></Button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-secondary/70 p-4">
                <p className="text-sm text-muted-foreground">Con tratamiento</p>
                <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{treated.size}<span className="text-lg font-normal text-muted-foreground"> / {data.colonies.length}</span></p>
                <p className="mt-1 text-xs text-muted-foreground">Colonias registradas</p>
              </div>
              <div className="rounded-xl border border-amber-700/20 bg-amber-50/60 p-4 dark:bg-amber-950/20">
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{pendingVarroa.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Sin tratamiento registrado este año</p>
              </div>
            </div>
            {pendingVarroa.length > 0 && <p className="mt-3 text-sm text-muted-foreground">Pendientes: {pendingVarroa.slice(0, 4).map((item) => item.number).join(", ")}{pendingVarroa.length > 4 ? "…" : ""}</p>}
            <div className="mt-4 border-t pt-3"><Link to="/sanidad" className="text-sm font-medium text-primary hover:underline">Consultar esta temporada y años anteriores →</Link></div>
          </Card>

          <Card className="mt-4 p-5">
            <div className="flex items-baseline justify-between gap-3"><h2 className="font-display text-lg font-medium">Producción {year}</h2><Link to="/produccion" className="text-sm text-primary hover:underline">Ver producción</Link></div>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5">{PRODUCT_ORDER.map((product) => <div key={product}><dt className="text-xs tracking-wide text-muted-foreground uppercase">{PRODUCT_LABEL[product]}</dt><dd className="mt-0.5 font-medium tabular-nums">{products[product] > 0 ? formatKg(products[product]) : "—"}</dd></div>)}</dl>
          </Card>
          <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => setCreateOpen(true)}>Nuevo apiario</Button><Button variant="outline" asChild><Link to="/apiarios">Ver apiarios</Link></Button><InstallAppButton variant="outline" label="Descargar aplicación" /></div>
        </>
      )}
      <ApiaryFormDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={async (values) => { await saveApiary.mutateAsync({ id: newId(), ...values, createdAt: nowIso(), updatedAt: nowIso() }); toast.success("Apiario creado"); }} />
    </div>
  );
}
