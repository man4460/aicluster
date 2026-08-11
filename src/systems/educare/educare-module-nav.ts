export const EDUCARE_BASE = "/dashboard/educare";
export const EDUCARE_SETTINGS_HREF = `${EDUCARE_BASE}/settings`;
export const EDUCARE_MODULE_DISPLAY_NAME = "EduCare เช็คนักเรียน";

export const EDUCARE_HEADER_COLLAPSE_KEY = "mawell-educare-module-header-collapsed";
export const EDUCARE_HEADER_COLLAPSE_EVENT = "mawell-educare-header-collapse";

export type EducareNavKey = "dashboard" | "check" | "classrooms" | "reports";

export type EducareNavItem = {
  key: EducareNavKey;
  href: string;
  label: string;
  shortLabel: string;
  includes?: readonly string[];
};

export const EDUCARE_NAV_ITEMS: EducareNavItem[] = [
  { key: "dashboard", href: EDUCARE_BASE, label: "แดชบอร์ด", shortLabel: "ภาพรวม" },
  { key: "check", href: `${EDUCARE_BASE}/check`, label: "เช็คประจำวัน", shortLabel: "เช็ค" },
  {
    key: "classrooms",
    href: `${EDUCARE_BASE}/students`,
    label: "จัดการห้องเรียน",
    shortLabel: "จัดการ",
    includes: [`${EDUCARE_BASE}/classrooms`, `${EDUCARE_BASE}/settings`] as const,
  },
  { key: "reports", href: `${EDUCARE_BASE}/reports`, label: "รายงาน", shortLabel: "รายงาน" },
];

export function isEducareModulePath(pathname: string): boolean {
  return pathname === EDUCARE_BASE || pathname.startsWith(`${EDUCARE_BASE}/`);
}

export function educarePathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isEducareModulePath(pathname);
  const isCheck =
    pathNorm === `${EDUCARE_BASE}/check` || pathNorm.endsWith("/check");
  const isClassrooms =
    pathNorm.startsWith(`${EDUCARE_BASE}/students`) ||
    pathNorm.startsWith(`${EDUCARE_BASE}/classrooms`) ||
    pathNorm === EDUCARE_SETTINGS_HREF ||
    pathNorm.endsWith("/settings");
  const isReports =
    pathNorm === `${EDUCARE_BASE}/reports` || pathNorm.endsWith("/reports");
  const isDashboard = onModule && !isCheck && !isClassrooms && !isReports;
  return { onModule, isDashboard, isCheck, isClassrooms, isReports };
}

export function isEducareNavItemActive(pathname: string, key: EducareNavKey): boolean {
  const f = educarePathFlags(pathname);
  switch (key) {
    case "dashboard":
      return f.isDashboard;
    case "check":
      return f.isCheck;
    case "classrooms":
      return f.isClassrooms;
    case "reports":
      return f.isReports;
    default:
      return false;
  }
}

export function readEducareHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(EDUCARE_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeEducareHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(EDUCARE_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(EDUCARE_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
