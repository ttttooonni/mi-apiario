import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM yyyy", { locale: es });
  } catch {
    return iso;
  }
}

export function formatDateLong(iso: string): string {
  try {
    return format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return iso;
  }
}

export function yearOf(iso: string): number {
  return Number.parseInt(iso.slice(0, 4), 10);
}

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
