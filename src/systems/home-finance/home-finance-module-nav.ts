export const HOME_FINANCE_BASE = "/dashboard/home-finance";

export const HOME_FINANCE_ENTRIES_HREF = `${HOME_FINANCE_BASE}/history`;
export const HOME_FINANCE_DOCUMENTS_HREF = `${HOME_FINANCE_BASE}/documents`;
export const HOME_FINANCE_SETTINGS_HREF = `${HOME_FINANCE_BASE}/categories`;

export const HOME_FINANCE_MODULE_DISPLAY_NAME = "รายรับ–รายจ่าย";

export const HOME_FINANCE_HEADER_COLLAPSE_KEY = "mawell-home-finance-module-header-collapsed";

export const HOME_FINANCE_HEADER_COLLAPSE_EVENT = "mawell-home-finance-header-collapse";

export type HomeFinanceNavKey = "overview" | "entries" | "documents" | "settings";

export type HomeFinanceNavItem = {
  key: HomeFinanceNavKey;
  href: string;
  label: string;
  shortLabel: string;
};

export const HOME_FINANCE_NAV_ITEMS: HomeFinanceNavItem[] = [
  { key: "overview", href: HOME_FINANCE_BASE, label: "ภาพรวม", shortLabel: "ภาพรวม" },
  { key: "entries", href: HOME_FINANCE_ENTRIES_HREF, label: "บันทึก", shortLabel: "บันทึก" },
  { key: "documents", href: HOME_FINANCE_DOCUMENTS_HREF, label: "เอกสารหลักฐาน", shortLabel: "เอกสาร" },
  { key: "settings", href: HOME_FINANCE_SETTINGS_HREF, label: "ตั้งค่า", shortLabel: "ตั้งค่า" },
];

export function isHomeFinanceModulePath(pathname: string): boolean {
  return pathname === HOME_FINANCE_BASE || pathname.startsWith(`${HOME_FINANCE_BASE}/`);
}

export function homeFinancePathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isHomeFinanceModulePath(pathname);
  const isEntries = pathNorm === HOME_FINANCE_ENTRIES_HREF || pathNorm.endsWith("/history");
  const isDocuments = pathNorm === HOME_FINANCE_DOCUMENTS_HREF || pathNorm.endsWith("/documents");
  const isSettings = pathNorm === HOME_FINANCE_SETTINGS_HREF || pathNorm.endsWith("/categories");
  const isOverview = onModule && !isEntries && !isDocuments && !isSettings;
  return { onModule, isOverview, isEntries, isDocuments, isSettings };
}

export function isHomeFinanceNavItemActive(pathname: string, key: HomeFinanceNavKey): boolean {
  const f = homeFinancePathFlags(pathname);
  switch (key) {
    case "overview":
      return f.isOverview;
    case "entries":
      return f.isEntries;
    case "documents":
      return f.isDocuments;
    case "settings":
      return f.isSettings;
    default:
      return false;
  }
}

export function readHomeFinanceHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(HOME_FINANCE_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeHomeFinanceHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HOME_FINANCE_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(HOME_FINANCE_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
