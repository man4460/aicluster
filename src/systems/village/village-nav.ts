export type VillageMainMenuKey = "overview" | "housing" | "finance" | "settings";

export type VillageMainMenuItem = {
  key: VillageMainMenuKey;
  label: string;
  href: string;
};

export type VillageSubMenuItem = {
  href: string;
  label: string;
  group: VillageMainMenuKey;
};

export const VILLAGE_MODULE_DISPLAY_NAME = "จัดการหมู่บ้าน";
export const VILLAGE_MODULE_PATH_PREFIX = "/dashboard/village";
export const VILLAGE_HEADER_COLLAPSE_KEY = "mawell-village-module-header-collapsed";
export const VILLAGE_HEADER_COLLAPSE_EVENT = "mawell-village-header-collapse";

export const villageMainMenuItems: readonly VillageMainMenuItem[] = [
  { key: "overview", label: "ภาพรวม", href: "/dashboard/village" },
  { key: "housing", label: "จัดการบ้าน", href: "/dashboard/village/residents" },
  { key: "finance", label: "การเงิน", href: "/dashboard/village/costs" },
  { key: "settings", label: "ตั้งค่า", href: "/dashboard/village/settings" },
] as const;

export const villageSubMenuItems: readonly VillageSubMenuItem[] = [
  { href: "/dashboard/village/fees", label: "ค่าส่วนกลาง", group: "finance" },
  { href: "/dashboard/village/slips", label: "สลิป", group: "finance" },
  { href: "/dashboard/village/costs", label: "ต้นทุน / รายจ่าย", group: "finance" },
  { href: "/dashboard/village/reports", label: "ส่งออก", group: "settings" },
  { href: "/dashboard/village/settings", label: "ตั้งค่า", group: "settings" },
] as const;

export function isVillageModulePath(pathname: string): boolean {
  if (!pathname) return false;
  return (
    pathname === VILLAGE_MODULE_PATH_PREFIX ||
    pathname.startsWith(`${VILLAGE_MODULE_PATH_PREFIX}/`)
  );
}

export function readVillageHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(VILLAGE_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeVillageHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VILLAGE_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(VILLAGE_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}

function pathMatches(pathname: string, href: string): boolean {
  if (href === "/dashboard/village") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function villageMainKeyFromPathname(pathnameRaw: string): VillageMainMenuKey {
  const pathname = (pathnameRaw || "").replace(/\/+$/, "") || "/";
  if (pathMatches(pathname, "/dashboard/village/residents")) return "housing";
  if (
    pathMatches(pathname, "/dashboard/village/fees") ||
    pathMatches(pathname, "/dashboard/village/slips") ||
    pathMatches(pathname, "/dashboard/village/costs") ||
    pathMatches(pathname, "/dashboard/village/annual")
  ) {
    return "finance";
  }
  if (pathMatches(pathname, "/dashboard/village/settings") || pathMatches(pathname, "/dashboard/village/reports")) {
    return "settings";
  }
  return "overview";
}

export function villagePathActive(pathnameRaw: string, href: string): boolean {
  const pathname = (pathnameRaw || "").replace(/\/+$/, "") || "/";
  return pathMatches(pathname, href);
}
