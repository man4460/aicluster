export const ACTIVITY_LOGS_BASE = "/dashboard/admin/activity-logs";

export const ACTIVITY_LOGS_FILTER_HREF = `${ACTIVITY_LOGS_BASE}?filter=open`;
export const ACTIVITY_LOGS_SETTINGS_HREF = `${ACTIVITY_LOGS_BASE}#settings`;

export const ACTIVITY_LOGS_MODULE_DISPLAY_NAME = "ประวัติกรรม";

export const ACTIVITY_LOGS_HEADER_COLLAPSE_KEY = "mawell-activity-logs-module-header-collapsed";

export const ACTIVITY_LOGS_HEADER_COLLAPSE_EVENT = "mawell-activity-logs-header-collapse";

export type ActivityLogsNavKey = "recent" | "filter" | "settings";

export type ActivityLogsNavItem = {
  key: ActivityLogsNavKey;
  href: string;
  label: string;
  shortLabel: string;
};

export const ACTIVITY_LOGS_NAV_ITEMS: ActivityLogsNavItem[] = [
  { key: "recent", href: ACTIVITY_LOGS_BASE, label: "ประวัติล่าสุด", shortLabel: "ล่าสุด" },
  { key: "filter", href: ACTIVITY_LOGS_FILTER_HREF, label: "ตัวกรอง", shortLabel: "กรอง" },
  { key: "settings", href: ACTIVITY_LOGS_SETTINGS_HREF, label: "ตั้งค่า", shortLabel: "ตั้งค่า" },
];

export function isActivityLogsModulePath(pathname: string): boolean {
  return pathname === ACTIVITY_LOGS_BASE || pathname.startsWith(`${ACTIVITY_LOGS_BASE}`);
}

export function activityLogsPathFlags(pathname: string, search: string = "") {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isActivityLogsModulePath(pathname);
  const hasFilter = search.includes("filter=open");
  const hasSettings = search.includes("settings");
  const isRecent = onModule && !hasFilter && !hasSettings;
  const isFilter = onModule && hasFilter;
  const isSettings = onModule && hasSettings;
  return { onModule, isRecent, isFilter, isSettings };
}

export function isActivityLogsNavItemActive(pathname: string, key: ActivityLogsNavKey, search: string = ""): boolean {
  const f = activityLogsPathFlags(pathname, search);
  switch (key) {
    case "recent":
      return f.isRecent;
    case "filter":
      return f.isFilter;
    case "settings":
      return f.isSettings;
    default:
      return false;
  }
}

export function readActivityLogsHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ACTIVITY_LOGS_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeActivityLogsHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACTIVITY_LOGS_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(ACTIVITY_LOGS_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
