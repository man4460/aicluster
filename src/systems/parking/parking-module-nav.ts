export const PARKING_MODULE_PATH_PREFIX = "/dashboard/parking";
export const PARKING_SETTINGS_HREF = `${PARKING_MODULE_PATH_PREFIX}/settings`;
export const PARKING_SPOTS_HREF = `${PARKING_MODULE_PATH_PREFIX}/spots`;
export const PARKING_FINANCE_HREF = `${PARKING_MODULE_PATH_PREFIX}/finance`;
/** @deprecated ใช้ PARKING_FINANCE_HREF */
export const PARKING_HISTORY_HREF = `${PARKING_MODULE_PATH_PREFIX}/history`;

export const PARKING_MODULE_DISPLAY_NAME = "ที่จอดรถ";

export const PARKING_HEADER_COLLAPSE_KEY = "mawell-parking-module-header-collapsed";

export const PARKING_HEADER_COLLAPSE_EVENT = "mawell-parking-header-collapse";

export type ParkingNavKey = "dashboard" | "spots" | "finance" | "settings";

export type ParkingNavItem = {
  key: ParkingNavKey;
  href: string;
  label: string;
  shortLabel: string;
};

export const PARKING_NAV_ITEMS: readonly ParkingNavItem[] = [
  { key: "dashboard", href: PARKING_MODULE_PATH_PREFIX, label: "แดชบอร์ด", shortLabel: "ภาพรวม" },
  { key: "spots", href: PARKING_SPOTS_HREF, label: "การจัดการ", shortLabel: "จัดการ" },
  { key: "finance", href: PARKING_FINANCE_HREF, label: "การเงิน", shortLabel: "การเงิน" },
  { key: "settings", href: PARKING_SETTINGS_HREF, label: "ตั้งค่า", shortLabel: "ตั้งค่า" },
] as const;

export function isParkingModulePath(pathname: string): boolean {
  if (!pathname) return false;
  return (
    pathname === PARKING_MODULE_PATH_PREFIX ||
    pathname.startsWith(`${PARKING_MODULE_PATH_PREFIX}/`)
  );
}

export function parkingPathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isParkingModulePath(pathname);
  const isSettings = pathNorm === PARKING_SETTINGS_HREF || pathNorm.endsWith("/settings");
  const isSpots = pathNorm === PARKING_SPOTS_HREF || pathNorm.startsWith(`${PARKING_SPOTS_HREF}/`);
  const isFinance =
    pathNorm === PARKING_FINANCE_HREF ||
    pathNorm.startsWith(`${PARKING_FINANCE_HREF}/`) ||
    pathNorm === PARKING_HISTORY_HREF ||
    pathNorm.startsWith(`${PARKING_HISTORY_HREF}/`);
  const isDashboard = onModule && !isSettings && !isSpots && !isFinance;
  return { onModule, isDashboard, isSpots, isFinance, isSettings };
}

export function isParkingNavItemActive(pathname: string, key: ParkingNavKey): boolean {
  const f = parkingPathFlags(pathname);
  switch (key) {
    case "dashboard":
      return f.isDashboard;
    case "spots":
      return f.isSpots;
    case "finance":
      return f.isFinance;
    case "settings":
      return f.isSettings;
    default:
      return false;
  }
}

/** @deprecated ใช้ isParkingNavItemActive */
export function parkingNavActive(pathname: string, href: string): boolean {
  const item = PARKING_NAV_ITEMS.find((n) => n.href === href);
  if (item) return isParkingNavItemActive(pathname, item.key);
  if (href === PARKING_MODULE_PATH_PREFIX) {
    return pathname === PARKING_MODULE_PATH_PREFIX;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function readParkingHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(PARKING_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeParkingHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PARKING_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(PARKING_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
