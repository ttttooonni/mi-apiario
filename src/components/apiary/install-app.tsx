import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Download, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { publicUrl } from "@/lib/asset";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  armInstallCapture,
  detectInstallKind,
  iosInstallHref,
  openAppInBrowser,
  promptNativeInstall,
  subscribeInstall,
  type InstallKind,
} from "@/lib/apiary/install-app";

type InstallContextValue = {
  show: () => void;
  installed: boolean;
};

const InstallContext = createContext<InstallContextValue>({
  show: () => {},
  installed: false,
});

export function useInstallApp() {
  return useContext(InstallContext);
}

export function InstallProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<InstallKind>("browser");

  const refresh = useCallback(() => {
    setKind(detectInstallKind());
  }, []);

  useEffect(() => {
    const disarm = armInstallCapture();
    refresh();
    const unsub = subscribeInstall(refresh);
    return () => {
      disarm();
      unsub();
    };
  }, [refresh]);

  const show = useCallback(() => {
    refresh();
    setOpen(true);
  }, [refresh]);

  const value = useMemo(
    () => ({ show, installed: kind === "installed" }),
    [show, kind],
  );

  return (
    <InstallContext.Provider value={value}>
      {children}
      <InstallDialog open={open} kind={kind} onOpenChange={setOpen} onRefresh={refresh} />
    </InstallContext.Provider>
  );
}

export function InstallAppButton({
  label = "Descargar aplicación",
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
  const { show, installed } = useInstallApp();
  if (installed) return null;

  return (
    <Button
      type="button"
      variant={variant}
      size={iconOnly ? "icon" : size}
      className={className}
      aria-label={label}
      onClick={show}
    >
      <Download />
      {iconOnly ? <span className="sr-only">{label}</span> : label}
    </Button>
  );
}

function InstallDialog({
  open,
  kind,
  onOpenChange,
  onRefresh,
}: {
  open: boolean;
  kind: InstallKind;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handlePrimary() {
    if (kind === "installed") {
      onOpenChange(false);
      return;
    }
    if (kind === "prompt") {
      setBusy(true);
      try {
        const outcome = await promptNativeInstall();
        onRefresh();
        if (outcome === "accepted") {
          toast.success("Aplicación instalada");
          onOpenChange(false);
        }
      } catch {
        toast.error("No se pudo completar la instalación");
      } finally {
        setBusy(false);
      }
      return;
    }
    if (kind === "ios") {
      window.location.assign(iosInstallHref());
      return;
    }
    const result = openAppInBrowser();
    if (result === "opened") {
      onOpenChange(false);
      toast.success("Se ha abierto mi-apiario en el navegador. Completa la instalación desde el menú del navegador.");
    } else {
      toast.message("El navegador bloqueó la nueva pestaña. Abre mi-apiario en el navegador y usa Instalar aplicación en el menú.");
    }
  }

  const copy =
    kind === "installed"
      ? {
          title: "Ya está instalada",
          body: "mi-apiario se está ejecutando como aplicación en este dispositivo.",
          action: "Entendido",
        }
      : kind === "prompt"
        ? {
            title: "Descargar aplicación",
            body: "Se instalará en este dispositivo, a pantalla completa y sin visor. Los datos siguen siendo solo tuyos.",
            action: "Instalar ahora",
          }
        : kind === "ios"
          ? {
              title: "Descargar aplicación",
              body: "Mi Apiario se instala como una aplicación desde Safari. No necesitas descargar nada desde App Store.",
              action: "Entendido",
            }
          : {
              title: "Descargar aplicación",
              body: "Puedes instalar Mi Apiario en tu móvil para abrirlo como una aplicación. Sigue los pasos de tu dispositivo.",
              action: "Abrir para instalar",
            };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <img
              src={publicUrl("icon-192.png")}
              alt=""
              width={40}
              height={40}
              className="size-10 rounded-lg ring-1 ring-border/70"
              aria-hidden
            />
            {copy.title}
          </DialogTitle>
          <DialogDescription>{copy.body}</DialogDescription>
        </DialogHeader>
        {kind !== "installed" && kind !== "prompt" ? (
          <div className="grid gap-3">
            <div className="rounded-xl border bg-secondary/40 p-4">
              <div className="flex items-center gap-2 font-semibold"><Smartphone className="size-5 text-primary" /> Android</div>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                <li>Abre Mi Apiario en Chrome o Edge.</li>
                <li>Abre el menú ⋮.</li>
                <li>Pulsa <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>.</li>
              </ol>
            </div>
            <div className="rounded-xl border bg-secondary/40 p-4">
              <div className="flex items-center gap-2 font-semibold"><Smartphone className="size-5 text-primary" /> iPhone / iPad</div>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                <li>Abre Mi Apiario en Safari.</li>
                <li>Pulsa <strong>Compartir</strong>.</li>
                <li>Elige <strong>Añadir a pantalla de inicio</strong>.</li>
              </ol>
            </div>
            <div className="rounded-xl border border-amber-700/20 bg-amber-50/60 p-3 text-sm text-muted-foreground">
              <strong className="text-foreground">💾 Tus datos son tuyos.</strong> Se guardan en tu dispositivo. Haz copias de seguridad periódicas desde la sección de datos.
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Ahora no
          </Button>
          <Button type="button" disabled={busy} onClick={() => void handlePrimary()}>
            {copy.action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
