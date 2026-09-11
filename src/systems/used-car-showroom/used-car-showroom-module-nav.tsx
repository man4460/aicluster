import type { ReactElement } from "react";
import { MODULE_SHOP_SETTINGS_SHORT_LABEL } from "@/systems/module-shop/module-shop-settings-nav";

export const USED_CAR_SHOWROOM_BASE = "/dashboard/used-car-showroom";
export const USED_CAR_SHOWROOM_FINANCE_PATH = `${USED_CAR_SHOWROOM_BASE}/finance`;
export const USED_CAR_SHOWROOM_MANAGE_PATH = `${USED_CAR_SHOWROOM_BASE}/manage`;
export const USED_CAR_SHOWROOM_SETTINGS_PATH = `${USED_CAR_SHOWROOM_BASE}/settings`;

export const USED_CAR_SHOWROOM_MODULE_DISPLAY_NAME = "โชว์รูมรถมือสอง";
export const USED_CAR_SHOWROOM_HEADER_COLLAPSE_KEY = "mawell-used-car-showroom-module-header-collapsed";
export const USED_CAR_SHOWROOM_HEADER_COLLAPSE_EVENT = "mawell-used-car-showroom-header-collapse";

export type UsedCarShowroomModuleNavKey = "dashboard" | "manage" | "finance" | "settings";

export type UsedCarShowroomDashboardTabKey =
  | "overview"
  | "stock"
  | "reservations"
  | "appointments"
  | "finance-pending"
  | "installment";

export type UsedCarShowroomManageTabKey =
  | "vehicles"
  | "pnl"
  | "staff"
  | "promotions"
  | "customers"
  | "finance-companies";

export type UsedCarShowroomSettingsTab = "basic" | "finance" | "portal" | "hours" | "link";

export type UsedCarShowroomNavItem = {
  key: UsedCarShowroomModuleNavKey;
  label: string;
  shortLabel: string;
  href: string;
};

export const USED_CAR_SHOWROOM_NAV_ITEMS: UsedCarShowroomNavItem[] = [
  { key: "dashboard", label: "แดชบอร์ด", shortLabel: "แดช", href: USED_CAR_SHOWROOM_BASE },
  { key: "manage", label: "การจัดการ", shortLabel: "จัดการ", href: USED_CAR_SHOWROOM_MANAGE_PATH },
  { key: "finance", label: "การเงิน", shortLabel: "เงิน", href: USED_CAR_SHOWROOM_FINANCE_PATH },
  {
    key: "settings",
    label: MODULE_SHOP_SETTINGS_SHORT_LABEL,
    shortLabel: "ตั้งค่า",
    href: USED_CAR_SHOWROOM_SETTINGS_PATH,
  },
];

export const USED_CAR_SHOWROOM_DASHBOARD_TAB_ITEMS: {
  key: UsedCarShowroomDashboardTabKey;
  label: string;
  shortLabel?: string;
}[] = [
  { key: "overview", label: "ภาพรวม" },
  { key: "stock", label: "สต็อก", shortLabel: "สต็อก" },
  { key: "reservations", label: "การจอง", shortLabel: "จอง" },
  { key: "appointments", label: "นัดหมาย", shortLabel: "นัด" },
  { key: "finance-pending", label: "ไฟแนนซ์รอ", shortLabel: "ไฟแนนซ์" },
  { key: "installment", label: "คิดค่างวด (flat)", shortLabel: "ผ่อน" },
];

export const USED_CAR_SHOWROOM_MANAGE_TAB_ITEMS: {
  key: UsedCarShowroomManageTabKey;
  label: string;
  shortLabel?: string;
}[] = [
  { key: "vehicles", label: "รถ" },
  { key: "pnl", label: "P&L รายคัน", shortLabel: "P&L" },
  { key: "staff", label: "พนักงาน" },
  { key: "promotions", label: "โปรโมชัน", shortLabel: "โปร" },
  { key: "customers", label: "ลูกค้า" },
  { key: "finance-companies", label: "บริษัทไฟแนนซ์", shortLabel: "ไฟแนนซ์" },
];

export const USED_CAR_SHOWROOM_SETTINGS_TAB_ITEMS: {
  key: UsedCarShowroomSettingsTab;
  label: string;
  shortLabel?: string;
}[] = [
  { key: "basic", label: "ตั้งค่าพื้นฐาน", shortLabel: "พื้นฐาน" },
  { key: "finance", label: "ตั้งค่าเกี่ยวกับการเงิน", shortLabel: "การเงิน" },
  { key: "portal", label: "ตั้งค่าเว็บไซต์", shortLabel: "เว็บ" },
  { key: "hours", label: "ตั้งค่าเวลาเปิดร้าน", shortLabel: "เวลาเปิด" },
  { key: "link", label: "ลิงก์", shortLabel: "ลิงก์" },
];

export function isUsedCarShowroomModulePath(pathname: string): boolean {
  if (!pathname) return false;
  return pathname === USED_CAR_SHOWROOM_BASE || pathname.startsWith(`${USED_CAR_SHOWROOM_BASE}/`);
}

export function isUsedCarShowroomModuleNavItemActive(
  pathname: string,
  key: UsedCarShowroomModuleNavKey,
): boolean {
  const norm = pathname.replace(/\/+$/, "");
  switch (key) {
    case "dashboard":
      return norm === USED_CAR_SHOWROOM_BASE;
    case "manage":
      return norm === USED_CAR_SHOWROOM_MANAGE_PATH || norm.startsWith(`${USED_CAR_SHOWROOM_MANAGE_PATH}/`);
    case "finance":
      return norm === USED_CAR_SHOWROOM_FINANCE_PATH || norm.startsWith(`${USED_CAR_SHOWROOM_FINANCE_PATH}/`);
    case "settings":
      return norm === USED_CAR_SHOWROOM_SETTINGS_PATH || norm.startsWith(`${USED_CAR_SHOWROOM_SETTINGS_PATH}/`);
    default:
      return false;
  }
}

export function parseUsedCarShowroomDashboardTab(
  raw: string | null | undefined,
): UsedCarShowroomDashboardTabKey {
  if (
    raw === "stock" ||
    raw === "reservations" ||
    raw === "appointments" ||
    raw === "finance-pending" ||
    raw === "installment"
  ) {
    return raw;
  }
  return "overview";
}

export function usedCarShowroomDashboardTabHref(tab: UsedCarShowroomDashboardTabKey): string {
  if (tab === "overview") return USED_CAR_SHOWROOM_BASE;
  return `${USED_CAR_SHOWROOM_BASE}?tab=${tab}`;
}

export function parseUsedCarShowroomManageTab(
  raw: string | null | undefined,
): UsedCarShowroomManageTabKey {
  if (
    raw === "pnl" ||
    raw === "staff" ||
    raw === "promotions" ||
    raw === "customers" ||
    raw === "finance-companies"
  ) {
    return raw;
  }
  return "vehicles";
}

export function usedCarShowroomManageHref(tab?: UsedCarShowroomManageTabKey): string {
  if (!tab || tab === "vehicles") return USED_CAR_SHOWROOM_MANAGE_PATH;
  return `${USED_CAR_SHOWROOM_MANAGE_PATH}?tab=${tab}`;
}

export function parseUsedCarShowroomSettingsTab(
  raw: string | null | undefined,
): UsedCarShowroomSettingsTab {
  if (raw === "finance" || raw === "portal" || raw === "hours" || raw === "link") return raw;
  if (raw === "links") return "link";
  if (raw === "staff") return "link";
  return "basic";
}

export function usedCarShowroomSettingsHref(tab?: UsedCarShowroomSettingsTab): string {
  if (!tab || tab === "basic") return USED_CAR_SHOWROOM_SETTINGS_PATH;
  return `${USED_CAR_SHOWROOM_SETTINGS_PATH}?tab=${tab}`;
}

export function usedCarShowroomModuleNavIcon(key: UsedCarShowroomModuleNavKey): ReactElement {
  switch (key) {
    case "dashboard":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
    case "manage":
      return (
        <>
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
          <path d="M9 12h6M9 16h4" />
        </>
      );
    case "finance":
      return <path d="M4 18h16M7 14l3-3 3 2 4-5" />;
    case "settings":
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="9" />;
  }
}

export function readUsedCarShowroomHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(USED_CAR_SHOWROOM_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeUsedCarShowroomHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(USED_CAR_SHOWROOM_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(USED_CAR_SHOWROOM_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
