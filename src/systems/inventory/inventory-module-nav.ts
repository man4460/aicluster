export const INVENTORY_MODULE_PATH_PREFIX = "/dashboard/inventory";

export const INVENTORY_MODULE_DISPLAY_NAME = "คลัง · สต๊อกสินค้า";

export const INVENTORY_HEADER_COLLAPSE_KEY = "mawell-inventory-module-header-collapsed";

export const INVENTORY_HEADER_COLLAPSE_EVENT = "mawell-inventory-header-collapse";

export type InventoryNavKey = "overview" | "items" | "warehouses" | "movements";

export type InventoryNavItem = {
  key: InventoryNavKey;
  href: string;
  label: string;
};

export const INVENTORY_NAV_ITEMS: readonly InventoryNavItem[] = [
  { key: "overview", href: "/dashboard/inventory", label: "ภาพรวม" },
  { key: "items", href: "/dashboard/inventory/items", label: "สินค้า" },
  { key: "warehouses", href: "/dashboard/inventory/warehouses", label: "คลัง" },
  { key: "movements", href: "/dashboard/inventory/movements", label: "เคลื่อนไหว" },
] as const;

export function isInventoryModulePath(pathname: string): boolean {
  if (!pathname) return false;
  return (
    pathname === INVENTORY_MODULE_PATH_PREFIX ||
    pathname.startsWith(`${INVENTORY_MODULE_PATH_PREFIX}/`)
  );
}

export function inventoryNavActive(pathname: string, href: string): boolean {
  if (href === INVENTORY_MODULE_PATH_PREFIX) {
    return pathname === INVENTORY_MODULE_PATH_PREFIX;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function readInventoryHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(INVENTORY_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeInventoryHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(INVENTORY_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(INVENTORY_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
