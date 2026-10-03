import { useEffect, useState } from "react";
import { Field } from "@/components/apiary/field";
import { QueenSwatch } from "@/components/apiary/queen-swatch";
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
import { queenColorFromDate, QUEEN_COLOR_META, todayISO } from "@/lib/apiary";

export function QueenFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { introducedAt: string; origin?: string }) => Promise<void>;
}) {
  const [introducedAt, setIntroducedAt] = useState(todayISO());
  const [origin, setOrigin] = useState("");
  const [busy, setBusy] = useState(false);
  const color = QUEEN_COLOR_META[queenColorFromDate(introducedAt)];

  useEffect(() => {
    if (!open) return;
    setIntroducedAt(todayISO());
    setOrigin("");
  }, [open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSubmit({
        introducedAt,
        origin: origin.trim() || undefined,
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
          <DialogTitle>Registrar reina</DialogTitle>
          <DialogDescription>
            El color de marcado se asigna automáticamente según el año de introducción.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
          <Field label="Fecha de introducción" htmlFor="queen-date">
            <Input
              id="queen-date"
              type="date"
              value={introducedAt}
              onChange={(event) => setIntroducedAt(event.target.value)}
              required
            />
          </Field>
          <div className="flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5 text-sm">
            <QueenSwatch date={introducedAt} size="lg" />
            <div>
              <p className="font-medium">
                {introducedAt.slice(0, 4)} · {color.label}
              </p>
              <p className="text-xs text-muted-foreground">Código internacional de marcado</p>
            </div>
          </div>
          <Field label="Origen" htmlFor="queen-origin" hint="Opcional">
            <Input
              id="queen-origin"
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              placeholder="Criadero propio, compra, realera…"
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy || !introducedAt}>
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
