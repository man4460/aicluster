export const SCHOOL_BANK_BASE = "/dashboard/school-bank";

export const SCHOOL_BANK_SETTINGS_HREF = `${SCHOOL_BANK_BASE}/settings`;

export const SCHOOL_BANK_MODULE_DISPLAY_NAME = "ธนาคารโรงเรียน";

export const SCHOOL_BANK_HEADER_COLLAPSE_KEY = "mawell-school-bank-module-header-collapsed";

export const SCHOOL_BANK_HEADER_COLLAPSE_EVENT = "mawell-school-bank-header-collapse";

export type SchoolBankNavKey = "dashboard" | "members" | "settings";

export type SchoolBankNavItem = {
  key: SchoolBankNavKey;
  href: string;
  label: string;
  shortLabel: string;
};

export const SCHOOL_BANK_NAV_ITEMS: SchoolBankNavItem[] = [
  { key: "dashboard", href: SCHOOL_BANK_BASE, label: "ภาพรวม", shortLabel: "ภาพรวม" },
  { key: "members", href: `${SCHOOL_BANK_BASE}/members`, label: "บัญชี", shortLabel: "บัญชี" },
  { key: "settings", href: SCHOOL_BANK_SETTINGS_HREF, label: "ตั้งค่า", shortLabel: "ตั้งค่า" },
];

export function isSchoolBankModulePath(pathname: string): boolean {
  return pathname === SCHOOL_BANK_BASE || pathname.startsWith(`${SCHOOL_BANK_BASE}/`);
}

export function schoolBankPathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isSchoolBankModulePath(pathname);
  const isMembers = pathNorm.endsWith(`${SCHOOL_BANK_BASE}/members`) || pathNorm.endsWith("/members");
  const isSettings = pathNorm === SCHOOL_BANK_SETTINGS_HREF || pathNorm.endsWith("/settings");
  const isDashboard = onModule && !isMembers && !isSettings;
  return { onModule, isDashboard, isMembers, isSettings };
}

export function isSchoolBankNavItemActive(pathname: string, key: SchoolBankNavKey): boolean {
  const f = schoolBankPathFlags(pathname);
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

export function readSchoolBankHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SCHOOL_BANK_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeSchoolBankHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SCHOOL_BANK_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(SCHOOL_BANK_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
