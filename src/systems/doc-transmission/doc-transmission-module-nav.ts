export const DOC_TRANSMISSION_BASE = "/dashboard/doc-transmission";
export const DOC_TRANSMISSION_SETTINGS_HREF = `${DOC_TRANSMISSION_BASE}/settings`;
export const DOC_TRANSMISSION_MODULE_DISPLAY_NAME = "สารบรรณดิจิทัล";

export const DOC_TRANSMISSION_HEADER_COLLAPSE_KEY = "mawell-doc-transmission-module-header-collapsed";
export const DOC_TRANSMISSION_HEADER_COLLAPSE_EVENT = "mawell-doc-transmission-header-collapse";

export type DocTransmissionNavKey = "dashboard" | "records" | "master" | "reports";

export type DocTransmissionNavItem = {
  key: DocTransmissionNavKey;
  href: string;
  label: string;
  shortLabel: string;
  includes?: readonly string[];
};

export const DOC_TRANSMISSION_NAV_ITEMS: DocTransmissionNavItem[] = [
  { key: "dashboard", href: DOC_TRANSMISSION_BASE, label: "แดชบอร์ด", shortLabel: "ภาพรวม" },
  {
    key: "records",
    href: `${DOC_TRANSMISSION_BASE}/records/orders`,
    label: "เอกสาร",
    shortLabel: "เอกสาร",
    includes: [`${DOC_TRANSMISSION_BASE}/records`] as const,
  },
  {
    key: "master",
    href: `${DOC_TRANSMISSION_BASE}/master`,
    label: "ข้อมูลหลัก",
    shortLabel: "ข้อมูลหลัก",
    includes: [`${DOC_TRANSMISSION_BASE}/settings`] as const,
  },
  { key: "reports", href: `${DOC_TRANSMISSION_BASE}/reports`, label: "รายงาน", shortLabel: "รายงาน" },
];

export function isDocTransmissionModulePath(pathname: string): boolean {
  return pathname === DOC_TRANSMISSION_BASE || pathname.startsWith(`${DOC_TRANSMISSION_BASE}/`);
}

export function docTransmissionPathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isDocTransmissionModulePath(pathname);
  const isRecords = Boolean(
    pathNorm.startsWith(`${DOC_TRANSMISSION_BASE}/records`) ||
      DOC_TRANSMISSION_NAV_ITEMS.find((i) => i.key === "records")?.includes?.some(
        (p) => pathNorm.startsWith(p) || pathNorm.endsWith(p),
      ),
  );
  const isMaster =
    pathNorm.startsWith(`${DOC_TRANSMISSION_BASE}/master`) ||
    pathNorm === DOC_TRANSMISSION_SETTINGS_HREF ||
    pathNorm.endsWith("/settings");
  const isReports =
    pathNorm === `${DOC_TRANSMISSION_BASE}/reports` || pathNorm.endsWith("/reports");
  const isDashboard = onModule && !isRecords && !isMaster && !isReports;
  return { onModule, isDashboard, isRecords, isMaster, isReports };
}

export function isDocTransmissionNavItemActive(pathname: string, key: DocTransmissionNavKey): boolean {
  const f = docTransmissionPathFlags(pathname);
  switch (key) {
    case "dashboard":
      return f.isDashboard;
    case "records":
      return f.isRecords;
    case "master":
      return f.isMaster;
    case "reports":
      return f.isReports;
    default:
      return false;
  }
}

export function readDocTransmissionHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(DOC_TRANSMISSION_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeDocTransmissionHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DOC_TRANSMISSION_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(DOC_TRANSMISSION_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
