export const CLUB_EVENT_BASE = "/dashboard/club-event";
export const CLUB_EVENT_FINANCE_PATH = `${CLUB_EVENT_BASE}/finance`;
export const CLUB_EVENT_MANAGE_PATH = `${CLUB_EVENT_BASE}/manage`;
export const CLUB_EVENT_SETTINGS_PATH = `${CLUB_EVENT_BASE}/settings`;

export const CLUB_EVENT_MODULE_DISPLAY_NAME = "บริหารชมรม";
export const CLUB_EVENT_HEADER_COLLAPSE_KEY = "mawell-club-event-module-header-collapsed";
export const CLUB_EVENT_HEADER_COLLAPSE_EVENT = "mawell-club-event-header-collapse";

export type ClubEventModuleNavKey = "dashboard" | "finance" | "manage" | "settings";
export type ClubEventDashboardTabKey = "upcoming" | "past";
export type ClubEventManageTabKey = "members" | "assets";
export type ClubEventSettingsTab = "basic" | "finance" | "links";

export const CLUB_EVENT_NAV_ITEMS: {
  key: ClubEventModuleNavKey;
  label: string;
  shortLabel: string;
  href: string;
}[] = [
  { key: "dashboard", label: "แดชบอร์ด", shortLabel: "แดช", href: CLUB_EVENT_BASE },
  { key: "finance", label: "การเงิน", shortLabel: "เงิน", href: CLUB_EVENT_FINANCE_PATH },
  { key: "manage", label: "การจัดการ", shortLabel: "จัดการ", href: CLUB_EVENT_MANAGE_PATH },
  { key: "settings", label: "ตั้งค่า", shortLabel: "ตั้งค่า", href: CLUB_EVENT_SETTINGS_PATH },
];

export const CLUB_EVENT_DASHBOARD_TAB_ITEMS: { key: ClubEventDashboardTabKey; label: string }[] = [
  { key: "upcoming", label: "กำหนดการ" },
  { key: "past", label: "ย้อนหลัง" },
];

export const CLUB_EVENT_MANAGE_TAB_ITEMS: { key: ClubEventManageTabKey; label: string }[] = [
  { key: "members", label: "สมาชิก" },
  { key: "assets", label: "ทรัพย์สิน" },
];

export function readClubEventHeaderCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CLUB_EVENT_HEADER_COLLAPSE_KEY) === "1";
}

export function writeClubEventHeaderCollapsed(collapsed: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLUB_EVENT_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
  window.dispatchEvent(new CustomEvent(CLUB_EVENT_HEADER_COLLAPSE_EVENT, { detail: { collapsed } }));
}

export function isClubEventModulePath(pathname: string): boolean {
  if (!pathname) return false;
  return pathname === CLUB_EVENT_BASE || pathname.startsWith(`${CLUB_EVENT_BASE}/`);
}

export function isClubEventModuleNavItemActive(pathname: string, key: ClubEventModuleNavKey): boolean {
  const norm = pathname.replace(/\/+$/, "");
  switch (key) {
    case "dashboard":
      return norm === CLUB_EVENT_BASE;
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
  return raw === "past" ? "past" : "upcoming";
}

export function parseClubEventManageTab(raw: string | null | undefined): ClubEventManageTabKey {
  return raw === "assets" ? "assets" : "members";
}

export function parseClubEventSettingsTab(raw: string | null | undefined): ClubEventSettingsTab {
  if (raw === "finance" || raw === "links") return raw;
  return "basic";
}
