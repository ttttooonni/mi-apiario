import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/apiary/confirm-delete";
import { DownloadLocalButton } from "@/components/apiary/download-local";
import { InstallAppButton } from "@/components/apiary/install-app";
import { QueenSwatch } from "@/components/apiary/queen-swatch";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  copyBackup,
  formatStorageSize,
  getPersistStatus,
  QUEEN_COLOR_CYCLE,
  QUEEN_COLOR_META,
  useAppMutations,
  useNotebook,
} from "@/lib/apiary";

export const Route = createFileRoute("/datos")({ component: DataPage });

function DataPage() {
  const { data } = useNotebook();
  const { restore, loadSample, resetAll } = useAppMutations();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const storage = getPersistStatus();

  function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setPendingFile(text);
      setImportOpen(true);
    };
    reader.onerror = () => toast.error("No se pudo leer el archivo");
    reader.readAsText(file);
  }

  return (
    <div>
      <PageHeader
        title="Datos"
        description="Todo se guarda en este dispositivo. Una copia de seguridad no es opcional."
      />

      <div className="grid gap-4">
        <Card className="p-5">
          <h2 className="font-display text-lg font-medium">Este dispositivo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Instala mi-apiario en el teléfono, el iPad o el ordenador. Funciona sin visor y sin
            cuenta. Los datos no se envían a ningún servidor.
          </p>
          <div className="mt-4">
            <InstallAppButton label="Descargar aplicación" />
          </div>
          <p className="mt-3 text-sm tabular-nums text-muted-foreground">
            {data.apiaries.length} apiarios · {data.colonies.length} colonias ·{" "}
            {data.actions.length} acciones · {data.production.length} lotes
            {storage.bytes > 0 ? ` · ${formatStorageSize(storage.bytes)}` : ""}
          </p>
          {storage.failed ? (
            <p className="mt-2 text-sm text-destructive">
              El último guardado no cupo en este navegador. Descarga una copia JSON ahora.
            </p>
          ) : storage.nearLimit ? (
            <p className="mt-2 text-sm text-muted-foreground">
              El cuaderno está ocupando casi todo el espacio del navegador (
              {formatStorageSize(storage.bytes)} de {formatStorageSize(storage.limit)}). Descarga
              una copia.
            </p>
          ) : null}
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-lg font-medium">Copia de seguridad</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Exporta un JSON con apiarios, colonias, reinas, acciones, sanidad, producción y
            cierres anuales. Al importar, se sustituyen todos los datos actuales.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <DownloadLocalButton label="Descargar JSON" />
            <Button
              variant="outline"
              onClick={() =>
                void copyBackup(data)
                  .then(() => toast.success("JSON copiado"))
                  .catch(() => toast.error("No se pudo copiar"))
              }
            >
              Copiar JSON
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Importar copia
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={onPickFile}
            />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-lg font-medium">Color de las reinas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Se calcula solo, según el último dígito del año de introducción. No se elige a mano.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {QUEEN_COLOR_CYCLE.map((item) => (
              <li key={item.color} className="flex items-center gap-3 text-sm">
                <QueenSwatch color={item.color} />
                <span>
                  Años …{item.digits.replace(" y ", " y …")} · {QUEEN_COLOR_META[item.color].label}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-lg font-medium">Ejemplo y vaciado</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            El ejemplo sustituye los datos actuales por un cuaderno de demostración. Úsalo para
            explorar; restaura tu copia después.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setSampleOpen(true)}>
              Cargar ejemplo
            </Button>
            <Button variant="outline" onClick={() => setResetOpen(true)}>
              Vaciar cuaderno
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDelete
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Importar copia"
        description="Se sustituirán todos los datos actuales por el contenido del archivo."
        confirmLabel="Importar"
        onConfirm={async () => {
          if (!pendingFile) return;
          try {
            await restore.mutateAsync(pendingFile);
            toast.success("Copia restaurada");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo importar");
          } finally {
            setPendingFile(null);
          }
        }}
      />

      <ConfirmDelete
        open={sampleOpen}
        onOpenChange={setSampleOpen}
        title="Cargar datos de ejemplo"
        description="Se sustituirán los datos actuales por un apiario de demostración."
        confirmLabel="Cargar ejemplo"
        onConfirm={async () => {
          await loadSample.mutateAsync();
          toast.success("Ejemplo cargado");
        }}
      />

      <ConfirmDelete
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Vaciar el cuaderno"
        description="Se eliminarán apiarios, colonias, historial y producción de este dispositivo."
        confirmLabel="Vaciar"
        onConfirm={async () => {
          await resetAll.mutateAsync();
          toast.success("Cuaderno vacío");
        }}
      />
    </div>
  );
}
