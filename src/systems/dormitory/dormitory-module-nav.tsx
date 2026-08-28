import type { ReactNode } from "react";

export const DORMITORY_BASE = "/dashboard/dormitory";
export const DORMITORY_SETTINGS_HREF = `${DORMITORY_BASE}/settings`;
/** @deprecated ใช้ DORMITORY_SETTINGS_HREF?tab=portal */
export const DORMITORY_GUEST_PORTAL_HREF = `${DORMITORY_BASE}/guest-portal`;
export const DORMITORY_ROOMS_HREF = `${DORMITORY_BASE}/rooms`;
export const DORMITORY_FINANCE_HREF = `${DORMITORY_BASE}/finance`;
/** @deprecated ใช้ DORMITORY_FINANCE_HREF?panel=history */
export const DORMITORY_HISTORY_HREF = `${DORMITORY_BASE}/history`;
/** @deprecated ใช้ DORMITORY_FINANCE_HREF?panel=expenses */
export const DORMITORY_COSTS_HREF = `${DORMITORY_BASE}/costs`;

export const DORMITORY_MODULE_DISPLAY_NAME = "หอพัก";

export const DORMITORY_HEADER_COLLAPSE_KEY = "mawell-dormitory-module-header-collapsed";
export const DORMITORY_HEADER_COLLAPSE_EVENT = "mawell-dormitory-header-collapse";

export type DormitoryNavKey = "dashboard" | "rooms" | "finance" | "settings";

export type DormitoryNavItem = {
  key: DormitoryNavKey;
  href: string;
  label: string;
  shortLabel: string;
};

export const DORMITORY_NAV_ITEMS: DormitoryNavItem[] = [
  { key: "dashboard", href: DORMITORY_BASE, label: "แดชบอร์ด", shortLabel: "ภาพรวม" },
  { key: "rooms", href: DORMITORY_ROOMS_HREF, label: "การจัดการ", shortLabel: "จัดการ" },
  { key: "finance", href: DORMITORY_FINANCE_HREF, label: "การเงิน", shortLabel: "การเงิน" },
  { key: "settings", href: DORMITORY_SETTINGS_HREF, label: "ตั้งค่า", shortLabel: "ตั้งค่า" },
];

export function isDormitoryModulePath(pathname: string): boolean {
  return pathname === DORMITORY_BASE || pathname.startsWith(`${DORMITORY_BASE}/`);
}

export function dormitoryPathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isDormitoryModulePath(pathname);
  const isSettings = pathNorm === DORMITORY_SETTINGS_HREF || pathNorm.endsWith("/settings");
  const isRooms = pathNorm === DORMITORY_ROOMS_HREF || pathNorm.startsWith(`${DORMITORY_ROOMS_HREF}/`);
  const isFinance =
    pathNorm === DORMITORY_FINANCE_HREF ||
    pathNorm.startsWith(`${DORMITORY_FINANCE_HREF}/`) ||
    pathNorm === DORMITORY_HISTORY_HREF ||
    pathNorm.startsWith(`${DORMITORY_HISTORY_HREF}/`) ||
    pathNorm === DORMITORY_COSTS_HREF ||
    pathNorm.startsWith(`${DORMITORY_COSTS_HREF}/`);
  const isDashboard = onModule && !isSettings && !isRooms && !isFinance;
  return { onModule, isDashboard, isRooms, isFinance, isSettings };
}

export function isDormitoryNavItemActive(pathname: string, key: DormitoryNavKey): boolean {
  const f = dormitoryPathFlags(pathname);
  switch (key) {
    case "dashboard":
      return f.isDashboard;
    case "rooms":
      return f.isRooms;
    case "finance":
      return f.isFinance;
    case "settings":
      return f.isSettings;
    default:
      return false;
  }
}

export function dormitoryNavIcon(key: DormitoryNavKey): ReactNode {
  switch (key) {
    case "dashboard":
      return (
        <>
          <path d="m3 11 9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 10.5V20h14v-9.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "rooms":
      return (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 10h18M9 10v10M15 10v10" strokeLinecap="round" />
        </>
      );
    case "finance":
      return <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />;
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

export function readDormitoryHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(DORMITORY_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeDormitoryHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DORMITORY_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(DORMITORY_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
