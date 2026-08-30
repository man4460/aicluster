export const PARKING_MODULE_PATH_PREFIX = "/dashboard/parking";
export const PARKING_SETTINGS_HREF = `${PARKING_MODULE_PATH_PREFIX}/settings`;
/** @deprecated ใช้ parkingDashboardHref("checkin") */
export const PARKING_CHECKIN_HREF = `${PARKING_MODULE_PATH_PREFIX}/checkin`;
export const PARKING_SPOT_DETAIL_PREFIX = `${PARKING_MODULE_PATH_PREFIX}/spots`;
/** @deprecated ใช้ PARKING_SPOT_DETAIL_PREFIX */
export const PARKING_SPOTS_HREF = PARKING_SPOT_DETAIL_PREFIX;
export const PARKING_LOTS_HREF = `${PARKING_MODULE_PATH_PREFIX}/lots`;
export const PARKING_FINANCE_HREF = `${PARKING_MODULE_PATH_PREFIX}/finance`;
/** @deprecated ใช้ parkingDashboardHref("booking") */
export const PARKING_BOOKINGS_HREF = `${PARKING_MODULE_PATH_PREFIX}/bookings`;
export const PARKING_OFFERS_HREF = `${PARKING_MODULE_PATH_PREFIX}/offers`;
/** @deprecated ใช้ PARKING_FINANCE_HREF */
export const PARKING_HISTORY_HREF = `${PARKING_MODULE_PATH_PREFIX}/history`;

export const PARKING_MODULE_DISPLAY_NAME = "ที่จอดรถ";

export const PARKING_HEADER_COLLAPSE_KEY = "mawell-parking-module-header-collapsed";

export const PARKING_HEADER_COLLAPSE_EVENT = "mawell-parking-header-collapse";

/** เมนูหลักโมดูล (ลานจอดรวมในหน้าการจัดการ) */
export type ParkingNavKey = "dashboard" | "offers" | "finance" | "settings";

/** แท็บย่อยในหน้าแดชบอร์ด */
export type ParkingDashboardTabKey = "overview" | "checkin" | "checkout" | "booking";

/** แท็บย่อยในหน้าการจัดการ (แพ็ก · สมาชิก · ลาน) */
export type ParkingManageTabKey = "packages" | "memberships" | "lots";

export const PARKING_MANAGE_TAB_KEYS = new Set<string>(["packages", "memberships", "lots"]);

export function parseParkingManageTab(raw: string | null): ParkingManageTabKey {
  if (raw && PARKING_MANAGE_TAB_KEYS.has(raw)) return raw as ParkingManageTabKey;
  return "packages";
}

export type ParkingLotsViewKey = "lots" | "spots";

export function parkingOffersHref(opts?: {
  tab?: ParkingManageTabKey;
  lot?: number | string;
  /** มุมมองภายในแท็บลานจอด */
  view?: ParkingLotsViewKey;
}): string {
  const q = new URLSearchParams();
  if (opts?.tab && opts.tab !== "packages") q.set("tab", opts.tab);
  if (opts?.view && opts.view !== "lots") q.set("view", opts.view);
  if (opts?.lot != null && opts.lot !== "") q.set("lot", String(opts.lot));
  const qs = q.toString();
  return qs ? `${PARKING_OFFERS_HREF}?${qs}` : PARKING_OFFERS_HREF;
}

export function parseParkingLotsView(raw: string | null): ParkingLotsViewKey {
  return raw === "spots" ? "spots" : "lots";
}

export const PARKING_DASHBOARD_TAB_KEYS = new Set<string>(["overview", "checkin", "checkout", "booking"]);

export function parseParkingDashboardTab(raw: string | null): ParkingDashboardTabKey {
  if (raw && PARKING_DASHBOARD_TAB_KEYS.has(raw)) return raw as ParkingDashboardTabKey;
  return "overview";
}

export function parkingDashboardHref(
  tab?: ParkingDashboardTabKey,
  extra?: { spot?: number | string },
): string {
  const q = new URLSearchParams();
  if (tab && tab !== "overview") q.set("tab", tab);
  if (extra?.spot != null && extra.spot !== "") q.set("spot", String(extra.spot));
  const qs = q.toString();
  return qs ? `${PARKING_MODULE_PATH_PREFIX}?${qs}` : PARKING_MODULE_PATH_PREFIX;
}

export type ParkingNavItem = {
  key: ParkingNavKey;
  href: string;
  label: string;
  shortLabel: string;
};

export const PARKING_NAV_ITEMS: readonly ParkingNavItem[] = [
  { key: "dashboard", href: PARKING_MODULE_PATH_PREFIX, label: "แดชบอร์ด", shortLabel: "แดช" },
  { key: "offers", href: PARKING_OFFERS_HREF, label: "การจัดการ", shortLabel: "จัดการ" },
  { key: "finance", href: PARKING_FINANCE_HREF, label: "การเงิน", shortLabel: "การเงิน" },
  { key: "settings", href: PARKING_SETTINGS_HREF, label: "ตั้งค่า", shortLabel: "ตั้งค่า" },
] as const;

export const PARKING_DASHBOARD_TAB_ITEMS: {
  key: ParkingDashboardTabKey;
  label: string;
}[] = [
  { key: "overview", label: "ภาพรวม" },
  { key: "checkin", label: "เช็คอิน" },
  { key: "checkout", label: "เช็คเอาต์" },
  { key: "booking", label: "การจอง" },
];

export function parkingSpotDetailHref(spotId: number | string): string {
  return parkingDashboardHref("checkin", { spot: spotId });
}

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
  const isDashboard =
    pathNorm === PARKING_MODULE_PATH_PREFIX ||
    pathNorm === PARKING_CHECKIN_HREF ||
    pathNorm.startsWith(`${PARKING_CHECKIN_HREF}/`) ||
    pathNorm === PARKING_BOOKINGS_HREF ||
    pathNorm.startsWith(`${PARKING_BOOKINGS_HREF}/`);
  const isSettings = pathNorm === PARKING_SETTINGS_HREF || pathNorm.endsWith("/settings");
  const isLots =
    pathNorm === PARKING_LOTS_HREF ||
    pathNorm.startsWith(`${PARKING_LOTS_HREF}/`);
  const isFinance =
    pathNorm === PARKING_FINANCE_HREF ||
    pathNorm.startsWith(`${PARKING_FINANCE_HREF}/`) ||
    pathNorm === PARKING_HISTORY_HREF ||
    pathNorm.startsWith(`${PARKING_HISTORY_HREF}/`);
  const isOffers =
    pathNorm === PARKING_OFFERS_HREF ||
    pathNorm.startsWith(`${PARKING_OFFERS_HREF}/`) ||
    isLots;
  return { onModule, isDashboard, isOffers, isLots, isFinance, isSettings };
}

export function isParkingNavItemActive(pathname: string, key: ParkingNavKey): boolean {
  const f = parkingPathFlags(pathname);
  switch (key) {
    case "dashboard":
      return f.isDashboard;
    case "offers":
      return f.isOffers;
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

export type ParkingPricingMode = "HOURLY" | "DAILY" | "MONTHLY";

export function parkingPricingModeLabel(mode: ParkingPricingMode): string {
  if (mode === "MONTHLY") return "รายเดือน";
  if (mode === "DAILY") return "รายวัน";
  return "รายชั่วโมง";
}

