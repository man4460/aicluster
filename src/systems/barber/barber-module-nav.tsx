import type { ReactElement } from "react";
import { MODULE_SHOP_SETTINGS_SHORT_LABEL } from "@/systems/module-shop/module-shop-settings-nav";

export const BARBER_MODULE_DISPLAY_NAME = "ร้านตัดผม";

export const BARBER_HEADER_COLLAPSE_KEY = "mawell-barber-module-header-collapsed";
export const BARBER_HEADER_COLLAPSE_EVENT = "mawell-barber-header-collapse";

export const BARBER_MODULE_PATH_PREFIX = "/dashboard/barber";
export const BARBER_STAFF_KIOSK_PATH = "/dashboard/barber/staff";
export const BARBER_SETTINGS_HREF = `${BARBER_MODULE_PATH_PREFIX}/settings`;
export const BARBER_SETTINGS_LINK_HREF = `${BARBER_SETTINGS_HREF}?tab=link`;
export const BARBER_MANAGE_HREF = "/dashboard/barber/manage";

export function isBarberModulePath(pathname: string): boolean {
  if (!pathname) return false;
  return (
    pathname === BARBER_MODULE_PATH_PREFIX ||
    pathname.startsWith(`${BARBER_MODULE_PATH_PREFIX}/`)
  );
}

export function barberPathFlags(pathname: string) {
  const onBarber = isBarberModulePath(pathname);
  const onStaff = pathname === BARBER_STAFF_KIOSK_PATH;
  const onFinance =
    onBarber &&
    (pathname === "/dashboard/barber/finance" || pathname.startsWith("/dashboard/barber/finance/"));
  const onManage =
    onBarber &&
    (pathname === BARBER_MANAGE_HREF ||
      pathname.startsWith(`${BARBER_MANAGE_HREF}/`) ||
      pathname === "/dashboard/barber/packages" ||
      pathname.startsWith("/dashboard/barber/packages/"));
  const onSettings =
    pathname === BARBER_SETTINGS_HREF || pathname.startsWith(`${BARBER_SETTINGS_HREF}/`);
  /** การเงิน · ตั้งค่า · การจัดการ มีการ์ดเนื้อหาเอง — ไม่ห่อ barberModuleContentShell ซ้ำ */
  const plainInner = onStaff || onFinance || onManage || onSettings;
  return {
    onBarber,
    onStaff,
    onFinance,
    onManage,
    /** @deprecated ใช้ onManage */
    onPackages: onManage,
    onSettings,
    plainInner,
  };
}

/**
 * Dashboard hub: overview / queue / checkin
 * ช่าง + แพ็กเกจ + สมาชิก → หน้าการจัดการ
 * Main module tabs: dashboard · finance · manage · settings
 */
export type BarberModuleNavKey = "dashboard" | "finance" | "manage" | "settings";

export type BarberDashboardTabKey = "overview" | "queue" | "checkin";

/** หมวดย่อยในหน้าการจัดการ */
export type BarberManageTabKey = "stylists" | "packages" | "members";

export const BARBER_DASHBOARD_TAB_KEYS = new Set<string>(["overview", "queue", "checkin"]);

export const BARBER_MANAGE_TAB_KEYS = new Set<string>(["stylists", "packages", "members"]);

export function parseBarberDashboardTab(raw: string | null): BarberDashboardTabKey {
  if (raw && BARBER_DASHBOARD_TAB_KEYS.has(raw)) return raw as BarberDashboardTabKey;
  return "overview";
}

export function parseBarberManageTab(raw: string | null): BarberManageTabKey {
  if (raw && BARBER_MANAGE_TAB_KEYS.has(raw)) return raw as BarberManageTabKey;
  return "stylists";
}

export function barberManageHref(tab?: BarberManageTabKey): string {
  if (!tab || tab === "stylists") return BARBER_MANAGE_HREF;
  return `${BARBER_MANAGE_HREF}?tab=${tab}`;
}

export type BarberNavItem = {
  key: BarberModuleNavKey;
  label: string;
  href: string;
};

export const BARBER_NAV_ITEMS: BarberNavItem[] = [
  { key: "dashboard", label: "แดชบอร์ด", href: "/dashboard/barber" },
  { key: "finance", label: "การเงิน", href: "/dashboard/barber/finance" },
  { key: "manage", label: "การจัดการ", href: BARBER_MANAGE_HREF },
  { key: "settings", label: MODULE_SHOP_SETTINGS_SHORT_LABEL, href: BARBER_SETTINGS_HREF },
];

export const BARBER_DASHBOARD_TAB_ITEMS: {
  key: BarberDashboardTabKey;
  label: string;
}[] = [
  { key: "overview", label: "ภาพรวม" },
  { key: "queue", label: "จัดการคิว" },
  { key: "checkin", label: "เช็กอิน" },
];

export const BARBER_MANAGE_TAB_ITEMS: {
  key: BarberManageTabKey;
  label: string;
}[] = [
  { key: "stylists", label: "ช่าง" },
  { key: "packages", label: "แพ็กเกจ" },
  { key: "members", label: "สมาชิก" },
];

export function isBarberModuleNavItemActive(pathname: string, key: BarberModuleNavKey): boolean {
  switch (key) {
    case "dashboard":
      return pathname === "/dashboard/barber" || pathname === BARBER_STAFF_KIOSK_PATH;
    case "finance":
      return (
        pathname === "/dashboard/barber/finance" || pathname.startsWith("/dashboard/barber/finance/")
      );
    case "manage":
      return (
        pathname === BARBER_MANAGE_HREF ||
        pathname.startsWith(`${BARBER_MANAGE_HREF}/`) ||
        pathname === "/dashboard/barber/packages" ||
        pathname.startsWith("/dashboard/barber/packages/")
      );
    case "settings":
      return (
        pathname === BARBER_SETTINGS_HREF || pathname.startsWith(`${BARBER_SETTINGS_HREF}/`)
      );
    default:
      return false;
  }
}

export function barberModuleNavIcon(key: BarberModuleNavKey): ReactElement {
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

export function barberDashboardTabIcon(key: BarberDashboardTabKey): ReactElement {
  switch (key) {
    case "overview":
      return <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />;
    case "queue":
      return (
        <>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </>
      );
    case "checkin":
      return <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />;
    default:
      return <circle cx="12" cy="12" r="9" />;
  }
}

export function readBarberHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(BARBER_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeBarberHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(BARBER_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(BARBER_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
