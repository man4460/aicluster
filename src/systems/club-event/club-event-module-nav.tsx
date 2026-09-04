import type { ReactElement } from "react";
import { MODULE_SHOP_SETTINGS_SHORT_LABEL } from "@/systems/module-shop/module-shop-settings-nav";

export const CLUB_EVENT_BASE = "/dashboard/club-event";
export const CLUB_EVENT_FINANCE_PATH = `${CLUB_EVENT_BASE}/finance`;
export const CLUB_EVENT_MANAGE_PATH = `${CLUB_EVENT_BASE}/manage`;
export const CLUB_EVENT_SETTINGS_PATH = `${CLUB_EVENT_BASE}/settings`;
export const CLUB_EVENT_EVENTS_PATH = `${CLUB_EVENT_BASE}/events`;

export function clubEventEventHref(id: string): string {
  return `${CLUB_EVENT_EVENTS_PATH}/${encodeURIComponent(id)}`;
}

/** หน้าแก้ไขกิจกรรม (ทั่วไป · ยูทูป · แกลเลอรี · ลิงก์) */
export function clubEventEventEditHref(id: string): string {
  return `${clubEventEventHref(id)}/edit`;
}

export function clubEventNewEventHref(): string {
  return `${CLUB_EVENT_EVENTS_PATH}/new`;
}

export const CLUB_EVENT_MODULE_DISPLAY_NAME = "บริหารชมรม";
export const CLUB_EVENT_HEADER_COLLAPSE_KEY = "mawell-club-event-module-header-collapsed";
export const CLUB_EVENT_HEADER_COLLAPSE_EVENT = "mawell-club-event-header-collapse";

/** เมนูหลัก: แดชบอร์ด · การเงิน · การจัดการ · ตั้งค่า */
export type ClubEventModuleNavKey = "dashboard" | "finance" | "manage" | "settings";

/** แท็บย่อยแดชบอร์ด: กำหนดการ · ย้อนหลัง · โครงสร้าง */
export type ClubEventDashboardTabKey = "upcoming" | "past" | "committee";

/** แท็บย่อยการจัดการ: สมาชิก · ทรัพย์สิน */
export type ClubEventManageTabKey = "members" | "assets";

/** แท็บย่อยตั้งค่า: พื้นฐาน · การเงิน · เว็ปลิงค์ลูกค้า */
export type ClubEventSettingsTab = "basic" | "finance" | "portal";

export type ClubEventNavItem = {
  key: ClubEventModuleNavKey;
  label: string;
  shortLabel: string;
  href: string;
};

export const CLUB_EVENT_NAV_ITEMS: ClubEventNavItem[] = [
  { key: "dashboard", label: "แดชบอร์ด", shortLabel: "แดช", href: CLUB_EVENT_BASE },
  { key: "finance", label: "การเงิน", shortLabel: "เงิน", href: CLUB_EVENT_FINANCE_PATH },
  { key: "manage", label: "การจัดการ", shortLabel: "จัดการ", href: CLUB_EVENT_MANAGE_PATH },
  {
    key: "settings",
    label: MODULE_SHOP_SETTINGS_SHORT_LABEL,
    shortLabel: "ตั้งค่า",
    href: CLUB_EVENT_SETTINGS_PATH,
  },
];

export const CLUB_EVENT_DASHBOARD_TAB_ITEMS: {
  key: ClubEventDashboardTabKey;
  label: string;
  shortLabel?: string;
}[] = [
  { key: "upcoming", label: "กำหนดการ", shortLabel: "กำหนด" },
  { key: "past", label: "ย้อนหลัง", shortLabel: "ย้อน" },
  { key: "committee", label: "โครงสร้าง", shortLabel: "โครง" },
];

export const CLUB_EVENT_MANAGE_TAB_ITEMS: {
  key: ClubEventManageTabKey;
  label: string;
  shortLabel?: string;
}[] = [
  { key: "members", label: "สมาชิก" },
  { key: "assets", label: "ทรัพย์สิน", shortLabel: "ทรัพย์" },
];

export const CLUB_EVENT_SETTINGS_TAB_ITEMS: {
  key: ClubEventSettingsTab;
  label: string;
  shortLabel?: string;
}[] = [
  { key: "basic", label: "ตั้งค่าพื้นฐาน", shortLabel: "พื้นฐาน" },
  { key: "finance", label: "ตั้งค่าเกี่ยวกับการเงิน", shortLabel: "การเงิน" },
  { key: "portal", label: "ตั้งค่าเว็ปลิงค์ลูกค้า", shortLabel: "เว็บ" },
];

export function isClubEventModulePath(pathname: string): boolean {
  if (!pathname) return false;
  return pathname === CLUB_EVENT_BASE || pathname.startsWith(`${CLUB_EVENT_BASE}/`);
}

export function isClubEventModuleNavItemActive(pathname: string, key: ClubEventModuleNavKey): boolean {
  const norm = pathname.replace(/\/+$/, "");
  switch (key) {
    case "dashboard":
      return (
        norm === CLUB_EVENT_BASE ||
        norm === CLUB_EVENT_EVENTS_PATH ||
        norm.startsWith(`${CLUB_EVENT_EVENTS_PATH}/`)
      );
    case "finance":
      return norm === CLUB_EVENT_FINANCE_PATH || norm.startsWith(`${CLUB_EVENT_FINANCE_PATH}/`);
    case "manage":
      return norm === CLUB_EVENT_MANAGE_PATH || norm.startsWith(`${CLUB_EVENT_MANAGE_PATH}/`);
    case "settings":
      return norm === CLUB_EVENT_SETTINGS_PATH || norm.startsWith(`${CLUB_EVENT_SETTINGS_PATH}/`);
    default:
      return false;
  }
}

export function parseClubEventDashboardTab(raw: string | null | undefined): ClubEventDashboardTabKey {
  if (raw === "past") return "past";
  if (raw === "committee") return "committee";
  return "upcoming";
}

export function clubEventDashboardTabHref(tab: ClubEventDashboardTabKey): string {
  if (tab === "upcoming") return CLUB_EVENT_BASE;
  return `${CLUB_EVENT_BASE}?tab=${tab}`;
}

export function parseClubEventManageTab(raw: string | null | undefined): ClubEventManageTabKey {
  return raw === "assets" ? "assets" : "members";
}

export function clubEventManageHref(tab?: ClubEventManageTabKey): string {
  if (!tab || tab === "members") return CLUB_EVENT_MANAGE_PATH;
  return `${CLUB_EVENT_MANAGE_PATH}?tab=${tab}`;
}

export function parseClubEventSettingsTab(raw: string | null | undefined): ClubEventSettingsTab {
  if (raw === "finance" || raw === "portal") return raw;
  if (raw === "links") return "portal";
  return "basic";
}

export function clubEventSettingsHref(tab?: ClubEventSettingsTab): string {
  if (!tab || tab === "basic") return CLUB_EVENT_SETTINGS_PATH;
  return `${CLUB_EVENT_SETTINGS_PATH}?tab=${tab}`;
}

export function clubEventModuleNavIcon(key: ClubEventModuleNavKey): ReactElement {
  switch (key) {
    case "dashboard":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
    case "finance":
      return <path d="M4 18h16M7 14l3-3 3 2 4-5" />;
    case "manage":
      return (
        <>
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
          <path d="M9 12h6M9 16h4" />
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

export function readClubEventHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(CLUB_EVENT_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeClubEventHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CLUB_EVENT_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(CLUB_EVENT_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
