import { useEffect, useState } from "react";
import { Field } from "@/components/apiary/field";
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
import { todayISO } from "@/lib/apiary";

export function YearCloseDialog({
  open,
  onOpenChange,
  year,
  defaultHives,
  defaultNucs,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  defaultHives: number;
  defaultNucs: number;
  onSubmit: (values: {
    hives: number;
    nucs: number;
    notes?: string;
  }) => Promise<void>;
}) {
  const [hives, setHives] = useState(String(defaultHives));
  const [nucs, setNucs] = useState(String(defaultNucs));
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHives(String(defaultHives));
    setNucs(String(defaultNucs));
    setNotes("");
  }, [open, defaultHives, defaultNucs]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSubmit({
        hives: Number(hives),
        nucs: Number(nucs),
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cerrar {year}</DialogTitle>
          <DialogDescription>
            Guarda el número de colmenas y núcleos de ese año. No uses las cifras actuales si el
            censo ya ha cambiado. Hoy es {todayISO()}.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Colmenas" htmlFor="close-hives">
              <Input
                id="close-hives"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={hives}
                onChange={(event) => setHives(event.target.value)}
                required
              />
            </Field>
            <Field label="Núcleos" htmlFor="close-nucs">
              <Input
                id="close-nucs"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={nucs}
                onChange={(event) => setNucs(event.target.value)}
                required
              />
            </Field>
          </div>
          <Field label="Notas" htmlFor="close-notes" hint="Opcional">
            <Textarea
              id="close-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              Guardar cierre
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
