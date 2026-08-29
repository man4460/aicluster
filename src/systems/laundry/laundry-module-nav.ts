export const LAUNDRY_BASE = "/dashboard/laundry";
export const LAUNDRY_SETTINGS_PATH = `${LAUNDRY_BASE}/settings`;
export const LAUNDRY_STAFF_PATH = `${LAUNDRY_BASE}/staff`;

export const LAUNDRY_MODULE_DISPLAY_NAME = "รับฝากซักผ้า";
export const LAUNDRY_HEADER_COLLAPSE_KEY = "mawell-laundry-module-header-collapsed";
export const LAUNDRY_HEADER_COLLAPSE_EVENT = "mawell-laundry-header-collapse";

export type LaundryTabKey = "overview" | "finance" | "packages" | "qr";

export const LAUNDRY_TAB_ITEMS: { key: LaundryTabKey; label: string; shortLabel: string }[] = [
  { key: "overview", label: "แดชบอร์ด", shortLabel: "หน้าแรก" },
  { key: "finance", label: "การเงิน", shortLabel: "เงิน" },
  { key: "packages", label: "แพ็กเกจ", shortLabel: "แพ็ก" },
  { key: "qr", label: "QR", shortLabel: "QR" },
];

export function isLaundryModulePath(pathname: string): boolean {
  if (!pathname) return false;
  return pathname === LAUNDRY_BASE || pathname.startsWith(`${LAUNDRY_BASE}/`);
}

export function readLaundryHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(LAUNDRY_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeLaundryHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LAUNDRY_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(LAUNDRY_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}

export function parseLaundryTab(value: string | null | undefined): LaundryTabKey {
  if (value === "finance" || value === "packages" || value === "qr") return value;
  return "overview";
}

export function laundryTabHref(tab: LaundryTabKey): string {
  if (tab === "overview") return LAUNDRY_BASE;
  return `${LAUNDRY_BASE}?tab=${tab}`;
}

export function isLaundryTabActive(pathname: string, tab: LaundryTabKey, tabParam: string | null): boolean {
  const norm = pathname.replace(/\/+$/, "");
  if (norm !== LAUNDRY_BASE) return false;
  return parseLaundryTab(tabParam) === tab;
}

export function isLaundrySettingsActive(pathname: string): boolean {
  return pathname.replace(/\/+$/, "") === LAUNDRY_SETTINGS_PATH;
}
