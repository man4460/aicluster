/** เมนูหัวโมดูล POS ร้านเครื่องดื่ม — ใช้ทั้งการ์ดหัวและแถบ header หลักเมื่อย่อ */

export const DRINK_POS_BASE = "/dashboard/drink-pos";
export const DRINK_POS_ORDER_HREF = `${DRINK_POS_BASE}/order`;
export const DRINK_POS_ORDERS_HREF = `${DRINK_POS_BASE}/orders`;
export const DRINK_POS_SETTINGS_HREF = `${DRINK_POS_BASE}/settings`;

/** ลิงก์ QR / แผนก — อยู่แท็บตั้งค่า */
export const DRINK_POS_SETTINGS_LINK_HREF = `${DRINK_POS_SETTINGS_HREF}?tab=link`;

/** ลิงก์เก่า — redirect ไปแท็บลิงก์ในตั้งค่า */
export const DRINK_POS_MEMBERS_HREF = DRINK_POS_SETTINGS_LINK_HREF;

export const DRINK_POS_HEADER_COLLAPSE_KEY = "mawell-drink-pos-module-header-collapsed";
export const DRINK_POS_HEADER_COLLAPSE_EVENT = "mawell-drink-pos-header-collapse";

export type DrinkPosNavKey = "order" | "orders" | "products" | "finance" | "settings";

export type DrinkPosSettingsTab = "basic" | "finance" | "portal" | "hours" | "loyalty" | "link";

export type DrinkPosNavItem = {
  key: DrinkPosNavKey;
  href: string;
  label: string;
};

/** เมนูหลัก — ลิงก์ QR อยู่แท็บตั้งค่า */
export const DRINK_POS_NAV_ITEMS: DrinkPosNavItem[] = [
  { key: "order", href: DRINK_POS_ORDER_HREF, label: "ออร์เดอร์" },
  { key: "orders", href: DRINK_POS_ORDERS_HREF, label: "คิวออเดอร์" },
  { key: "products", href: DRINK_POS_BASE, label: "สินค้า" },
  { key: "finance", href: `${DRINK_POS_BASE}/finance`, label: "การเงิน" },
  { key: "settings", href: DRINK_POS_SETTINGS_HREF, label: "ตั้งค่าร้าน" },
];

export function isDrinkPosModulePath(pathname: string): boolean {
  return pathname === DRINK_POS_BASE || pathname.startsWith(`${DRINK_POS_BASE}/`);
}

export function drinkPosPathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const isOrder = pathNorm === DRINK_POS_ORDER_HREF || pathNorm.endsWith("/order");
  const isOrdersBoard = pathNorm === DRINK_POS_ORDERS_HREF || pathNorm.endsWith("/orders");
  const isFinance = pathNorm.endsWith("/finance") || pathNorm.endsWith("/sales");
  const isSettings = pathNorm.endsWith("/settings");
  const onModule = isDrinkPosModulePath(pathname);
  const isProducts = onModule && !isOrder && !isOrdersBoard && !isFinance && !isSettings;
  return { isOrder, isOrdersBoard, isFinance, isSettings, isProducts, onModule };
}

export function isDrinkPosNavItemActive(pathname: string, key: DrinkPosNavKey): boolean {
  const f = drinkPosPathFlags(pathname);
  switch (key) {
    case "order":
      return f.isOrder;
    case "orders":
      return f.isOrdersBoard;
    case "products":
      return f.isProducts;
    case "finance":
      return f.isFinance;
    case "settings":
      return f.isSettings;
    default:
      return false;
  }
}

export function readDrinkPosHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(DRINK_POS_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeDrinkPosHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DRINK_POS_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(DRINK_POS_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
