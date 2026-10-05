import { useEffect, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/apiary/field";
import { COLONY_KIND_LABEL, type Colony, type ColonyKind } from "@/lib/apiary";

async function photoData(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Elige un archivo de imagen.");
  const image = await createImageBitmap(file); const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas"); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height); image.close();
  return canvas.toDataURL("image/jpeg", 0.78);
}
export function ColonyFormDialog({ open, onOpenChange, kind, initial, onSubmit }: {
  open: boolean; onOpenChange: (open: boolean) => void; kind: ColonyKind; initial?: Colony | null;
  onSubmit: (values: { number: string; notes?: string; photo?: string; temperament?: Colony["temperament"]; productivity?: Colony["productivity"]; swarmingTendency?: Colony["swarmingTendency"]; hygiene?: Colony["hygiene"]; queenDominance?: Colony["queenDominance"] }) => Promise<void>;
}) {
  const [number, setNumber] = useState(""); const [notes, setNotes] = useState(""); const [photo, setPhoto] = useState<string | undefined>();
  const [temperament, setTemperament] = useState<Colony["temperament"] | "">(""); const [productivity, setProductivity] = useState<Colony["productivity"] | "">("");
  const [swarmingTendency, setSwarmingTendency] = useState<Colony["swarmingTendency"] | "">(""); const [hygiene, setHygiene] = useState<Colony["hygiene"] | "">("");
  const [queenDominance, setQueenDominance] = useState<Colony["queenDominance"] | "">("");
  const [busy, setBusy] = useState(false); const [photoError, setPhotoError] = useState("");
  const noun = COLONY_KIND_LABEL[kind].toLowerCase();
  useEffect(() => { if (!open) return; setNumber(initial?.number ?? ""); setNotes(initial?.notes ?? ""); setPhoto(initial?.photo); setTemperament(initial?.temperament ?? ""); setProductivity(initial?.productivity ?? ""); setSwarmingTendency(initial?.swarmingTendency ?? ""); setHygiene(initial?.hygiene ?? ""); setQueenDominance(initial?.queenDominance ?? ""); setPhotoError(""); }, [open, initial]);
  async function choosePhoto(file?: File) { if (!file) return; try { setPhotoError(""); setPhoto(await photoData(file)); } catch { setPhotoError("No se pudo cargar la foto. Prueba con otra imagen."); } }
  async function handleSubmit(event: React.FormEvent) { event.preventDefault(); if (!number.trim()) return; setBusy(true); try { await onSubmit({ number: number.trim(), notes: notes.trim() || undefined, photo, temperament: temperament || undefined, productivity: productivity || undefined, swarmingTendency: swarmingTendency || undefined, hygiene: hygiene || undefined, queenDominance: queenDominance || undefined }); onOpenChange(false); } finally { setBusy(false); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{initial ? `Editar ${noun}` : `Añadir ${noun}`}</DialogTitle><DialogDescription>{kind === "hive" ? "Las colmenas y los núcleos se registran por separado." : "Un núcleo no es una colmena. Queda identificado como tal en todo el historial."}</DialogDescription></DialogHeader>
    <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
      <Field label="Número" htmlFor="colony-number" hint="Por ejemplo 24 o N1"><Input id="colony-number" value={number} onChange={(event) => setNumber(event.target.value)} required autoFocus /></Field>
      <Field label="Foto identificativa" htmlFor="colony-photo" hint="Opcional · se guarda en este dispositivo">
        {photo && <div className="relative w-full overflow-hidden rounded-xl border"><img src={photo} alt={`Foto de ${noun} ${number}`} className="max-h-48 w-full object-cover" /><Button type="button" size="icon" variant="secondary" className="absolute right-2 top-2" aria-label="Quitar foto" onClick={() => setPhoto(undefined)}><X className="size-4" /></Button></div>}
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("colony-camera")?.click()}><Camera className="mr-2 size-4" />Hacer foto</Button><Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("colony-gallery")?.click()}><ImagePlus className="mr-2 size-4" />Subir foto</Button></div>
        <input id="colony-camera" className="hidden" type="file" accept="image/*" capture="environment" onChange={(e) => void choosePhoto(e.target.files?.[0])} />
        <input id="colony-gallery" className="hidden" type="file" accept="image/*" onChange={(e) => void choosePhoto(e.target.files?.[0])} />
        {photoError && <p className="text-sm text-destructive">{photoError}</p>}
      </Field>
      <div className="rounded-2xl border p-4">
        <p className="mb-3 font-medium">🐝 Perfil de la colonia <span className="text-sm font-normal text-muted-foreground">· opcional</span></p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Temperamento"><Select value={temperament} onValueChange={(v) => setTemperament(v as Colony["temperament"])}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>
            <SelectItem value="very_calm">Muy tranquila</SelectItem><SelectItem value="calm">Tranquila</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="nervous">Nerviosa</SelectItem><SelectItem value="aggressive">Agresiva</SelectItem>
          </SelectContent></Select></Field>
          <Field label="Productividad"><Select value={productivity} onValueChange={(v) => setProductivity(v as Colony["productivity"])}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>
            <SelectItem value="very_high">Muy alta</SelectItem><SelectItem value="high">Alta</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="low">Baja</SelectItem><SelectItem value="very_low">Muy baja</SelectItem>
          </SelectContent></Select></Field>
          <Field label="Tendencia a enjambrazón"><Select value={swarmingTendency} onValueChange={(v) => setSwarmingTendency(v as Colony["swarmingTendency"])}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>
            <SelectItem value="very_low">Muy baja</SelectItem><SelectItem value="low">Baja</SelectItem><SelectItem value="medium">Media</SelectItem><SelectItem value="high">Alta</SelectItem><SelectItem value="very_high">Muy alta</SelectItem>
          </SelectContent></Select></Field>
          <Field label="Higiene"><Select value={hygiene} onValueChange={(v) => setHygiene(v as Colony["hygiene"])}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>
            <SelectItem value="very_good">Muy buena</SelectItem><SelectItem value="good">Buena</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="low">Baja</SelectItem>
          </SelectContent></Select></Field>
          <Field label="Dominancia de la reina"><Select value={queenDominance} onValueChange={(v) => setQueenDominance(v as Colony["queenDominance"])}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>
            <SelectItem value="low">Baja</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">Alta</SelectItem>
          </SelectContent></Select></Field>
        </div>
      </div>
      <Field label="Notas" htmlFor="colony-notes" hint="Opcional"><Textarea id="colony-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} /></Field>
      <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={busy || !number.trim()}>{initial ? "Guardar" : "Añadir"}</Button></DialogFooter>
    </form></DialogContent></Dialog>;
}