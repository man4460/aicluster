import type { ReactNode } from "react";

export const FOOTBALL_TURF_BASE = "/dashboard/football-turf";

export const FOOTBALL_TURF_HEADER_COLLAPSE_KEY = "mawell-football-turf-module-header-collapsed";
export const FOOTBALL_TURF_HEADER_COLLAPSE_EVENT = "mawell-football-turf-header-collapse";

export const FOOTBALL_TURF_MODULE_DISPLAY_NAME = "สนามฟุตบอล";

export type FootballTurfTabKey =
  | "overview"
  | "queue"
  | "finance"
  | "offers"
  | "courts"
  | "qr"
  | "settings";

/** หมวดย่อยในแท็บโปร / ลูกค้า */
export type FootballTurfCrmSection = "offers" | "customers";

export const FOOTBALL_TURF_TAB_ITEMS: { key: FootballTurfTabKey; label: string; shortLabel: string }[] = [
  { key: "overview", label: "ภาพรวม", shortLabel: "ภาพรวม" },
  { key: "queue", label: "จอง", shortLabel: "จอง" },
  { key: "finance", label: "การเงิน", shortLabel: "เงิน" },
  { key: "offers", label: "โปร / ลูกค้า", shortLabel: "โปร" },
  { key: "courts", label: "จัดการสนาม", shortLabel: "สนาม" },
  { key: "qr", label: "QR / ลิงก์", shortLabel: "QR" },
  { key: "settings", label: "ตั้งค่า", shortLabel: "ตั้งค่า" },
];

/** เมนูลิงก์พนักงาน — เฉพาะภาพรวม · จอง · โปร (แบบโรงแรม) */
export const FOOTBALL_TURF_STAFF_TAB_ITEMS: {
  key: Extract<FootballTurfTabKey, "overview" | "queue" | "offers">;
  label: string;
  shortLabel: string;
}[] = [
  { key: "overview", label: "ภาพรวม", shortLabel: "ภาพรวม" },
  { key: "queue", label: "จอง", shortLabel: "จอง" },
  { key: "offers", label: "โปร", shortLabel: "โปร" },
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
  if (
    value === "queue" ||
    value === "finance" ||
    value === "offers" ||
    value === "courts" ||
    value === "qr" ||
    value === "settings"
  ) {
    return value;
  }
  // ลิงก์เก่า ?tab=customers → แท็บโปร / ลูกค้า
  if (value === "customers") return "offers";
  return "overview";
}

/** อ่านหมวดย่อยโปร/ลูกค้าจาก query (รองรับ ?tab=customers เดิม) */
export function parseFootballTurfCrmSection(tabParam: string | null | undefined): FootballTurfCrmSection {
  return tabParam === "customers" ? "customers" : "offers";
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
    case "offers":
      // โปร / ลูกค้า — ไอคอนผู้ใช้คู่ (ไม่ซ้อนกับแท็ก)
      return (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      );
    case "courts":
      return (
        <>
          <path d="M4 20h16" />
          <path d="M6 20V10l6-4 6 4v10" />
          <path d="M10 20v-4h4v4" />
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
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0A1.65 1.65 0 0 0 10.91 3H11a2 2 0 1 1 4 0h.09a1.65 1.65 0 0 0 1.51 1h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0A1.65 1.65 0 0 0 21 10.91V11a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="9" />;
  }
}
