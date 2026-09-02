export const LAUNDRY_BASE = "/dashboard/laundry";
export const LAUNDRY_SETTINGS_PATH = `${LAUNDRY_BASE}/settings`;
export const LAUNDRY_STAFF_PATH = `${LAUNDRY_BASE}/staff`;

export const LAUNDRY_MODULE_DISPLAY_NAME = "รับฝากซักผ้า";
export const LAUNDRY_HEADER_COLLAPSE_KEY = "mawell-laundry-module-header-collapsed";
export const LAUNDRY_HEADER_COLLAPSE_EVENT = "mawell-laundry-header-collapse";

export type LaundryTabKey = "overview" | "finance" | "packages" | "qr";

import type { ReactElement } from "react";

export const LAUNDRY_TAB_ITEMS: { key: LaundryTabKey; label: string; shortLabel: string }[] = [
  { key: "overview", label: "แดชบอร์ด", shortLabel: "หน้าแรก" },
  { key: "finance", label: "การเงิน", shortLabel: "เงิน" },
  { key: "packages", label: "แพ็กเกจ", shortLabel: "แพ็ก" },
  { key: "qr", label: "QR", shortLabel: "QR" },
];

export function laundryDashboardTabIcon(key: LaundryTabKey): ReactElement {
  switch (key) {
    case "finance":
      return (
        <path
          d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case "packages":
      return (
        <path
          d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case "qr":
      return (
        <>
          <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "overview":
    default:
      return (
        <path
          d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
  }
}

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

/** alias สำหรับ sub-nav ในแดชบอร์ด */
export type LaundryDashboardTabKey = LaundryTabKey;
export const LAUNDRY_DASHBOARD_TAB_ITEMS = LAUNDRY_TAB_ITEMS;
export function parseLaundryDashboardTab(value: string | null | undefined): LaundryDashboardTabKey {
  return parseLaundryTab(value);
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
