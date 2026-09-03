import type { ReactElement } from "react";
import { MODULE_SHOP_SETTINGS_SHORT_LABEL } from "@/systems/module-shop/module-shop-settings-nav";

export const LMS_BASE = "/dashboard/lms";
export const LMS_FINANCE_PATH = `${LMS_BASE}/finance`;
export const LMS_MANAGE_PATH = `${LMS_BASE}/manage`;
export const LMS_SETTINGS_PATH = `${LMS_BASE}/settings`;

export const LMS_MODULE_DISPLAY_NAME = "LMS คอร์สออนไลน์";
export const LMS_HEADER_COLLAPSE_KEY = "mawell-lms-module-header-collapsed";
export const LMS_HEADER_COLLAPSE_EVENT = "mawell-lms-header-collapse";

/** เมนูหลัก: แดชบอร์ด · การเงิน · การจัดการ · ตั้งค่า */
export type LmsModuleNavKey = "dashboard" | "finance" | "manage" | "settings";

/** แท็บย่อยแดชบอร์ด: ภาพรวม · คำขอซื้อ (ย้อนหลัง) */
export type LmsDashboardTabKey = "overview" | "purchases";

/** แท็บย่อยการจัดการ: คอร์ส · นักเรียน */
export type LmsManageTabKey = "courses" | "learners";

/** แท็บย่อยตั้งค่า: พื้นฐาน · การเงิน · เว็ปลิงค์ลูกค้า */
export type LmsSettingsTab = "basic" | "finance" | "portal";

export type LmsNavItem = {
  key: LmsModuleNavKey;
  label: string;
  shortLabel: string;
  href: string;
};

export const LMS_NAV_ITEMS: LmsNavItem[] = [
  { key: "dashboard", label: "แดชบอร์ด", shortLabel: "แดช", href: LMS_BASE },
  { key: "finance", label: "การเงิน", shortLabel: "เงิน", href: LMS_FINANCE_PATH },
  { key: "manage", label: "การจัดการ", shortLabel: "จัดการ", href: LMS_MANAGE_PATH },
  {
    key: "settings",
    label: MODULE_SHOP_SETTINGS_SHORT_LABEL,
    shortLabel: "ตั้งค่า",
    href: LMS_SETTINGS_PATH,
  },
];

export const LMS_DASHBOARD_TAB_ITEMS: {
  key: LmsDashboardTabKey;
  label: string;
  shortLabel?: string;
}[] = [
  { key: "overview", label: "ภาพรวม", shortLabel: "รวม" },
  { key: "purchases", label: "คำขอซื้อ", shortLabel: "ซื้อ" },
];

export const LMS_MANAGE_TAB_ITEMS: {
  key: LmsManageTabKey;
  label: string;
  shortLabel?: string;
}[] = [
  { key: "courses", label: "คอร์ส" },
  { key: "learners", label: "นักเรียน", shortLabel: "เรียน" },
];

export const LMS_SETTINGS_TAB_ITEMS: {
  key: LmsSettingsTab;
  label: string;
  shortLabel?: string;
}[] = [
  { key: "basic", label: "ตั้งค่าพื้นฐาน", shortLabel: "พื้นฐาน" },
  { key: "finance", label: "ตั้งค่าเกี่ยวกับการเงิน", shortLabel: "การเงิน" },
  { key: "portal", label: "ตั้งค่าเว็ปลิงค์ลูกค้า", shortLabel: "เว็บ" },
];

export function isLmsModulePath(pathname: string): boolean {
  if (!pathname) return false;
  return pathname === LMS_BASE || pathname.startsWith(`${LMS_BASE}/`);
}

export function isLmsModuleNavItemActive(pathname: string, key: LmsModuleNavKey): boolean {
  const norm = pathname.replace(/\/+$/, "");
  switch (key) {
    case "dashboard":
      return norm === LMS_BASE;
    case "finance":
      return norm === LMS_FINANCE_PATH || norm.startsWith(`${LMS_FINANCE_PATH}/`);
    case "manage":
      return norm === LMS_MANAGE_PATH || norm.startsWith(`${LMS_MANAGE_PATH}/`);
    case "settings":
      return norm === LMS_SETTINGS_PATH || norm.startsWith(`${LMS_SETTINGS_PATH}/`);
    default:
      return false;
  }
}

export function parseLmsDashboardTab(raw: string | null | undefined): LmsDashboardTabKey {
  return raw === "purchases" ? "purchases" : "overview";
}

export function lmsDashboardHref(tab?: LmsDashboardTabKey): string {
  if (!tab || tab === "overview") return LMS_BASE;
  return `${LMS_BASE}?tab=${tab}`;
}

export function parseLmsManageTab(raw: string | null | undefined): LmsManageTabKey {
  return raw === "learners" ? "learners" : "courses";
}

export function lmsManageHref(tab?: LmsManageTabKey): string {
  if (!tab || tab === "courses") return LMS_MANAGE_PATH;
  return `${LMS_MANAGE_PATH}?tab=${tab}`;
}

/** หน้าจัดการบทเรียน + ข้อสอบของคอร์ส (เต็มหน้า) */
export function lmsManageCourseHref(courseId: string): string {
  return `${LMS_MANAGE_PATH}/courses/${encodeURIComponent(courseId)}`;
}

export function parseLmsSettingsTab(raw: string | null | undefined): LmsSettingsTab {
  if (raw === "finance" || raw === "portal") return raw;
  return "basic";
}

export function lmsSettingsHref(tab?: LmsSettingsTab): string {
  if (!tab || tab === "basic") return LMS_SETTINGS_PATH;
  return `${LMS_SETTINGS_PATH}?tab=${tab}`;
}

export function lmsModuleNavIcon(key: LmsModuleNavKey): ReactElement {
  switch (key) {
    case "dashboard":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
    case "finance":
      return <path d="M4 18h16M7 14l3-3 3 2 4-5" />;
    case "manage":
      return (
        <>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M8 7h8M8 11h6" />
        </>
      );
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

export function readLmsHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(LMS_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeLmsHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LMS_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(LMS_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
