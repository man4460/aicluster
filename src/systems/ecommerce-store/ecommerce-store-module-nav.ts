export const ECOMMERCE_STORE_BASE = "/dashboard/ecommerce-store";
export const ECOMMERCE_STORE_FINANCE_HREF = `${ECOMMERCE_STORE_BASE}/finance`;
export const ECOMMERCE_STORE_MANAGE_HREF = `${ECOMMERCE_STORE_BASE}/manage`;
export const ECOMMERCE_STORE_SETTINGS_HREF = `${ECOMMERCE_STORE_BASE}/settings`;
export const ECOMMERCE_STORE_SETTINGS_PORTAL_HREF = `${ECOMMERCE_STORE_SETTINGS_HREF}?tab=portal`;
export const ECOMMERCE_STORE_SETTINGS_LINK_HREF = `${ECOMMERCE_STORE_SETTINGS_HREF}?tab=link`;
export const ECOMMERCE_STORE_MODULE_DISPLAY_NAME = "ร้านออนไลน์";

/**
 * พื้นฐาน · การเงิน · ตั้งค่าเว็บไซต์ (เฉพาะตั้งค่า) · ลิงก์ (เว็บไซต์+พนักงาน — บล็อกสายรายวันทีเดียว)
 * `staff` เดิม map → `link`
 */
export type EcommerceStoreSettingsTab = "basic" | "finance" | "portal" | "link";

/** แท็บย่อยแดชบอร์ด: ภาพรวม · ออเดอร์ออนไลน์ · ขายหน้าร้าน */
export type EcommerceStoreDashboardTabKey = "overview" | "orders" | "pos";

/** แท็บย่อยการจัดการ: สินค้า (รวมสต๊อก) · CRM */
export type EcommerceStoreManageTabKey = "products" | "crm";

export const ECOMMERCE_STORE_DASHBOARD_TAB_KEYS = new Set<string>(["overview", "orders", "pos"]);
export const ECOMMERCE_STORE_MANAGE_TAB_KEYS = new Set<string>(["products", "crm", "customers", "stock"]);

export const ECOMMERCE_STORE_DASHBOARD_TAB_ITEMS: {
  key: EcommerceStoreDashboardTabKey;
  label: string;
  shortLabel: string;
}[] = [
  { key: "overview", label: "ภาพรวม", shortLabel: "ภาพรวม" },
  { key: "orders", label: "ออเดอร์ออนไลน์", shortLabel: "ออนไลน์" },
  { key: "pos", label: "ขายหน้าร้าน", shortLabel: "หน้าร้าน" },
];

export const ECOMMERCE_STORE_MANAGE_TAB_ITEMS: {
  key: EcommerceStoreManageTabKey;
  label: string;
  shortLabel: string;
}[] = [
  { key: "products", label: "สินค้า", shortLabel: "สินค้า" },
  { key: "crm", label: "CRM", shortLabel: "ลูกค้า" },
];

export function parseEcommerceStoreDashboardTab(
  raw: string | null | undefined,
): EcommerceStoreDashboardTabKey {
  if (raw && ECOMMERCE_STORE_DASHBOARD_TAB_KEYS.has(raw)) {
    return raw as EcommerceStoreDashboardTabKey;
  }
  return "overview";
}

export function parseEcommerceStoreManageTab(
  raw: string | null | undefined,
): EcommerceStoreManageTabKey {
  if (raw === "crm" || raw === "customers") return "crm";
  /** `stock` เดิมรวมเข้าสินค้าแล้ว */
  if (raw === "stock" || raw === "products") return "products";
  return "products";
}

export function ecommerceStoreManageHref(tab?: EcommerceStoreManageTabKey): string {
  if (!tab || tab === "products") return ECOMMERCE_STORE_MANAGE_HREF;
  return `${ECOMMERCE_STORE_MANAGE_HREF}?tab=${tab}`;
}

export const ECOMMERCE_STORE_HEADER_COLLAPSE_KEY = "mawell-ecommerce-store-module-header-collapsed";
export const ECOMMERCE_STORE_HEADER_COLLAPSE_EVENT = "mawell-ecommerce-store-header-collapse";

export type EcommerceStoreNavKey = "dashboard" | "finance" | "manage" | "settings";

export type EcommerceStoreNavItem = {
  key: EcommerceStoreNavKey;
  href: string;
  label: string;
  shortLabel: string;
};

export const ECOMMERCE_STORE_NAV_ITEMS: EcommerceStoreNavItem[] = [
  { key: "dashboard", href: ECOMMERCE_STORE_BASE, label: "แดชบอร์ด", shortLabel: "แดช" },
  { key: "finance", href: ECOMMERCE_STORE_FINANCE_HREF, label: "การเงิน", shortLabel: "เงิน" },
  { key: "manage", href: ECOMMERCE_STORE_MANAGE_HREF, label: "การจัดการ", shortLabel: "จัดการ" },
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
  const isManage =
    pathNorm === ECOMMERCE_STORE_MANAGE_HREF ||
    pathNorm.startsWith(`${ECOMMERCE_STORE_MANAGE_HREF}/`) ||
    isProducts ||
    isCrm;
  const isSettings =
    pathNorm === ECOMMERCE_STORE_SETTINGS_HREF || pathNorm.endsWith("/settings");
  /** ออเดอร์ (`/orders`) นับเป็นแดชบอร์ด — เป็นเมนูย่อยไม่ใช่เมนูหลัก */
  const isDashboard = onModule && !isManage && !isSettings && !isFinance;
  return { onModule, isDashboard, isProducts, isOrders, isFinance, isCrm, isManage, isSettings };
}

export function isEcommerceStoreNavItemActive(pathname: string, key: EcommerceStoreNavKey): boolean {
  const f = ecommerceStorePathFlags(pathname);
  switch (key) {
    case "dashboard":
      return f.isDashboard;
    case "finance":
      return f.isFinance;
    case "manage":
      return f.isManage;
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
