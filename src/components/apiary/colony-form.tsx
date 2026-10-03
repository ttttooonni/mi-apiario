import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/apiary/field";
import { COLONY_KIND_LABEL, type Colony, type ColonyKind } from "@/lib/apiary";

export function ColonyFormDialog({
  open,
  onOpenChange,
  kind,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: ColonyKind;
  initial?: Colony | null;
  onSubmit: (values: { number: string; notes?: string }) => Promise<void>;
}) {
  const [number, setNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const noun = COLONY_KIND_LABEL[kind].toLowerCase();

  useEffect(() => {
    if (!open) return;
    setNumber(initial?.number ?? "");
    setNotes(initial?.notes ?? "");
  }, [open, initial]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!number.trim()) return;
    setBusy(true);
    try {
      await onSubmit({ number: number.trim(), notes: notes.trim() || undefined });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initial ? `Editar ${noun}` : `Añadir ${noun}`}
          </DialogTitle>
          <DialogDescription>
            {kind === "hive"
              ? "Las colmenas y los núcleos se registran por separado."
              : "Un núcleo no es una colmena. Queda identificado como tal en todo el historial."}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
          <Field label="Número" htmlFor="colony-number" hint="Por ejemplo 24 o N1">
            <Input
              id="colony-number"
              value={number}
              onChange={(event) => setNumber(event.target.value)}
              required
              autoFocus
            />
          </Field>
          <Field label="Notas" htmlFor="colony-notes" hint="Opcional">
            <Textarea
              id="colony-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy || !number.trim()}>
              {initial ? "Guardar" : "Añadir"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
