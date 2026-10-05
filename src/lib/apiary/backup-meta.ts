const KEY = "mi-apiario:backup-meta:v1";
const INSTALL_KEY = "mi-apiario:backup-install:v1";
const REMINDER_DAYS = 15;
const REMINDER_MS = REMINDER_DAYS * 24 * 60 * 60 * 1000;

function ensureInstallDate(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.localStorage.getItem(INSTALL_KEY);
    if (existing) return existing;
    const now = new Date().toISOString();
    window.localStorage.setItem(INSTALL_KEY, now);
    return now;
  } catch {
    return null;
  }
}

export function markBackupCreated(): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, new Date().toISOString()); } catch { /* best effort */ }
}

export function lastBackupAt(): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(KEY); } catch { return null; }
}

function referenceTime(): number | null {
  const raw = lastBackupAt() ?? ensureInstallDate();
  if (!raw) return null;
  const time = Date.parse(raw);
  return Number.isFinite(time) ? time : null;
}

export function backupReminderDue(now = Date.now()): boolean {
  const time = referenceTime();
  return time !== null && now - time >= REMINDER_MS;
}

export function backupReminderDaysRemaining(now = Date.now()): number | null {
  const time = referenceTime();
  if (time === null) return null;
  return Math.max(0, Math.ceil((REMINDER_MS - (now - time)) / (24 * 60 * 60 * 1000)));
}

export const BACKUP_REMINDER_DAYS = REMINDER_DAYS;
