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
