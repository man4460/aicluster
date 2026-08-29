export const PARKING_MODULE_PATH_PREFIX = "/dashboard/parking";

export const PARKING_MODULE_DISPLAY_NAME = "ที่จอดรถ";

export const PARKING_HEADER_COLLAPSE_KEY = "mawell-parking-module-header-collapsed";

export const PARKING_HEADER_COLLAPSE_EVENT = "mawell-parking-header-collapse";

export type ParkingNavKey = "dashboard" | "spots" | "history" | "settings";

export type ParkingNavItem = {
  key: ParkingNavKey;
  href: string;
  label: string;
};

export const PARKING_NAV_ITEMS: readonly ParkingNavItem[] = [
  { key: "dashboard", href: "/dashboard/parking", label: "แดชบอร์ด" },
  { key: "spots", href: "/dashboard/parking/spots", label: "ช่องจอด" },
  { key: "history", href: "/dashboard/parking/history", label: "ประวัติ" },
  { key: "settings", href: "/dashboard/parking/settings", label: "ตั้งค่า" },
] as const;

export function isParkingModulePath(pathname: string): boolean {
  if (!pathname) return false;
  return (
    pathname === PARKING_MODULE_PATH_PREFIX ||
    pathname.startsWith(`${PARKING_MODULE_PATH_PREFIX}/`)
  );
}

export function parkingNavActive(pathname: string, href: string): boolean {
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
