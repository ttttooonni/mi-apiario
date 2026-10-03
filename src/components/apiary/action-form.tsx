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
  ACTION_TYPES,
  currentQueen,
  FRAME_KIND_LABEL,
  newId,
  nowIso,
  queenColorFromDate,
  QUEEN_COLOR_META,
  todayISO,
  type ActionType,
  type AppState,
  type ColonyAction,
  type FrameKind,
} from "@/lib/apiary";
import { QueenSwatch } from "./queen-swatch";

export function ActionFormDialog({
  open,
  onOpenChange,
  state,
  colonyId,
  presetType,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: AppState;
  colonyId: string;
  presetType?: ActionType;
  onSubmit: (action: ColonyAction) => Promise<void>;
}) {
  const [type, setType] = useState<ActionType>(presetType ?? "inspection");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [framesKind, setFramesKind] = useState<FrameKind>("standard");
  const [framesQty, setFramesQty] = useState("2");
  const [supersQty, setSupersQty] = useState("1");
  const [treatmentProduct, setTreatmentProduct] = useState("");
  const [harvestQty, setHarvestQty] = useState("");
  const [moveToApiaryId, setMoveToApiaryId] = useState("");
  const [queenOrigin, setQueenOrigin] = useState("");
  const [queenRetireReason, setQueenRetireReason] = useState("");
  const [busy, setBusy] = useState(false);

  const colony = state.colonies.find((item) => item.id === colonyId);
  const queen = currentQueen(state, colonyId);
  const otherApiaries = state.apiaries.filter((item) => item.id !== colony?.apiaryId);
  const queenColor = QUEEN_COLOR_META[queenColorFromDate(date)];

  useEffect(() => {
    if (!open) return;
    setType(presetType ?? "inspection");
    setDate(todayISO());
    setNotes("");
    setFramesKind("standard");
    setFramesQty("2");
    setSupersQty("1");
    setTreatmentProduct("");
    setHarvestQty("");
    setMoveToApiaryId(otherApiaries[0]?.id ?? "");
    setQueenOrigin("");
    setQueenRetireReason("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetType, colonyId]);

  const needsFrames = type === "add_frames" || type === "remove_frames";
  const needsSuper = type === "add_super" || type === "remove_super";
  const notesRequired = type === "note";

  const canSubmit = useMemo(() => {
    if (!date) return false;
    if (needsFrames && (!framesQty || Number(framesQty) < 1)) return false;
    if (needsSuper && (!supersQty || Number(supersQty) < 1)) return false;
    if (type === "treatment" && !treatmentProduct.trim()) return false;
    if (type === "move" && !moveToApiaryId) return false;
    if (type === "change_queen" && queen && !queenRetireReason.trim()) return false;
    if (notesRequired && !notes.trim()) return false;
    return true;
  }, [
    date,
    needsFrames,
    framesQty,
    needsSuper,
    supersQty,
    type,
    treatmentProduct,
    moveToApiaryId,
    queen,
    queenRetireReason,
    notesRequired,
    notes,
  ]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      const action: ColonyAction = {
        id: newId(),
        colonyId,
        type,
        date,
        notes: notes.trim() || undefined,
        createdAt: nowIso(),
      };
      if (needsFrames) {
        action.framesKind = framesKind;
        action.framesQty = Number(framesQty);
      }
      if (needsSuper) action.supersQty = Number(supersQty);
      if (type === "treatment") action.treatmentProduct = treatmentProduct.trim();
      if (type === "harvest" && harvestQty) action.harvestQty = Number(harvestQty);
      if (type === "move") action.moveToApiaryId = moveToApiaryId;
      if (type === "change_queen") {
        action.queenIntroducedAt = date;
        action.queenOrigin = queenOrigin.trim() || undefined;
        action.queenRetireReason = queenRetireReason.trim() || undefined;
      }
      await onSubmit(action);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar acción</DialogTitle>
          <DialogDescription>
            Elige una acción habitual. El texto libre queda para lo que no encaje en el menú.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
          <Field label="Acción">
            <Select value={type} onValueChange={(value) => setType(value as ActionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Fecha" htmlFor="action-date">
            <Input
              id="action-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </Field>

          {needsFrames ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo de cuadro">
                <Select
                  value={framesKind}
                  onValueChange={(value) => setFramesKind(value as FrameKind)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FRAME_KIND_LABEL).map(([id, label]) => (
                      <SelectItem key={id} value={id}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Cantidad" htmlFor="frames-qty">
                <Input
                  id="frames-qty"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={framesQty}
                  onChange={(event) => setFramesQty(event.target.value)}
                  required
                />
              </Field>
            </div>
          ) : null}

          {needsSuper ? (
            <Field label="Número de alzas" htmlFor="supers-qty">
              <Input
                id="supers-qty"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={supersQty}
                onChange={(event) => setSupersQty(event.target.value)}
                required
              />
            </Field>
          ) : null}

          {type === "treatment" ? (
            <Field
              label="Producto"
              htmlFor="treatment"
              hint="Queda también en Sanidad, como tratamiento de varroa."
            >
              <Input
                id="treatment"
                value={treatmentProduct}
                onChange={(event) => setTreatmentProduct(event.target.value)}
                placeholder="Ácido oxálico sublimado"
                list="varroa-products"
                required
              />
              <datalist id="varroa-products">
                <option value="Ácido oxálico sublimado" />
                <option value="Ácido oxálico goteado" />
                <option value="Ácido fórmico" />
                <option value="Amitraz (tiras)" />
                <option value="Flumetrina (tiras)" />
                <option value="Timol" />
              </datalist>
            </Field>
          ) : null}

          {type === "harvest" ? (
            <Field label="Cantidad (kg)" htmlFor="harvest-qty" hint="Opcional. La producción de sala se registra aparte.">
              <Input
                id="harvest-qty"
                type="number"
                min={0}
                step="0.1"
                inputMode="decimal"
                value={harvestQty}
                onChange={(event) => setHarvestQty(event.target.value)}
              />
            </Field>
          ) : null}

          {type === "move" ? (
            <Field label="Apiario de destino">
              {otherApiaries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Crea otro apiario antes de registrar un traslado.
                </p>
              ) : (
                <Select value={moveToApiaryId} onValueChange={setMoveToApiaryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona apiario" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherApiaries.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
          ) : null}

          {type === "change_queen" ? (
            <div className="grid gap-3 rounded-xl bg-muted/60 p-3">
              <p className="text-sm text-muted-foreground">
                El color se calcula solo a partir del año de introducción.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <QueenSwatch date={date} />
                <span>
                  Color {date.slice(0, 4)} · {queenColor.label}
                </span>
              </div>
              {queen ? (
                <Field label="Motivo del cambio" htmlFor="queen-reason">
                  <Input
                    id="queen-reason"
                    value={queenRetireReason}
                    onChange={(event) => setQueenRetireReason(event.target.value)}
                    placeholder="Reina vieja, postura irregular…"
                    required
                  />
                </Field>
              ) : null}
              <Field label="Origen de la reina" htmlFor="queen-origin" hint="Opcional">
                <Input
                  id="queen-origin"
                  value={queenOrigin}
                  onChange={(event) => setQueenOrigin(event.target.value)}
                  placeholder="Criadero propio, compra, realera…"
                />
              </Field>
            </div>
          ) : null}

          <Field
            label={notesRequired ? "Nota" : "Observaciones"}
            htmlFor="action-notes"
            hint={notesRequired ? undefined : "Opcional"}
          >
            <Textarea
              id="action-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              required={notesRequired}
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy || !canSubmit}>
              Guardar acción
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
