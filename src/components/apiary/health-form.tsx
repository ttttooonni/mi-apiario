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
import { Card } from "@/components/ui/card";
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
  varroaInfestationPercent,
  varroaLevel,
  VARROA_LEVEL_LABEL,
} from "@/lib/apiary";

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card className="gap-0 p-4"><h3 className="mb-3 text-sm font-semibold">{title}</h3>{children}</Card>;
}

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
  const [varroaMethod, setVarroaMethod] = useState("Observación");
  const [varroaCount, setVarroaCount] = useState("");
  const [varroaSampleSize, setVarroaSampleSize] = useState("");
  const [foodReserve, setFoodReserve] = useState<HealthRecord["foodReserve"]>("good");
  const [pollenReserve, setPollenReserve] = useState<HealthRecord["pollenReserve"]>("good");
  const [feedingNeeded, setFeedingNeeded] = useState(false);
  const [feedingForm, setFeedingForm] = useState<HealthRecord["feedingForm"]>("liquid");
  const [feedingType, setFeedingType] = useState<HealthRecord["feedingType"]>("syrup");
  const [feedingAmount, setFeedingAmount] = useState("");
  const [queenSeen, setQueenSeen] = useState<boolean | undefined>(undefined);
  const [broodStatus, setBroodStatus] = useState<HealthRecord["broodStatus"]>("good");
  const [colonyStrength, setColonyStrength] = useState<HealthRecord["colonyStrength"]>("strong");
  const [behavior, setBehavior] = useState<HealthRecord["behavior"]>("calm");
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
    setVarroaMethod("Observación");
    setVarroaCount("");
    setVarroaSampleSize("");
    setFoodReserve("good");
    setPollenReserve("good");
    setFeedingNeeded(false);
    setFeedingForm("liquid");
    setFeedingType("syrup");
    setFeedingAmount("");
    setQueenSeen(undefined);
    setBroodStatus("good");
    setColonyStrength("strong");
    setBehavior("calm");
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
        varroaMethod: topic === "varroa" || topic === "inspection" ? varroaMethod : undefined,
        varroaCount: topic === "varroa" || topic === "inspection" ? (varroaCount === "" ? undefined : Number(varroaCount)) : undefined,
        varroaSampleSize: topic === "varroa" || topic === "inspection" ? (varroaSampleSize === "" ? undefined : Number(varroaSampleSize)) : undefined,
        foodReserve: topic === "inspection" ? foodReserve : undefined,
        pollenReserve: topic === "inspection" ? pollenReserve : undefined,
        feedingNeeded: topic === "inspection" ? feedingNeeded : undefined,
        feedingForm: topic === "inspection" && feedingNeeded ? feedingForm : undefined,
        feedingType: topic === "inspection" && feedingNeeded ? feedingType : undefined,
        feedingAmount: topic === "inspection" && feedingNeeded ? (feedingAmount.trim() || undefined) : undefined,
        queenSeen: topic === "inspection" ? queenSeen : undefined,
        broodStatus: topic === "inspection" ? broodStatus : undefined,
        colonyStrength: topic === "inspection" ? colonyStrength : undefined,
        behavior: topic === "inspection" ? behavior : undefined,
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

          {(topic === "varroa" || topic === "inspection") ? (
            <CardSection title="🕷️ Varroa">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Método">
                  <Select value={varroaMethod} onValueChange={setVarroaMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Observación">Observación</SelectItem>
                      <SelectItem value="Caída natural">Caída natural</SelectItem>
                      <SelectItem value="Azúcar glas">Azúcar glas</SelectItem>
                      <SelectItem value="Alcohol">Alcohol</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Ácaros contados" hint="Número de ácaros encontrados">
                  <Input type="number" min="0" step="1" value={varroaCount} onChange={(e) => setVarroaCount(e.target.value)} placeholder="Ej. 9" />
                </Field>
                <Field label="Abejas muestreadas" hint="Número de abejas examinadas">
                  <Input type="number" min="1" step="1" value={varroaSampleSize} onChange={(e) => setVarroaSampleSize(e.target.value)} placeholder="Ej. 300" />
                </Field>
              </div>
              {(() => {
                const count = varroaCount === "" ? undefined : Number(varroaCount);
                const sample = varroaSampleSize === "" ? undefined : Number(varroaSampleSize);
                const result = varroaInfestationPercent({ varroaCount: count, varroaSampleSize: sample } as HealthRecord);
                const level = varroaLevel(result);
                return (
                  <>
                    <div className="mt-3 rounded-xl border bg-card p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resultado automático</p>
                      {result !== undefined && level ? (
                        <>
                          <div className="mt-2 flex items-end justify-between gap-3">
                            <div>
                              <p className="text-3xl font-bold tabular-nums">{result.toFixed(1)} %</p>
                              <p className="mt-1 text-sm text-muted-foreground">{count} ácaros ÷ {sample} abejas × 100</p>
                            </div>
                            <span className="rounded-full border px-3 py-1.5 text-sm font-semibold">{VARROA_LEVEL_LABEL[level]}</span>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">Infestación: {result.toFixed(1)} ácaros por cada 100 abejas muestreadas.</p>
                        </>
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground">Introduce los ácaros contados y las abejas muestreadas para calcular automáticamente la infestación.</p>
                      )}
                    </div>
                    <div className="mt-3 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">Nivel orientativo</p>
                      <p>🟢 Baja &lt;1 % · 🟡 Vigilancia 1–&lt;2 % · 🟠 Atención 2–&lt;3 % · 🔴 Alta ≥3 %</p>
                      <p className="mt-1">Los umbrales pueden variar según época, método y situación de la colonia.</p>
                    </div>
                  </>
                );
              })()}
            </CardSection>
          ) : null}

          {topic === "inspection" ? (
            <CardSection title="🍯 Alimentación">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Reservas de miel">
                  <Select value={foodReserve} onValueChange={(v) => setFoodReserve(v as HealthRecord["foodReserve"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                      <SelectItem value="good">Buenas</SelectItem><SelectItem value="low">Escasas</SelectItem><SelectItem value="very_low">Muy escasas</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Reservas de polen">
                  <Select value={pollenReserve} onValueChange={(v) => setPollenReserve(v as HealthRecord["pollenReserve"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                      <SelectItem value="good">Buenas</SelectItem><SelectItem value="low">Escasas</SelectItem><SelectItem value="absent">Ausentes</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-primary" checked={feedingNeeded} onChange={(e) => setFeedingNeeded(e.target.checked)} />
                Necesita alimentación
              </label>
              {feedingNeeded ? <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Alimentación">
                  <Select value={feedingForm} onValueChange={(v) => setFeedingForm(v as HealthRecord["feedingForm"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                      <SelectItem value="liquid">Líquida</SelectItem><SelectItem value="paste">Pasta</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Tipo">
                  <Select value={feedingType} onValueChange={(v) => setFeedingType(v as HealthRecord["feedingType"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                      {feedingForm === "liquid" ? (
                        <>
                          <SelectItem value="syrup">Jarabe</SelectItem>
                          <SelectItem value="other">Otra líquida</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="fondant">Fondant</SelectItem>
                          <SelectItem value="protein">Pasta proteica</SelectItem>
                          <SelectItem value="other">Otra pasta</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Cantidad" hint="Opcional"><Input value={feedingAmount} onChange={(e) => setFeedingAmount(e.target.value)} placeholder="Ej. 1 kg" /></Field>
              </div> : null}
            </CardSection>
          ) : null}

          {topic === "inspection" ? (
            <CardSection title="👀 Observación">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Reina">
                  <Select value={queenSeen === undefined ? "" : queenSeen ? "yes" : "no"} onValueChange={(v) => setQueenSeen(v === "yes")}>
                    <SelectTrigger><SelectValue placeholder="Sin indicar" /></SelectTrigger><SelectContent><SelectItem value="yes">Vista</SelectItem><SelectItem value="no">No vista</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="Cría">
                  <Select value={broodStatus} onValueChange={(v) => setBroodStatus(v as HealthRecord["broodStatus"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="good">Buena</SelectItem><SelectItem value="regular">Regular</SelectItem><SelectItem value="poor">Mala</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="Fuerza de colonia">
                  <Select value={colonyStrength} onValueChange={(v) => setColonyStrength(v as HealthRecord["colonyStrength"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="strong">Fuerte</SelectItem><SelectItem value="medium">Media</SelectItem><SelectItem value="weak">Débil</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="Comportamiento">
                  <Select value={behavior} onValueChange={(v) => setBehavior(v as HealthRecord["behavior"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="calm">Tranquilas</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="nervous">Nerviosas</SelectItem><SelectItem value="aggressive">Agresivas</SelectItem></SelectContent>
                  </Select>
                </Field>
              </div>
            </CardSection>
          ) : null}

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
