import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { saveBackupLocally, useNotebook } from "@/lib/apiary";

export async function runLocalDownload(
  data: Parameters<typeof saveBackupLocally>[0],
): Promise<void> {
  try {
    const result = await saveBackupLocally(data);
    if (result === "saved") toast.success("Copia guardada en este dispositivo");
    else if (result === "downloaded") toast.success("Descarga iniciada");
    else if (result === "copied") {
      toast.success("JSON copiado. Pégalo en un archivo .json para guardarlo.");
    }
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
