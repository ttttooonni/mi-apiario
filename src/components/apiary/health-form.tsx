import { useEffect, useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  COLONY_KIND_LABEL,
  HEALTH_KIND_LABEL,
  HEALTH_TOPIC_LABEL,
  HEALTH_TOPIC_ORDER,
  VARROA_PRODUCTS,
  coloniesOf,
  newId,
  nowIso,
  sortColonies,
  todayISO,
  type AppState,
  type HealthKind,
  type HealthRecord,
  type HealthTopic,
} from "@/lib/apiary";

export function HealthFormDialog({
  open,
  onOpenChange,
  state,
  presetColonyId,
  presetTopic,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: AppState;
  presetColonyId?: string;
  presetTopic?: HealthTopic;
  onSubmit: (rows: HealthRecord[]) => Promise<void>;
}) {
  const [topic, setTopic] = useState<HealthTopic>(presetTopic ?? "varroa");
  const [kind, setKind] = useState<HealthKind>("treatment");
  const [colonyId, setColonyId] = useState(presetColonyId ?? "");
  const [date, setDate] = useState(todayISO());
  const [product, setProduct] = useState<string>(VARROA_PRODUCTS[0]);
  const [customProduct, setCustomProduct] = useState("");
  const [notes, setNotes] = useState("");
  const [wholeApiary, setWholeApiary] = useState(false);
  const [busy, setBusy] = useState(false);

  const colony = state.colonies.find((item) => item.id === colonyId);
  const apiaryColonies = colony ? coloniesOf(state, colony.apiaryId) : [];

  useEffect(() => {
    if (!open) return;
    setTopic(presetTopic ?? "varroa");
    setKind((presetTopic ?? "varroa") === "varroa" ? "treatment" : "observation");
    setColonyId(presetColonyId ?? state.colonies[0]?.id ?? "");
    setDate(todayISO());
    setProduct(VARROA_PRODUCTS[0]);
    setCustomProduct("");
    setNotes("");
    setWholeApiary(false);
  }, [open, presetColonyId, presetTopic, state.colonies]);

  const needsProduct = kind === "treatment";
  const resolvedProduct = product === "__other" ? customProduct.trim() : product;

  const canSubmit = useMemo(() => {
    if (!colonyId || !date) return false;
    if (needsProduct && !resolvedProduct) return false;
    return true;
  }, [colonyId, date, needsProduct, resolvedProduct]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || !colony) return;
    setBusy(true);
    try {
      const targets = wholeApiary ? apiaryColonies : [colony];
      const createdAt = nowIso();
      const rows: HealthRecord[] = targets.map((item) => ({
        id: newId(),
        colonyId: item.id,
        topic,
        kind,
        date,
        product: needsProduct ? resolvedProduct : undefined,
        notes: notes.trim() || undefined,
        createdAt,
      }));
      await onSubmit(rows);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  const sortedColonies = sortColonies(state.colonies);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registro sanitario</DialogTitle>
          <DialogDescription>
            Varroa y el resto de vigilancia se anotan por colonia, con fecha y, si hay
            tratamiento, el producto usado.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
          <Field label="Tema">
            <Select value={topic} onValueChange={(value) => setTopic(value as HealthTopic)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HEALTH_TOPIC_ORDER.map((item) => (
                  <SelectItem key={item} value={item}>
                    {HEALTH_TOPIC_LABEL[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Tipo">
            <Select value={kind} onValueChange={(value) => setKind(value as HealthKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(HEALTH_KIND_LABEL) as HealthKind[]).map((item) => (
                  <SelectItem key={item} value={item}>
                    {HEALTH_KIND_LABEL[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Colmena o núcleo">
            <Select value={colonyId} onValueChange={setColonyId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {sortedColonies.map((item) => {
                  const apiary = state.apiaries.find((row) => row.id === item.apiaryId);
                  return (
                    <SelectItem key={item.id} value={item.id}>
                      {COLONY_KIND_LABEL[item.kind]} {item.number}
                      {apiary ? ` · ${apiary.name}` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </Field>

          {topic === "varroa" && kind === "treatment" && apiaryColonies.length > 1 ? (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-primary"
                checked={wholeApiary}
                onChange={(event) => setWholeApiary(event.target.checked)}
              />
              <span>
                Aplicar a todo el apiario
                {colony ? ` (${apiaryColonies.length} colonias)` : ""}
              </span>
            </label>
          ) : null}

          <Field label="Fecha" htmlFor="health-date">
            <Input
              id="health-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </Field>

          {needsProduct ? (
            <>
              <Field label="Producto">
                <Select value={product} onValueChange={setProduct}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VARROA_PRODUCTS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                    <SelectItem value="__other">Otro producto</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {product === "__other" ? (
                <Field label="Nombre del producto" htmlFor="health-product">
                  <Input
                    id="health-product"
                    value={customProduct}
                    onChange={(event) => setCustomProduct(event.target.value)}
                    required
                  />
                </Field>
              ) : null}
            </>
          ) : null}

          <Field label="Nota" htmlFor="health-notes" hint="Opcional">
            <Textarea
              id="health-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Dosis, temperatura, cuadro de cría, retirada de tiras…"
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy || !canSubmit}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
