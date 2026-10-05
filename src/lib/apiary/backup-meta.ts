const KEY = "mi-apiario:backup-meta:v1";
const REMINDER_DAYS = 15;
const REMINDER_MS = REMINDER_DAYS * 24 * 60 * 60 * 1000;

export function markBackupCreated(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, new Date().toISOString());
  } catch {
    // El recordatorio nunca debe impedir una copia.
  }
}

export function lastBackupAt(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function backupReminderDue(now = Date.now()): boolean {
  const raw = lastBackupAt();
  if (!raw) return false;
  const time = Date.parse(raw);
  return Number.isFinite(time) && now - time >= REMINDER_MS;
}

export function backupReminderDaysRemaining(now = Date.now()): number | null {
  const raw = lastBackupAt();
  if (!raw) return null;
  const time = Date.parse(raw);
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Math.ceil((REMINDER_MS - (now - time)) / (24 * 60 * 60 * 1000)));
}

export const BACKUP_REMINDER_DAYS = REMINDER_DAYS;
