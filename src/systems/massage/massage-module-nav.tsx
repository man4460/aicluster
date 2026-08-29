import { MODULE_SHOP_SETTINGS_SHORT_LABEL } from "@/systems/module-shop/module-shop-settings-nav";

/** ชื่อโมดูล Display — ใช้ใน global header bar (desktop md+ side label), HeaderBarNav, title */
export const MASSAGE_MODULE_DISPLAY_NAME = "ร้านนวด";

/** §12 Naming convention: localStorage key = mawell-{module}-module-header-collapsed */
export const MASSAGE_HEADER_COLLAPSE_KEY = "mawell-massage-module-header-collapsed";

/** §12 Custom event name = mawell-{module}-header-collapse (dispatch + addEventListener sync state) */
export const MASSAGE_HEADER_COLLAPSE_EVENT = "mawell-massage-header-collapse";

/** Path prefix ของโมดูลร้านนวด — match ทุก sub-path ด้วย startsWith */
export const MASSAGE_MODULE_PATH_PREFIX = "/dashboard/massage";

/** Staff kiosk path — ถึงแม้จะซ่อน chrome แต่ path ก็ยังอยู่ในโมดูล massage เดียว */
export const MASSAGE_STAFF_KIOSK_PATH = "/dashboard/massage/staff";

export const MASSAGE_MANAGE_HREF = "/dashboard/massage/manage";

export function isMassageModulePath(pathname: string): boolean {
  if (!pathname) return false;
  return (
    pathname === MASSAGE_MODULE_PATH_PREFIX ||
    pathname.startsWith(`${MASSAGE_MODULE_PATH_PREFIX}/`)
  );
}

/** Section flag helpers — ใช้ตัดสินใจเรื่อง hide chrome / plain inner content */
export function massagePathFlags(pathname: string) {
  const onMassage = isMassageModulePath(pathname);
  const onStaff = pathname === MASSAGE_STAFF_KIOSK_PATH;
  const onFinance =
    onMassage &&
    (pathname === "/dashboard/massage/finance" || pathname.startsWith("/dashboard/massage/finance/"));
  const onManage =
    onMassage &&
    (pathname === MASSAGE_MANAGE_HREF ||
      pathname.startsWith(`${MASSAGE_MANAGE_HREF}/`) ||
      pathname === "/dashboard/massage/packages" ||
      pathname.startsWith("/dashboard/massage/packages/"));
  const onQr =
    onMassage &&
    (pathname === "/dashboard/massage/qr" ||
      pathname.startsWith("/dashboard/massage/qr/") ||
      pathname === "/dashboard/massage/qr-poster" ||
      pathname === "/dashboard/massage/staff-qr");
  const onSettings =
    pathname === "/dashboard/massage/settings" ||
    pathname.startsWith("/dashboard/massage/settings/");
  const plainInner = onStaff || onFinance || onManage || onQr;
  return {
    onMassage,
    onStaff,
    onFinance,
    onManage,
    /** @deprecated ใช้ onManage */
    onPackages: onManage,
    onQr,
    onSettings,
    plainInner,
  };
}

/**
 * Dashboard hub tabs: overview / queue / checkin
 * หมอนวด + แพ็กเกจ + สมาชิก → หน้าการจัดการ
 * ตารางเวลา + QR → หน้าตั้งค่า (?tab=hours|link)
 * Main module tabs: dashboard · finance · manage · settings (4 ใบ — dock grid-cols-4)
 */
export type MassageModuleNavKey = "dashboard" | "finance" | "manage" | "settings";

export type MassageDashboardTabKey = "overview" | "queue" | "checkin";

/** หมวดย่อยในหน้าการจัดการ */
export type MassageManageTabKey = "therapists" | "packages" | "members";

export const MASSAGE_DASHBOARD_TAB_KEYS = new Set<string>(["overview", "queue", "checkin"]);

export const MASSAGE_MANAGE_TAB_KEYS = new Set<string>(["therapists", "packages", "members"]);

export function parseMassageDashboardTab(raw: string | null): MassageDashboardTabKey {
  if (raw && MASSAGE_DASHBOARD_TAB_KEYS.has(raw)) return raw as MassageDashboardTabKey;
  return "overview";
}

export function parseMassageManageTab(raw: string | null): MassageManageTabKey {
  if (raw && MASSAGE_MANAGE_TAB_KEYS.has(raw)) return raw as MassageManageTabKey;
  return "therapists";
}

export function massageManageHref(tab?: MassageManageTabKey): string {
  if (!tab || tab === "therapists") return MASSAGE_MANAGE_HREF;
  return `${MASSAGE_MANAGE_HREF}?tab=${tab}`;
}

/** Main module NAV items (ไม่รวม dashboard hub tabs) — ใช้ใน ModuleDesktopNav + HeaderBarNav */
export type MassageNavItem = {
  key: MassageModuleNavKey;
  label: string;
  href: string;
};

export const MASSAGE_NAV_ITEMS: MassageNavItem[] = [
  { key: "dashboard", label: "แดชบอร์ด", href: "/dashboard/massage" },
  { key: "finance", label: "การเงิน", href: "/dashboard/massage/finance" },
  { key: "manage", label: "การจัดการ", href: MASSAGE_MANAGE_HREF },
  { key: "settings", label: MODULE_SHOP_SETTINGS_SHORT_LABEL, href: "/dashboard/massage/settings" },
];

/** Dashboard hub TAB items — ใช้ใน MassageDashboardTabToolbar */
export const MASSAGE_DASHBOARD_TAB_ITEMS: {
  key: MassageDashboardTabKey;
  label: string;
}[] = [
  { key: "overview", label: "ภาพรวม" },
  { key: "queue", label: "จัดการคิว" },
  { key: "checkin", label: "เช็กอิน" },
];

export const MASSAGE_MANAGE_TAB_ITEMS: {
  key: MassageManageTabKey;
  label: string;
}[] = [
  { key: "therapists", label: "หมอนวด" },
  { key: "packages", label: "แพ็กเกจ" },
  { key: "members", label: "สมาชิก" },
];

export function massageTabHref(key: MassageModuleNavKey, dashboardTab?: MassageDashboardTabKey): string {
  const item = MASSAGE_NAV_ITEMS.find((i) => i.key === key);
  const base = item?.href ?? "/dashboard/massage";
  if (key === "dashboard" && dashboardTab && dashboardTab !== "overview") {
    return `${base}?tab=${dashboardTab}`;
  }
  return base;
}

export function isMassageModuleNavItemActive(
  pathname: string,
  key: MassageModuleNavKey,
): boolean {
  switch (key) {
    case "dashboard":
      return pathname === "/dashboard/massage" || pathname === MASSAGE_STAFF_KIOSK_PATH;
    case "finance":
      return (
        pathname === "/dashboard/massage/finance" ||
        pathname.startsWith("/dashboard/massage/finance/")
      );
    case "manage":
      return (
        pathname === MASSAGE_MANAGE_HREF ||
        pathname.startsWith(`${MASSAGE_MANAGE_HREF}/`) ||
        pathname === "/dashboard/massage/packages" ||
        pathname.startsWith("/dashboard/massage/packages/")
      );
    case "settings":
      return (
        pathname === "/dashboard/massage/settings" ||
        pathname.startsWith("/dashboard/massage/settings/")
      );
    default:
      return false;
  }
}

export function isMassageDashboardTabActive(
  pathname: string,
  tabKey: MassageDashboardTabKey,
  tabParam: string | null | undefined,
  fallbackKey: MassageDashboardTabKey,
): boolean {
  const onDashboardSurface =
    pathname === "/dashboard/massage" || pathname === MASSAGE_STAFF_KIOSK_PATH;
  if (!onDashboardSurface) return false;
  const actual = parseMassageDashboardTab(tabParam ?? fallbackKey);
  return actual === tabKey;
}

/**
 * Nav icons (stroke glyphs, เน้น strokeWidth 2.25–2.5 strokeLinecap round)
 */
export function massageDashboardTabIcon(key: MassageDashboardTabKey): React.ReactElement {
  switch (key) {
    case "overview":
      return (
        <>
          <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
        </>
      );
    case "queue":
      return (
        <>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </>
      );
    case "checkin":
      return <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />;
    default:
      return <circle cx="12" cy="12" r="9" />;
  }
}

export function massageModuleNavIcon(key: MassageModuleNavKey): React.ReactElement {
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
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="9" />;
  }
}

/** §12 SSR-safe read helper (typeof window check) — Module shell + DashboardShell ใช้ร่วมกัน */
export function readMassageHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(MASSAGE_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

/** §12 Write helper — setItem + dispatchEvent (MASSAGE_HEADER_COLLAPSE_EVENT) ทุกครั้งเพื่อ sync กับทุก component */
export function writeMassageHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MASSAGE_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(MASSAGE_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore storage errors (disabled privacy mode) */
  }
}
