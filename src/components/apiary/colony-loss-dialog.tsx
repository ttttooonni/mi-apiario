import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { COLONY_LOSS_CAUSE_LABEL, nowIso, todayISO, type Colony, type ColonyLoss, type ColonyLossCause } from "@/lib/apiary";

const CAUSES: ColonyLossCause[] = ["dead","absconded","queenless","weak","robbed","disease","varroa","pesticide","swarming","unknown","other"];

export function ColonyLossDialog({ open, onOpenChange, apiaryId, colonies, onSubmit }: {
  open: boolean; onOpenChange: (open: boolean) => void; apiaryId: string; colonies: Colony[]; onSubmit: (loss: ColonyLoss) => Promise<void>;
}) {
  const [colonyId, setColonyId] = useState(""); const [year, setYear] = useState(String(new Date().getFullYear()));
  const [date, setDate] = useState(todayISO()); const [cause, setCause] = useState<ColonyLossCause>("unknown"); const [notes, setNotes] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setColonyId(colonies[0]?.id || ""); setYear(String(new Date().getFullYear())); setDate(todayISO()); setCause("unknown"); setNotes(""); } }, [open, colonies]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); const colony = colonies.find((item) => item.id === colonyId); if (!colony) { toast.error("Selecciona una colonia"); return; }
    setBusy(true); try { await onSubmit({ id: crypto.randomUUID(), apiaryId, colonyId: colony.id, colonyNumber: colony.number, kind: colony.kind, year: Number(year), date, cause, notes: notes.trim() || undefined, createdAt: nowIso() }); onOpenChange(false); } finally { setBusy(false); }
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent>
    <DialogHeader><DialogTitle>Registrar pérdida</DialogTitle><DialogDescription>Guarda la pérdida en el histórico del apiario. La colonia no se borra ni se modifica.</DialogDescription></DialogHeader>
    <form className="grid gap-4" onSubmit={(e) => void submit(e)}>
      <label className="grid gap-1 text-sm font-medium">Colmena o núcleo<select className="h-11 rounded-md border border-input bg-card px-3 text-base" value={colonyId} onChange={(e) => setColonyId(e.target.value)} required>{colonies.map((c) => <option key={c.id} value={c.id}>{c.kind === "hive" ? "Colmena" : "Núcleo"} {c.number}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-sm font-medium">Temporada<input className="h-11 rounded-md border border-input bg-card px-3 text-base" type="number" min="1990" max="2100" value={year} onChange={(e) => setYear(e.target.value)} required /></label><label className="grid gap-1 text-sm font-medium">Fecha<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label></div>
      <label className="grid gap-1 text-sm font-medium">Causa<select className="h-11 rounded-md border border-input bg-card px-3 text-base" value={cause} onChange={(e) => setCause(e.target.value as ColonyLossCause)}>{CAUSES.map((item) => <option key={item} value={item}>{COLONY_LOSS_CAUSE_LABEL[item]}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium">Observaciones <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Qué ocurrió, si se conoce…" /></label>
      <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar pérdida"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
