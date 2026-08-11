export const COMMUNITY_COOP_BASE = "/dashboard/community-coop";

export const COMMUNITY_COOP_SETTINGS_HREF = `${COMMUNITY_COOP_BASE}/settings`;

export const COMMUNITY_COOP_MODULE_DISPLAY_NAME = "สหกรณ์ชุมชน";

export const COMMUNITY_COOP_HEADER_COLLAPSE_KEY = "mawell-community-coop-module-header-collapsed";

export const COMMUNITY_COOP_HEADER_COLLAPSE_EVENT = "mawell-community-coop-header-collapse";

export type CommunityCoopNavKey = "dashboard" | "members" | "settings";

export type CommunityCoopNavItem = {
  key: CommunityCoopNavKey;
  href: string;
  label: string;
  shortLabel: string;
};

export const COMMUNITY_COOP_NAV_ITEMS: CommunityCoopNavItem[] = [
  { key: "dashboard", href: COMMUNITY_COOP_BASE, label: "ภาพรวม", shortLabel: "ภาพรวม" },
  { key: "members", href: `${COMMUNITY_COOP_BASE}/members`, label: "สมาชิก", shortLabel: "สมาชิก" },
  { key: "settings", href: COMMUNITY_COOP_SETTINGS_HREF, label: "ตั้งค่า", shortLabel: "ตั้งค่า" },
];

export function isCommunityCoopModulePath(pathname: string): boolean {
  return pathname === COMMUNITY_COOP_BASE || pathname.startsWith(`${COMMUNITY_COOP_BASE}/`);
}

export function communityCoopPathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isCommunityCoopModulePath(pathname);
  const isMembers = pathNorm.endsWith(`${COMMUNITY_COOP_BASE}/members`) || pathNorm.endsWith("/members");
  const isSettings = pathNorm === COMMUNITY_COOP_SETTINGS_HREF || pathNorm.endsWith("/settings");
  const isDashboard = onModule && !isMembers && !isSettings;
  return { onModule, isDashboard, isMembers, isSettings };
}

export function isCommunityCoopNavItemActive(pathname: string, key: CommunityCoopNavKey): boolean {
  const f = communityCoopPathFlags(pathname);
  switch (key) {
    case "dashboard":
      return f.isDashboard;
    case "members":
      return f.isMembers;
    case "settings":
      return f.isSettings;
    default:
      return false;
  }
}

export function readCommunityCoopHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COMMUNITY_COOP_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeCommunityCoopHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(COMMUNITY_COOP_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(COMMUNITY_COOP_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
