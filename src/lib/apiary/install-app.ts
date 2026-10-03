import { publicUrl } from "@/lib/asset";

export type InstallKind = "prompt" | "ios" | "browser" | "installed";

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: PromptEvent | null = null;
const listeners = new Set<() => void>();
let armed = false;

export function armInstallCapture(): () => void {
  if (typeof window === "undefined") return () => {};
  if (armed) return () => {};
  armed = true;

  const onPrompt = (event: Event) => {
    event.preventDefault();
    deferred = event as PromptEvent;
    listeners.forEach((fn) => fn());
  };
  const onInstalled = () => {
    deferred = null;
    listeners.forEach((fn) => fn());
  };

  window.addEventListener("beforeinstallprompt", onPrompt);
  window.addEventListener("appinstalled", onInstalled);
  return () => {
    window.removeEventListener("beforeinstallprompt", onPrompt);
    window.removeEventListener("appinstalled", onInstalled);
    armed = false;
  };
}

export function subscribeInstall(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hasNativeInstallPrompt(): boolean {
  return deferred !== null;
}

export async function promptNativeInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!deferred) return "unavailable";
  const event = deferred;
  deferred = null;
  await event.prompt();
  const choice = await event.userChoice;
  listeners.forEach((fn) => fn());
  return choice.outcome;
}

export function isStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const ios = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return media || ios;
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadOs;
}

export function isEmbeddedFrame(): boolean {
  try {
    return typeof window !== "undefined" && window.self !== window.top;
  } catch {
    return true;
  }
}

export function detectInstallKind(): InstallKind {
  if (isStandaloneApp()) return "installed";
  if (hasNativeInstallPrompt()) return "prompt";
  if (isIosDevice()) return "ios";
  return "browser";
}

export function iosInstallHref(): string {
  return `${publicUrl("")}?install=1&platform=ios`;
}

export function openAppInBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const url = `${window.location.origin}${publicUrl("")}`;
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  return Boolean(opened);
}
