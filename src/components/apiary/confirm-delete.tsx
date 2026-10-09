import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ConfirmDelete({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Eliminar",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo completar la operación.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => { if (!busy) onOpenChange(nextOpen); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: "destructive" }))}
            disabled={busy}
            onClick={(event) => { event.preventDefault(); void confirm(); }}
          >{busy ? "Procesando…" : confirmLabel}
          
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
