import type { ReactNode } from "react";

export const FOOTBALL_TURF_BASE = "/dashboard/football-turf";

export const FOOTBALL_TURF_SETTINGS_LINK_HREF = `${FOOTBALL_TURF_BASE}?tab=settings&menu=link`;

export const FOOTBALL_TURF_HEADER_COLLAPSE_KEY = "mawell-football-turf-module-header-collapsed";
export const FOOTBALL_TURF_HEADER_COLLAPSE_EVENT = "mawell-football-turf-header-collapse";

export const FOOTBALL_TURF_MODULE_DISPLAY_NAME = "สนามฟุตบอล";

export type FootballTurfTabKey =
  | "overview"
  | "queue"
  | "finance"
  | "manage"
  | "settings";

/** หมวดย่อยในแท็บการจัดการ (โปร · ลูกค้า · สนาม) */
export type FootballTurfManageSection = "offers" | "customers" | "courts";

/** @deprecated ใช้ FootballTurfManageSection */
export type FootballTurfCrmSection = Extract<FootballTurfManageSection, "offers" | "customers">;

export const FOOTBALL_TURF_TAB_ITEMS: { key: FootballTurfTabKey; label: string; shortLabel: string }[] = [
  { key: "overview", label: "ภาพรวม", shortLabel: "ภาพรวม" },
  { key: "queue", label: "จอง", shortLabel: "จอง" },
  { key: "finance", label: "การเงิน", shortLabel: "เงิน" },
  { key: "manage", label: "การจัดการ", shortLabel: "จัดการ" },
  { key: "settings", label: "ตั้งค่า", shortLabel: "ตั้งค่า" },
];

/** เมนูลิงก์พนักงาน — เฉพาะภาพรวม · จอง · โปร */
export const FOOTBALL_TURF_STAFF_TAB_ITEMS: {
  key: Extract<FootballTurfTabKey, "overview" | "queue" | "manage">;
  label: string;
  shortLabel: string;
}[] = [
  { key: "overview", label: "ภาพรวม", shortLabel: "ภาพรวม" },
  { key: "queue", label: "จอง", shortLabel: "จอง" },
  { key: "manage", label: "โปร", shortLabel: "โปร" },
];

export type FootballTurfStaffTabKey = (typeof FOOTBALL_TURF_STAFF_TAB_ITEMS)[number]["key"];

export function isFootballTurfModulePath(pathname: string): boolean {
  return pathname === FOOTBALL_TURF_BASE || pathname.startsWith(`${FOOTBALL_TURF_BASE}/`);
}

export function readFootballTurfHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(FOOTBALL_TURF_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeFootballTurfHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(FOOTBALL_TURF_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(FOOTBALL_TURF_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}

export function parseFootballTurfTab(value: string | null | undefined): FootballTurfTabKey {
  if (value === "queue" || value === "finance" || value === "manage" || value === "settings") {
    return value;
  }
  // ลิงก์เก่า
  if (value === "offers" || value === "courts" || value === "customers") return "manage";
  if (value === "qr") return "settings";
  return "overview";
}

/** อ่านหมวดย่อยการจัดการจาก query (รองรับ ?tab=offers|courts|customers เดิม) */
export function parseFootballTurfManageSection(
  tabParam: string | null | undefined,
  sectionParam?: string | null,
): FootballTurfManageSection {
  if (sectionParam === "customers" || sectionParam === "courts" || sectionParam === "offers") {
    return sectionParam;
  }
  if (tabParam === "customers") return "customers";
  if (tabParam === "courts") return "courts";
  return "offers";
}

/** @deprecated ใช้ parseFootballTurfManageSection */
export function parseFootballTurfCrmSection(tabParam: string | null | undefined): FootballTurfCrmSection {
  const section = parseFootballTurfManageSection(tabParam);
  return section === "courts" ? "offers" : section;
}

export function footballTurfTabHref(tab: FootballTurfTabKey): string {
  if (tab === "overview") return FOOTBALL_TURF_BASE;
  return `${FOOTBALL_TURF_BASE}?tab=${tab}`;
}

export function isFootballTurfTabActive(pathname: string, tab: FootballTurfTabKey, tabParam: string | null): boolean {
  const norm = pathname.replace(/\/+$/, "");
  if (norm !== FOOTBALL_TURF_BASE) return false;
  if (tab === "overview") return !tabParam || tabParam === "overview";
  return parseFootballTurfTab(tabParam) === tab;
}

export function footballTurfTabIcon(key: FootballTurfTabKey): ReactNode {
  switch (key) {
    case "overview":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
    case "queue":
      return <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />;
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
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 10.91 3H11a2 2 0 1 1 4 0h.09a1.65 1.65 0 0 0 1.51 1h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0A1.65 1.65 0 0 0 21 10.91V11a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="9" />;
  }
}
