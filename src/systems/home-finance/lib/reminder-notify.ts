/**
 * Home-finance — การแจ้งเตือนครบกำหนดผ่าน Browser Notification API
 */

export type HomeFinanceDueAlert = {
  kind: string;
  title: string;
  dueDate: string;
  note?: string | null;
  diff: number;
};

export type ReminderNotifyPrefs = {
  enabled: boolean;
};

const NOTIFY_PREFS_KEY = "mawell:hf:reminder-notify:v1";
const NOTIFIED_LOG_KEY = "mawell:hf:reminder-notified:v1";

export type BrowserNotifyPermission = "unsupported" | "default" | "granted" | "denied";

export function loadReminderNotifyPrefs(): ReminderNotifyPrefs {
  if (typeof window === "undefined") return { enabled: false };
  try {
    const raw = window.localStorage.getItem(NOTIFY_PREFS_KEY);
    if (!raw) return { enabled: false };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { enabled: false };
    const p = parsed as Record<string, unknown>;
    return { enabled: p.enabled === true };
  } catch {
    return { enabled: false };
  }
}

export function saveReminderNotifyPrefs(prefs: ReminderNotifyPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NOTIFY_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function getBrowserNotifyPermission(): BrowserNotifyPermission {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  return Notification.permission as BrowserNotifyPermission;
}

export async function requestBrowserNotifyPermission(): Promise<BrowserNotifyPermission> {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  try {
    const result = await Notification.requestPermission();
    return result as BrowserNotifyPermission;
  } catch {
    return getBrowserNotifyPermission();
  }
}

function dueAlertNotifyKey(alert: HomeFinanceDueAlert, todayYmd: string): string {
  return `${todayYmd}|${alert.kind}|${alert.title}|${alert.dueDate}`;
}

function loadNotifiedKeysForDay(todayYmd: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(NOTIFIED_LOG_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return new Set();
    const p = parsed as Record<string, unknown>;
    if (p.day !== todayYmd || !Array.isArray(p.keys)) return new Set();
    return new Set(p.keys.filter((k): k is string => typeof k === "string"));
  } catch {
    return new Set();
  }
}

function saveNotifiedKeysForDay(todayYmd: string, keys: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      NOTIFIED_LOG_KEY,
      JSON.stringify({ day: todayYmd, keys: [...keys] }),
    );
  } catch {
    /* ignore */
  }
}

export function formatDueDateLabel(ymd: string): string {
  const d = new Date(`${ymd.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd.slice(0, 10);
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export function dueDiffLabel(diff: number): string {
  if (diff < 0) return `เกินกำหนด ${Math.abs(diff)} วัน`;
  if (diff === 0) return "ครบวันนี้";
  if (diff === 1) return "พรุ่งนี้";
  return `อีก ${diff} วัน`;
}

/** แจ้งเตือนรายการที่ครบวันนี้ / พรุ่งนี้ / เกินกำหนด — ครั้งเดียวต่อรายการต่อวัน */
export function notifyDueAlertsIfEnabled(alerts: HomeFinanceDueAlert[], todayYmd: string): void {
  const prefs = loadReminderNotifyPrefs();
  if (!prefs.enabled) return;
  if (getBrowserNotifyPermission() !== "granted") return;
  if (typeof Notification === "undefined") return;

  const notified = loadNotifiedKeysForDay(todayYmd);
  const pending = alerts.filter((a) => a.diff <= 1 && !notified.has(dueAlertNotifyKey(a, todayYmd)));
  if (pending.length === 0) return;

  for (const a of pending) {
    const headline =
      a.diff < 0 ? "เกินกำหนดแล้ว" : a.diff === 0 ? "ครบกำหนดวันนี้" : "ครบกำหนดพรุ่งนี้";
    const body = `${a.kind} · ${a.title} (${formatDueDateLabel(a.dueDate)})`;
    try {
      new Notification(`รายรับ-รายจ่าย: ${headline}`, {
        body,
        tag: dueAlertNotifyKey(a, todayYmd),
      });
      notified.add(dueAlertNotifyKey(a, todayYmd));
    } catch {
      /* ignore — บางเบราว์เซอร์บล็อกเมื่อไม่มี user gesture */
    }
  }

  saveNotifiedKeysForDay(todayYmd, notified);
}
