import { useEffect, useRef, useState } from "react";
import { Camera, Printer, QrCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DetectedCode = { rawValue?: string };
type DetectorLike = { detect: (source: HTMLVideoElement) => Promise<DetectedCode[]> };
type DetectorConstructor = new (options?: { formats?: string[] }) => DetectorLike;

function colonyUrl(colonyId: string) {
  const base = import.meta.env.BASE_URL || "/";
  return new URL(`${base.replace(/\/$/, "")}/colonias/${encodeURIComponent(colonyId)}`, window.location.origin).toString();
}

export function ColonyQrTools({ colonyId, label }: { colonyId: string; label: string }) {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function startScan() {
    setCameraError("");
    const Detector = (window as unknown as { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
    if (!Detector) {
      setCameraError("Este navegador no permite leer QR directamente. Prueba con Chrome actualizado.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setScanning(true);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      }, 100);
      const detector = new Detector({ formats: ["qr_code"] });
      const scan = async () => {
        if (!streamRef.current) return;
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          try {
            const codes = await detector.detect(video);
            const value = codes.find((code) => code.rawValue)?.rawValue;
            if (value) {
              streamRef.current?.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
              window.location.assign(value);
              return;
            }
          } catch { /* Esperar al siguiente fotograma. */ }
        }
        if (streamRef.current) window.setTimeout(() => void scan(), 250);
      };
      window.setTimeout(() => void scan(), 350);
    } catch {
      setCameraError("No se pudo abrir la cámara. Comprueba los permisos del navegador.");
      setScanning(false);
    }
  }

  function stopScan() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }

  function printLabel() {
    const url = colonyUrl(colonyId);
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(url)}`;
    const safeLabel = label.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
    const popup = window.open("", "_blank", "width=520,height=680");
    if (!popup) {
      setCameraError("Permite las ventanas emergentes para imprimir la etiqueta.");
      return;
    }
    popup.document.write(`<!doctype html><html lang="es"><meta charset="utf-8"><title>Etiqueta QR - ${safeLabel}</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:24px;color:#17251e}.label{border:2px solid #315e49;border-radius:18px;padding:20px;max-width:340px;margin:0 auto}h1{font-size:25px;margin:0 0 6px}p{font-size:13px;color:#555;margin:0}img{width:260px;height:260px;display:block;margin:16px auto}small{overflow-wrap:anywhere;font-size:9px}@media print{body{padding:0}.label{break-inside:avoid}}</style><body><div class="label"><h1>${safeLabel}</h1><p>Mi Apiario · Escanea para abrir la ficha</p><img src="${qrImage}" alt="Código QR" onload="setTimeout(()=>window.print(),250)"><small>${url}</small></div></body></html>`);
    popup.document.close();
  }

  return <Card className="mb-6 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-display text-lg font-medium">Etiqueta y lectura QR</h2><p className="mt-1 text-sm text-muted-foreground">Imprime un código para esta ficha o escanea una etiqueta con la cámara.</p></div>
      <QrCode className="size-6 text-muted-foreground" />
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      <Button type="button" onClick={printLabel}><Printer className="mr-2 size-4" />Imprimir etiqueta QR</Button>
      {!scanning ? <Button type="button" variant="outline" onClick={() => void startScan()}><Camera className="mr-2 size-4" />Escanear QR</Button> : <Button type="button" variant="outline" onClick={stopScan}><X className="mr-2 size-4" />Cerrar cámara</Button>}
    </div>
    {scanning && <video ref={videoRef} playsInline className="mt-4 max-h-72 w-full rounded-xl bg-black object-cover" />}
    {cameraError && <p role="status" className="mt-3 text-sm text-destructive">{cameraError}</p>}
    <p className="mt-3 text-xs text-muted-foreground">Para generar e imprimir el QR se necesita conexión a Internet. El código abre esta ficha cuando el dispositivo tenga acceso a la aplicación.</p>
  </Card>;
}
