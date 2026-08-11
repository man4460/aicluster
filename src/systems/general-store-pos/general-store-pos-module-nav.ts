export const GENERAL_STORE_POS_BASE = "/dashboard/general-store-pos";

export const GENERAL_STORE_POS_SALES_HREF = `${GENERAL_STORE_POS_BASE}/sales`;

export const GENERAL_STORE_POS_SETTINGS_HREF = `${GENERAL_STORE_POS_BASE}/settings`;

export const GENERAL_STORE_POS_MODULE_DISPLAY_NAME = "POS ร้านทั่วไป";

export const GENERAL_STORE_POS_HEADER_COLLAPSE_KEY = "mawell-general-store-pos-module-header-collapsed";

export const GENERAL_STORE_POS_HEADER_COLLAPSE_EVENT = "mawell-general-store-pos-header-collapse";

export type GeneralStorePosNavKey = "products" | "sales" | "settings";

export type GeneralStorePosNavItem = {
  key: GeneralStorePosNavKey;
  href: string;
  label: string;
  shortLabel: string;
};

export const GENERAL_STORE_POS_NAV_ITEMS: GeneralStorePosNavItem[] = [
  { key: "products", href: GENERAL_STORE_POS_BASE, label: "สินค้า", shortLabel: "สินค้า" },
  { key: "sales", href: GENERAL_STORE_POS_SALES_HREF, label: "ยอดขาย", shortLabel: "ยอดขาย" },
  { key: "settings", href: GENERAL_STORE_POS_SETTINGS_HREF, label: "ตั้งค่า", shortLabel: "ตั้งค่า" },
];

export function isGeneralStorePosModulePath(pathname: string): boolean {
  return pathname === GENERAL_STORE_POS_BASE || pathname.startsWith(`${GENERAL_STORE_POS_BASE}/`);
}

export function generalStorePosPathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isGeneralStorePosModulePath(pathname);
  const isSales = pathNorm.endsWith(GENERAL_STORE_POS_SALES_HREF) || pathNorm.endsWith("/sales");
  const isSettings = pathNorm === GENERAL_STORE_POS_SETTINGS_HREF || pathNorm.endsWith("/settings");
  const isProducts = onModule && !isSales && !isSettings;
  return { onModule, isProducts, isSales, isSettings };
}

export function isGeneralStorePosNavItemActive(pathname: string, key: GeneralStorePosNavKey): boolean {
  const f = generalStorePosPathFlags(pathname);
  switch (key) {
    case "products":
      return f.isProducts;
    case "sales":
      return f.isSales;
    case "settings":
      return f.isSettings;
    default:
      return false;
  }
}

export function readGeneralStorePosHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(GENERAL_STORE_POS_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeGeneralStorePosHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(GENERAL_STORE_POS_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(GENERAL_STORE_POS_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
