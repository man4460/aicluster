import type { ReactNode } from "react";

export const CAR_WASH_BASE = "/dashboard/car-wash";
export const CAR_WASH_SETTINGS_PATH = `${CAR_WASH_BASE}/settings`;
export const CAR_WASH_MODULE_DISPLAY_NAME = "คาร์แคร์";

export const CAR_WASH_HEADER_COLLAPSE_KEY = "mawell-car-wash-module-header-collapsed";
export const CAR_WASH_HEADER_COLLAPSE_EVENT = "mawell-car-wash-header-collapse";

export type CarWashTabKey = "overview" | "finance" | "offers" | "qr";

export const CAR_WASH_TAB_ITEMS: { key: CarWashTabKey; label: string; shortLabel: string }[] = [
  { key: "overview", label: "ภาพรวม", shortLabel: "ภาพรวม" },
  { key: "finance", label: "การเงิน", shortLabel: "การเงิน" },
  { key: "offers", label: "แพ็กเกจ", shortLabel: "แพ็ก" },
  { key: "qr", label: "QR", shortLabel: "QR" },
];

export type CarWashNavKey = CarWashTabKey | "settings";

export type CarWashNavItem = {
  key: CarWashNavKey;
  href: string;
  label: string;
  shortLabel: string;
};

export const CAR_WASH_NAV_ITEMS: CarWashNavItem[] = [
  { key: "overview", href: CAR_WASH_BASE, label: "ภาพรวม", shortLabel: "ภาพรวม" },
  { key: "finance", href: `${CAR_WASH_BASE}?tab=finance`, label: "การเงิน", shortLabel: "การเงิน" },
  { key: "offers", href: `${CAR_WASH_BASE}?tab=offers`, label: "แพ็กเกจ", shortLabel: "แพ็ก" },
  { key: "qr", href: `${CAR_WASH_BASE}?tab=qr`, label: "QR", shortLabel: "QR" },
  { key: "settings", href: CAR_WASH_SETTINGS_PATH, label: "ตั้งค่าร้าน", shortLabel: "ตั้งค่า" },
];

export function parseCarWashTab(value: string | null | undefined): CarWashTabKey {
  if (value === "finance" || value === "offers" || value === "qr") return value;
  return "overview";
}

export function carWashTabHref(tab: CarWashTabKey): string {
  if (tab === "overview") return CAR_WASH_BASE;
  return `${CAR_WASH_BASE}?tab=${tab}`;
}

export function isCarWashTabActive(pathname: string, tab: CarWashTabKey, tabParam: string | null): boolean {
  const norm = pathname.replace(/\/+$/, "");
  if (norm !== CAR_WASH_BASE) return false;
  if (tab === "overview") {
    return !tabParam || tabParam === "overview" || tabParam === "queue";
  }
  return parseCarWashTab(tabParam) === tab;
}

export function isCarWashSettingsActive(pathname: string): boolean {
  return pathname.replace(/\/+$/, "") === CAR_WASH_SETTINGS_PATH;
}

export function isCarWashModulePath(pathname: string): boolean {
  return pathname === CAR_WASH_BASE || pathname.startsWith(`${CAR_WASH_BASE}/`);
}

export function carWashPathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isCarWashModulePath(pathname);
  const isSettings = pathNorm === CAR_WASH_SETTINGS_PATH || pathNorm.endsWith("/settings");
  const isDashboard = onModule && !isSettings;
  return { onModule, isDashboard, isSettings };
}

export function isCarWashNavItemActive(
  pathname: string,
  key: CarWashNavKey,
  tabParam: string | null | undefined,
): boolean {
  const f = carWashPathFlags(pathname);
  switch (key) {
    case "overview":
      return f.isDashboard && (!tabParam || tabParam === "overview" || tabParam === "queue");
    case "finance":
      return f.isDashboard && parseCarWashTab(tabParam) === "finance";
    case "offers":
      return f.isDashboard && parseCarWashTab(tabParam) === "offers";
    case "qr":
      return f.isDashboard && parseCarWashTab(tabParam) === "qr";
    case "settings":
      return f.isSettings;
    default:
      return false;
  }
}

export function carWashTabIcon(key: CarWashNavKey): ReactNode {
  switch (key) {
    case "overview":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
    case "finance":
      return <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />;
    case "offers":
      return (
        <>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
        </>
      );
    case "qr":
      return (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3v3h-3zM20 14h1v1h-1zM18 18h3v3h-3z" />
        </>
      );
    case "settings":
      return (
        <g>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </g>
      );
    default:
      return <circle cx="12" cy="12" r="9" />;
  }
}

export function readCarWashHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(CAR_WASH_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeCarWashHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CAR_WASH_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(CAR_WASH_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
