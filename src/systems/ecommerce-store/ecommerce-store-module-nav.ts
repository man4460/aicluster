export const ECOMMERCE_STORE_BASE = "/dashboard/ecommerce-store";
export const ECOMMERCE_STORE_FINANCE_HREF = `${ECOMMERCE_STORE_BASE}/finance`;
export const ECOMMERCE_STORE_SETTINGS_HREF = `${ECOMMERCE_STORE_BASE}/settings`;
export const ECOMMERCE_STORE_SETTINGS_PORTAL_HREF = `${ECOMMERCE_STORE_SETTINGS_HREF}?tab=portal`;
export const ECOMMERCE_STORE_MODULE_DISPLAY_NAME = "ร้านออนไลน์";

export type EcommerceStoreSettingsTab = "basic" | "finance" | "portal";

/** แท็บย่อยแดชบอร์ด: ภาพรวม · ออเดอร์ */
export type EcommerceStoreDashboardTabKey = "overview" | "orders";

export const ECOMMERCE_STORE_DASHBOARD_TAB_KEYS = new Set<string>(["overview", "orders"]);

export const ECOMMERCE_STORE_DASHBOARD_TAB_ITEMS: {
  key: EcommerceStoreDashboardTabKey;
  label: string;
}[] = [
  { key: "overview", label: "ภาพรวม" },
  { key: "orders", label: "ออเดอร์" },
];

export function parseEcommerceStoreDashboardTab(
  raw: string | null | undefined,
): EcommerceStoreDashboardTabKey {
  if (raw && ECOMMERCE_STORE_DASHBOARD_TAB_KEYS.has(raw)) {
    return raw as EcommerceStoreDashboardTabKey;
  }
  return "overview";
}

export const ECOMMERCE_STORE_HEADER_COLLAPSE_KEY = "mawell-ecommerce-store-module-header-collapsed";
export const ECOMMERCE_STORE_HEADER_COLLAPSE_EVENT = "mawell-ecommerce-store-header-collapse";

export type EcommerceStoreNavKey = "dashboard" | "finance" | "products" | "crm" | "settings";

export type EcommerceStoreNavItem = {
  key: EcommerceStoreNavKey;
  href: string;
  label: string;
  shortLabel: string;
};

export const ECOMMERCE_STORE_NAV_ITEMS: EcommerceStoreNavItem[] = [
  { key: "dashboard", href: ECOMMERCE_STORE_BASE, label: "แดชบอร์ด", shortLabel: "แดช" },
  { key: "finance", href: ECOMMERCE_STORE_FINANCE_HREF, label: "การเงิน", shortLabel: "เงิน" },
  { key: "products", href: `${ECOMMERCE_STORE_BASE}/products`, label: "สินค้า", shortLabel: "สินค้า" },
  { key: "crm", href: `${ECOMMERCE_STORE_BASE}/customers`, label: "CRM", shortLabel: "ลูกค้า" },
  { key: "settings", href: ECOMMERCE_STORE_SETTINGS_HREF, label: "ตั้งค่า", shortLabel: "ตั้งค่า" },
];

export function isEcommerceStoreModulePath(pathname: string): boolean {
  return pathname === ECOMMERCE_STORE_BASE || pathname.startsWith(`${ECOMMERCE_STORE_BASE}/`);
}

export function ecommerceStorePathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isEcommerceStoreModulePath(pathname);
  const isProducts =
    pathNorm.startsWith(`${ECOMMERCE_STORE_BASE}/products`) || pathNorm.endsWith("/products");
  const isOrders =
    pathNorm.startsWith(`${ECOMMERCE_STORE_BASE}/orders`) || pathNorm.endsWith("/orders");
  const isFinance =
    pathNorm.startsWith(`${ECOMMERCE_STORE_BASE}/finance`) || pathNorm.endsWith("/finance");
  const isCrm =
    pathNorm.startsWith(`${ECOMMERCE_STORE_BASE}/customers`) || pathNorm.endsWith("/customers");
  const isSettings =
    pathNorm === ECOMMERCE_STORE_SETTINGS_HREF || pathNorm.endsWith("/settings");
  /** ออเดอร์ (`/orders`) นับเป็นแดชบอร์ด — เป็นเมนูย่อยไม่ใช่เมนูหลัก */
  const isDashboard = onModule && !isProducts && !isCrm && !isSettings && !isFinance;
  return { onModule, isDashboard, isProducts, isOrders, isFinance, isCrm, isSettings };
}

export function isEcommerceStoreNavItemActive(pathname: string, key: EcommerceStoreNavKey): boolean {
  const f = ecommerceStorePathFlags(pathname);
  switch (key) {
    case "dashboard":
      return f.isDashboard;
    case "finance":
      return f.isFinance;
    case "products":
      return f.isProducts;
    case "crm":
      return f.isCrm;
    case "settings":
      return f.isSettings;
    default:
      return false;
  }
}

export function readEcommerceStoreHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ECOMMERCE_STORE_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeEcommerceStoreHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ECOMMERCE_STORE_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(ECOMMERCE_STORE_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
