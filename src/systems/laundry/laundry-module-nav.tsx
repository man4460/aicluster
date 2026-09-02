import type { ReactElement } from "react";
import { MODULE_SHOP_SETTINGS_SHORT_LABEL } from "@/systems/module-shop/module-shop-settings-nav";

export const LAUNDRY_BASE = "/dashboard/laundry";
export const LAUNDRY_FINANCE_PATH = `${LAUNDRY_BASE}/finance`;
export const LAUNDRY_MANAGE_PATH = `${LAUNDRY_BASE}/manage`;
export const LAUNDRY_SETTINGS_PATH = `${LAUNDRY_BASE}/settings`;
export const LAUNDRY_STAFF_PATH = `${LAUNDRY_BASE}/staff`;

export const LAUNDRY_MODULE_DISPLAY_NAME = "รับฝากซักผ้า";
export const LAUNDRY_HEADER_COLLAPSE_KEY = "mawell-laundry-module-header-collapsed";
export const LAUNDRY_HEADER_COLLAPSE_EVENT = "mawell-laundry-header-collapse";

export const LAUNDRY_SETTINGS_LINK_HREF = `${LAUNDRY_SETTINGS_PATH}?tab=link`;

/** เมนูหลัก: แดชบอร์ด · การเงิน · การจัดการ · ตั้งค่า */
export type LaundryModuleNavKey = "dashboard" | "finance" | "manage" | "settings";

/** แท็บย่อยแดชบอร์ด: ภาพรวม · ออเดอร์หน้าร้าน · คิวสั่งออนไลน์ */
export type LaundryDashboardTabKey = "overview" | "orders" | "online";

/** แท็บย่อยการจัดการ: แพ็กเกจ · สมาชิก */
export type LaundryManageTabKey = "packages" | "members";

export type LaundrySettingsTab = "basic" | "finance" | "portal" | "hours" | "link";

/** @deprecated ใช้ LaundryModuleNavKey */
export type LaundryTabKey = "overview" | "finance" | "packages";

export const LAUNDRY_DASHBOARD_TAB_KEYS = new Set<string>(["overview", "orders", "online"]);
export const LAUNDRY_MANAGE_TAB_KEYS = new Set<string>(["packages", "members", "purchases"]);

export type LaundryNavItem = {
  key: LaundryModuleNavKey;
  label: string;
  shortLabel: string;
  href: string;
};

export const LAUNDRY_NAV_ITEMS: LaundryNavItem[] = [
  { key: "dashboard", label: "แดชบอร์ด", shortLabel: "แดช", href: LAUNDRY_BASE },
  { key: "finance", label: "การเงิน", shortLabel: "เงิน", href: LAUNDRY_FINANCE_PATH },
  { key: "manage", label: "การจัดการ", shortLabel: "จัดการ", href: LAUNDRY_MANAGE_PATH },
  { key: "settings", label: MODULE_SHOP_SETTINGS_SHORT_LABEL, shortLabel: "ตั้งค่า", href: LAUNDRY_SETTINGS_PATH },
];

export const LAUNDRY_DASHBOARD_TAB_ITEMS: { key: LaundryDashboardTabKey; label: string }[] = [
  { key: "overview", label: "ภาพรวม" },
  { key: "orders", label: "ออเดอร์" },
  { key: "online", label: "คิวสั่งออนไลน์" },
];

export const LAUNDRY_MANAGE_TAB_ITEMS: { key: LaundryManageTabKey; label: string }[] = [
  { key: "packages", label: "แพ็กเกจ" },
  { key: "members", label: "สมาชิก" },
];

/** @deprecated ใช้ LAUNDRY_NAV_ITEMS */
export const LAUNDRY_TAB_ITEMS = LAUNDRY_NAV_ITEMS.filter((i) => i.key !== "settings").map((item) => ({
  key: item.key === "dashboard" ? ("overview" as LaundryTabKey) : (item.key as LaundryTabKey),
  label: item.label,
  shortLabel: item.shortLabel,
}));

export function laundryPathFlags(pathname: string) {
  const norm = pathname.replace(/\/+$/, "");
  const onLaundry = norm === LAUNDRY_BASE || norm.startsWith(`${LAUNDRY_BASE}/`);
  const onStaff = norm === LAUNDRY_STAFF_PATH;
  const onFinance = norm === LAUNDRY_FINANCE_PATH || norm.startsWith(`${LAUNDRY_FINANCE_PATH}/`);
  const onManage = norm === LAUNDRY_MANAGE_PATH || norm.startsWith(`${LAUNDRY_MANAGE_PATH}/`);
  const onSettings = norm === LAUNDRY_SETTINGS_PATH || norm.startsWith(`${LAUNDRY_SETTINGS_PATH}/`);
  const onDashboard = norm === LAUNDRY_BASE;
  const plainInner = onStaff || onFinance || onManage || onSettings;
  return { onLaundry, onStaff, onFinance, onManage, onSettings, onDashboard, plainInner };
}

export function isLaundryModulePath(pathname: string): boolean {
  if (!pathname) return false;
  return pathname === LAUNDRY_BASE || pathname.startsWith(`${LAUNDRY_BASE}/`);
}

export function parseLaundryDashboardTab(raw: string | null | undefined): LaundryDashboardTabKey {
  if (raw && LAUNDRY_DASHBOARD_TAB_KEYS.has(raw)) return raw as LaundryDashboardTabKey;
  return "overview";
}

export function laundryDashboardTabLabel(tab: LaundryDashboardTabKey): string {
  return LAUNDRY_DASHBOARD_TAB_ITEMS.find((item) => item.key === tab)?.label ?? "ภาพรวม";
}

export function parseLaundryManageTab(raw: string | null | undefined): LaundryManageTabKey {
  if (raw === "members" || raw === "purchases") return "members";
  if (raw === "packages") return "packages";
  return "packages";
}

export function parseLaundryTab(value: string | null | undefined): LaundryTabKey {
  if (value === "finance") return "finance";
  if (value === "packages" || value === "manage") return "packages";
  return "overview";
}

export function isLaundryModuleNavItemActive(pathname: string, key: LaundryModuleNavKey): boolean {
  const norm = pathname.replace(/\/+$/, "");
  switch (key) {
    case "dashboard":
      return norm === LAUNDRY_BASE || norm === LAUNDRY_STAFF_PATH;
    case "finance":
      return norm === LAUNDRY_FINANCE_PATH || norm.startsWith(`${LAUNDRY_FINANCE_PATH}/`);
    case "manage":
      return norm === LAUNDRY_MANAGE_PATH || norm.startsWith(`${LAUNDRY_MANAGE_PATH}/`);
    case "settings":
      return norm === LAUNDRY_SETTINGS_PATH || norm.startsWith(`${LAUNDRY_SETTINGS_PATH}/`);
    default:
      return false;
  }
}

/** @deprecated */
export function isLaundryTabActive(pathname: string, tab: LaundryTabKey, tabParam: string | null): boolean {
  if (tab === "finance") return isLaundryModuleNavItemActive(pathname, "finance");
  if (tab === "packages") return isLaundryModuleNavItemActive(pathname, "manage");
  return isLaundryModuleNavItemActive(pathname, "dashboard") && parseLaundryDashboardTab(tabParam) === "overview";
}

/** @deprecated */
export function laundryTabHref(tab: LaundryTabKey): string {
  if (tab === "finance") return LAUNDRY_FINANCE_PATH;
  if (tab === "packages") return LAUNDRY_MANAGE_PATH;
  return LAUNDRY_BASE;
}

export function laundryManageHref(tab?: LaundryManageTabKey): string {
  if (!tab || tab === "packages") return LAUNDRY_MANAGE_PATH;
  return `${LAUNDRY_MANAGE_PATH}?tab=${tab}`;
}

export function laundryStaffDashboardTabHref(tab: LaundryDashboardTabKey): string {
  if (tab === "overview") return LAUNDRY_STAFF_PATH;
  return `${LAUNDRY_STAFF_PATH}?tab=${tab}`;
}

export function laundryDashboardTabHref(tab: LaundryDashboardTabKey): string {
  if (tab === "overview") return LAUNDRY_BASE;
  return `${LAUNDRY_BASE}?tab=${tab}`;
}

export function isLaundrySettingsActive(pathname: string): boolean {
  return pathname.replace(/\/+$/, "") === LAUNDRY_SETTINGS_PATH;
}

export function laundryModuleNavIcon(key: LaundryModuleNavKey): ReactElement {
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

export function laundryDashboardTabIcon(key: LaundryDashboardTabKey): ReactElement {
  switch (key) {
    case "overview":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
    case "orders":
      return (
        <>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M12 8v8M8 12h8" />
        </>
      );
    case "online":
      return (
        <>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="9" />;
  }
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
