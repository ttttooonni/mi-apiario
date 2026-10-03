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
import type { Apiary } from "@/lib/apiary";

export function ApiaryFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Apiary | null;
  onSubmit: (values: { name: string; location: string; notes?: string }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setLocation(initial?.location ?? "");
    setNotes(initial?.notes ?? "");
  }, [open, initial]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        location: location.trim(),
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
          <DialogTitle>{initial ? "Editar apiario" : "Nuevo apiario"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Actualiza el nombre o la ubicación."
              : "Cada apiario agrupa colmenas y núcleos."}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
          <Field label="Nombre" htmlFor="apiary-name">
            <Input
              id="apiary-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="La Dehesa"
              required
              autoFocus
            />
          </Field>
          <Field label="Ubicación" htmlFor="apiary-location">
            <Input
              id="apiary-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Valencia de Alcántara, Cáceres"
            />
          </Field>
          <Field label="Notas" htmlFor="apiary-notes" hint="Opcional">
            <Textarea
              id="apiary-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy || !name.trim()}>
              {initial ? "Guardar" : "Crear apiario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
