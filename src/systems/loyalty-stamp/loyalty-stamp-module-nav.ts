export const LOYALTY_STAMP_BASE = "/dashboard/loyalty-stamp";
export const LOYALTY_STAMP_MODULE_DISPLAY_NAME = "สะสมแต้มดิจิทัล";

export const LOYALTY_STAMP_HEADER_COLLAPSE_KEY = "mawell-loyalty-stamp-module-header-collapsed";
export const LOYALTY_STAMP_HEADER_COLLAPSE_EVENT = "mawell-loyalty-stamp-header-collapse";

export type LoyaltyStampNavKey = "overview" | "stamp" | "qr" | "settings";

export type LoyaltyStampNavItem = {
  key: LoyaltyStampNavKey;
  href: string;
  label: string;
  shortLabel: string;
};

export const LOYALTY_STAMP_NAV_ITEMS: LoyaltyStampNavItem[] = [
  { key: "overview", href: LOYALTY_STAMP_BASE, label: "ภาพรวม", shortLabel: "ภาพรวม" },
  { key: "stamp", href: `${LOYALTY_STAMP_BASE}?tab=stamp`, label: "เพิ่มแต้ม", shortLabel: "แต้ม" },
  { key: "qr", href: `${LOYALTY_STAMP_BASE}?tab=qr`, label: "QR", shortLabel: "QR" },
  { key: "settings", href: `${LOYALTY_STAMP_BASE}?tab=settings`, label: "ตั้งค่า", shortLabel: "ตั้งค่า" },
];

export function isLoyaltyStampModulePath(pathname: string): boolean {
  return pathname === LOYALTY_STAMP_BASE || pathname.startsWith(`${LOYALTY_STAMP_BASE}/`);
}

export function loyaltyStampPathFlags(pathname: string) {
  const onModule = isLoyaltyStampModulePath(pathname);
  return { onModule };
}

export function isLoyaltyStampNavItemActive(
  pathname: string,
  tab: string | null,
  key: LoyaltyStampNavKey,
): boolean {
  if (!isLoyaltyStampModulePath(pathname)) return false;
  if (key === "overview") return !tab || tab === "overview";
  return tab === key;
}

export function readLoyaltyStampHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(LOYALTY_STAMP_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeLoyaltyStampHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LOYALTY_STAMP_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(LOYALTY_STAMP_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
