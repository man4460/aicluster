export const WAIT_QUEUE_BASE = "/dashboard/wait-queue";

export const WAIT_QUEUE_SETTINGS_HREF = `${WAIT_QUEUE_BASE}/settings`;

export const WAIT_QUEUE_MODULE_DISPLAY_NAME = "คิวหน้าร้าน";

export const WAIT_QUEUE_HEADER_COLLAPSE_KEY = "mawell-wait-queue-module-header-collapsed";

export const WAIT_QUEUE_HEADER_COLLAPSE_EVENT = "mawell-wait-queue-header-collapse";

export type WaitQueueNavKey = "dashboard" | "settings";

export type WaitQueueNavItem = {
  key: WaitQueueNavKey;
  href: string;
  label: string;
  shortLabel: string;
};

export const WAIT_QUEUE_NAV_ITEMS: WaitQueueNavItem[] = [
  { key: "dashboard", href: WAIT_QUEUE_BASE, label: "คิววันนี้", shortLabel: "คิววันนี้" },
  { key: "settings", href: WAIT_QUEUE_SETTINGS_HREF, label: "ตั้งค่า", shortLabel: "ตั้งค่า" },
];

export function isWaitQueueModulePath(pathname: string): boolean {
  return pathname === WAIT_QUEUE_BASE || pathname.startsWith(`${WAIT_QUEUE_BASE}/`);
}

export function waitQueuePathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isWaitQueueModulePath(pathname);
  const isSettings = pathNorm === WAIT_QUEUE_SETTINGS_HREF || pathNorm.endsWith("/settings");
  const isDashboard = onModule && !isSettings;
  return { onModule, isDashboard, isSettings };
}

export function isWaitQueueNavItemActive(pathname: string, key: WaitQueueNavKey): boolean {
  const f = waitQueuePathFlags(pathname);
  switch (key) {
    case "dashboard":
      return f.isDashboard;
    case "settings":
      return f.isSettings;
    default:
      return false;
  }
}

export function readWaitQueueHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(WAIT_QUEUE_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeWaitQueueHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(WAIT_QUEUE_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(WAIT_QUEUE_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
