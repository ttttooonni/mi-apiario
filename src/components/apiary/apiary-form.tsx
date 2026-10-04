import { useEffect, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/apiary/field";
import type { Apiary } from "@/lib/apiary";

async function photoData(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Elige un archivo de imagen.");
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  return canvas.toDataURL("image/jpeg", 0.78);
}

export function ApiaryFormDialog({ open, onOpenChange, initial, onSubmit }: {
  open: boolean; onOpenChange: (open: boolean) => void; initial?: Apiary | null;
  onSubmit: (values: { name: string; location: string; notes?: string; photo?: string }) => Promise<void>;
}) {
  const [name, setName] = useState(""); const [location, setLocation] = useState(""); const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<string | undefined>(); const [busy, setBusy] = useState(false); const [photoError, setPhotoError] = useState("");
  useEffect(() => { if (!open) return; setName(initial?.name ?? ""); setLocation(initial?.location ?? ""); setNotes(initial?.notes ?? ""); setPhoto(initial?.photo); setPhotoError(""); }, [open, initial]);
  async function choosePhoto(file?: File) { if (!file) return; try { setPhotoError(""); setPhoto(await photoData(file)); } catch { setPhotoError("No se pudo cargar la foto. Prueba con otra imagen."); } }
  async function handleSubmit(event: React.FormEvent) { event.preventDefault(); if (!name.trim()) return; setBusy(true); try { await onSubmit({ name: name.trim(), location: location.trim(), notes: notes.trim() || undefined, photo }); onOpenChange(false); } finally { setBusy(false); } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{initial ? "Editar apiario" : "Nuevo apiario"}</DialogTitle><DialogDescription>{initial ? "Actualiza el nombre, ubicación o foto." : "Cada apiario agrupa colmenas y núcleos."}</DialogDescription></DialogHeader>
    <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
      <Field label="Nombre" htmlFor="apiary-name"><Input id="apiary-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="La Dehesa" required autoFocus /></Field>
      <Field label="Ubicación" htmlFor="apiary-location"><Input id="apiary-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Santa Lucía, Gran Canaria" /></Field>
      <Field label="Foto del apiario" htmlFor="apiary-photo" hint="Opcional · se guarda en este dispositivo">
        {photo && <div className="relative w-full overflow-hidden rounded-xl border"><img src={photo} alt="Foto del apiario" className="max-h-48 w-full object-cover" /><Button type="button" size="icon" variant="secondary" className="absolute right-2 top-2" aria-label="Quitar foto" onClick={() => setPhoto(undefined)}><X className="size-4" /></Button></div>}
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("apiary-camera")?.click()}><Camera className="mr-2 size-4" />Hacer foto</Button><Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("apiary-gallery")?.click()}><ImagePlus className="mr-2 size-4" />Subir foto</Button></div>
        <input id="apiary-camera" className="hidden" type="file" accept="image/*" capture="environment" onChange={(e) => void choosePhoto(e.target.files?.[0])} />
        <input id="apiary-gallery" className="hidden" type="file" accept="image/*" onChange={(e) => void choosePhoto(e.target.files?.[0])} />
        {photoError && <p className="text-sm text-destructive">{photoError}</p>}
      </Field>
      <Field label="Notas" htmlFor="apiary-notes" hint="Opcional"><Textarea id="apiary-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} /></Field>
      <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={busy || !name.trim()}>{initial ? "Guardar" : "Crear apiario"}</Button></DialogFooter>
    </form></DialogContent></Dialog>;
}
