export type SmartPoliceMainKey = "overview" | "cases" | "templates" | "reports" | "settings";

export const SMART_POLICE_BASE = "/dashboard/smart-police";

export const SMART_POLICE_MODULE_DISPLAY_NAME = "Smart Police";

export const SMART_POLICE_HEADER_COLLAPSE_KEY = "mawell-smart-police-module-header-collapsed";

export const SMART_POLICE_HEADER_COLLAPSE_EVENT = "mawell-smart-police-header-collapse";

export const smartPoliceMainMenuItems: {
  key: SmartPoliceMainKey;
  href: string;
  label: string;
  shortLabel?: string;
  includes?: readonly string[];
}[] = [
  { key: "overview", href: SMART_POLICE_BASE, label: "ภาพรวม", shortLabel: "ภาพรวม" },
  {
    key: "cases",
    href: `${SMART_POLICE_BASE}/cases`,
    label: "คดี",
    shortLabel: "คดี",
    includes: [`${SMART_POLICE_BASE}/cases`],
  },
  { key: "templates", href: `${SMART_POLICE_BASE}/templates`, label: "แม่แบบ", shortLabel: "แม่แบบ" },
  { key: "reports", href: `${SMART_POLICE_BASE}/reports`, label: "รายงาน", shortLabel: "รายงาน" },
  {
    key: "settings",
    href: `${SMART_POLICE_BASE}/settings`,
    label: "ตั้งค่า",
    shortLabel: "ตั้งค่า",
    includes: [`${SMART_POLICE_BASE}/settings`],
  },
];

export function isSmartPoliceModulePath(pathname: string): boolean {
  return pathname === SMART_POLICE_BASE || pathname.startsWith(`${SMART_POLICE_BASE}/`);
}

export function smartPoliceMainKeyFromPathname(pathname: string): SmartPoliceMainKey {
  if (pathname.startsWith(`${SMART_POLICE_BASE}/cases`)) return "cases";
  if (pathname.startsWith(`${SMART_POLICE_BASE}/templates`)) return "templates";
  if (pathname.startsWith(`${SMART_POLICE_BASE}/reports`)) return "reports";
  if (pathname.startsWith(`${SMART_POLICE_BASE}/settings`)) return "settings";
  return "overview";
}

export function readSmartPoliceHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SMART_POLICE_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeSmartPoliceHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SMART_POLICE_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(SMART_POLICE_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
