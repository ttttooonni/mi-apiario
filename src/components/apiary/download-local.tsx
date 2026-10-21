import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { copyBackup, markBackupCreated, saveBackupLocally, useNotebook } from "@/lib/apiary";
import { backupOutcome, shouldMarkBackupDone, type ConfirmAnswer } from "@/lib/apiary/backup-outcome";

type BackupData = Parameters<typeof saveBackupLocally>[0];

function settle(answer: ConfirmAnswer): void {
  if (shouldMarkBackupDone(answer)) markBackupCreated();
}

function askDownloadSaved(data: BackupData, message: string): void {
  toast(message, {
    duration: Infinity,
    action: { label: "Sí", onClick: () => { settle("yes"); toast.success("Copia registrada"); } },
    cancel: {
      label: "No",
      onClick: () => {
        settle("no");
        toast.error("La copia no se ha guardado.", {
          duration: Infinity,
          action: {
            label: "Copiar al portapapeles",
            onClick: () => {
              void copyBackup(data)
                .then(() => { settle("copy-ok"); toast.success("JSON copiado. Pégalo en un archivo .json para guardarlo."); })
                .catch(() => { settle("copy-failed"); toast.error("No se pudo copiar"); });
            },
          },
        });
      },
    },
  });
}

export async function runLocalDownload(data: BackupData): Promise<void> {
  try {
    const outcome = backupOutcome(await saveBackupLocally(data));
    if (outcome.kind === "done") { markBackupCreated(); toast.success(outcome.message); }
    else if (outcome.kind === "confirm") askDownloadSaved(data, outcome.message);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "No se pudo guardar la copia");
  }
}

export function DownloadLocalButton({
  label = "Descargar a este dispositivo",
  variant = "default",
  size = "default",
  className,
  iconOnly = false,
}: {
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  iconOnly?: boolean;
}) {
  const { data } = useNotebook();

  return (
    <Button
      type="button"
      variant={variant}
      size={iconOnly ? "icon" : size}
      className={className}
      aria-label={label}
      onClick={() => void runLocalDownload(data)}
    >
      <Download />
      {iconOnly ? <span className="sr-only">{label}</span> : label}
    </Button>
  );
}
