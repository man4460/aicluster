export const HOME_FINANCE_BASE = "/dashboard/home-finance";

export const HOME_FINANCE_ENTRIES_HREF = `${HOME_FINANCE_BASE}/history`;
export const HOME_FINANCE_DOCUMENTS_HREF = `${HOME_FINANCE_BASE}/documents`;
export const HOME_FINANCE_SETTINGS_HREF = `${HOME_FINANCE_BASE}/categories`;
export const HOME_FINANCE_PASSWORDS_HREF = `${HOME_FINANCE_BASE}/passwords`;
export const HOME_FINANCE_NOTES_HREF = `${HOME_FINANCE_BASE}/notes`;
export const HOME_FINANCE_PROMPTS_HREF = `${HOME_FINANCE_BASE}/prompts`;

export const HOME_FINANCE_MODULE_DISPLAY_NAME = "บันทึกส่วนตัว";

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

/** เมนูย่อยใต้เมนูหลัก «ภาพรวม» */
export type HomeFinanceOverviewSubKey = "overview" | "passwords" | "notes" | "prompts";

export type HomeFinanceOverviewSubItem = {
  key: HomeFinanceOverviewSubKey;
  href: string;
  label: string;
  shortLabel: string;
  description: string;
};

export const HOME_FINANCE_OVERVIEW_SUBNAV_ITEMS: HomeFinanceOverviewSubItem[] = [
  {
    key: "overview",
    href: HOME_FINANCE_BASE,
    label: "ภาพรวม",
    shortLabel: "ภาพรวม",
    description: "สรุปรายรับ–รายจ่ายเดือนนี้",
  },
  {
    key: "passwords",
    href: HOME_FINANCE_PASSWORDS_HREF,
    label: "รหัสผ่าน",
    shortLabel: "รหัสผ่าน",
    description: "เก็บบัญชีและรหัสผ่านส่วนตัว",
  },
  {
    key: "notes",
    href: HOME_FINANCE_NOTES_HREF,
    label: "โน้ต",
    shortLabel: "โน้ต",
    description: "จดบันทึกสั้น ๆ คู่กับการเงิน",
  },
  {
    key: "prompts",
    href: HOME_FINANCE_PROMPTS_HREF,
    label: "Prompt AI",
    shortLabel: "Prompt",
    description: "บันทึกหัวข้อ · รายละเอียด prompt · หมวดหมู่",
  },
];

/** @deprecated ใช้ HomeFinanceOverviewSubKey */
export type HomeFinancePersonalSubKey = Exclude<HomeFinanceOverviewSubKey, "overview">;

export function isHomeFinanceModulePath(pathname: string): boolean {
  return pathname === HOME_FINANCE_BASE || pathname.startsWith(`${HOME_FINANCE_BASE}/`);
}

export function homeFinancePathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isHomeFinanceModulePath(pathname);
  const isEntries = pathNorm === HOME_FINANCE_ENTRIES_HREF || pathNorm.endsWith("/history");
  const isDocuments = pathNorm === HOME_FINANCE_DOCUMENTS_HREF || pathNorm.endsWith("/documents");
  const isSettings = pathNorm === HOME_FINANCE_SETTINGS_HREF || pathNorm.endsWith("/categories");
  const isPasswords = pathNorm === HOME_FINANCE_PASSWORDS_HREF || pathNorm.endsWith("/passwords");
  const isNotes = pathNorm === HOME_FINANCE_NOTES_HREF || pathNorm.endsWith("/notes");
  const isPrompts = pathNorm === HOME_FINANCE_PROMPTS_HREF || pathNorm.endsWith("/prompts");
  const isOverviewHome = pathNorm === HOME_FINANCE_BASE;
  /** เมนูหลักภาพรวม — รวมแท็บย่อยรหัสผ่าน/โน้ต/Prompt AI */
  const isOverviewSection = isOverviewHome || isPasswords || isNotes || isPrompts;
  return {
    onModule,
    isOverview: isOverviewHome,
    isOverviewSection,
    isEntries,
    isDocuments,
    isSettings,
    isPasswords,
    isNotes,
    isPrompts,
  };
}

export function isHomeFinanceNavItemActive(pathname: string, key: HomeFinanceNavKey): boolean {
  const f = homeFinancePathFlags(pathname);
  switch (key) {
    case "overview":
      return f.isOverviewSection;
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

export function homeFinanceOverviewSubKey(pathname: string): HomeFinanceOverviewSubKey {
  const f = homeFinancePathFlags(pathname);
  if (f.isPasswords) return "passwords";
  if (f.isNotes) return "notes";
  if (f.isPrompts) return "prompts";
  return "overview";
}

export function isHomeFinanceOverviewSubActive(pathname: string, key: HomeFinanceOverviewSubKey): boolean {
  return homeFinanceOverviewSubKey(pathname) === key;
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
