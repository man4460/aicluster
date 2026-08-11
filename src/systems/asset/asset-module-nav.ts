export const ASSET_BASE = "/dashboard/asset";

export const ASSET_SETTINGS_HREF = `${ASSET_BASE}/settings`;

export const ASSET_MODULE_DISPLAY_NAME = "บริหารทรัพย์สิน";

export const ASSET_HEADER_COLLAPSE_KEY = "mawell-asset-module-header-collapsed";

export const ASSET_HEADER_COLLAPSE_EVENT = "mawell-asset-header-collapse";

export type AssetNavKey = "dashboard" | "assets" | "operations" | "master" | "reports";

export type AssetNavItem = {
  key: AssetNavKey;
  href: string;
  label: string;
  shortLabel: string;
  includes?: readonly string[];
};

export const ASSET_NAV_ITEMS: AssetNavItem[] = [
  { key: "dashboard", href: ASSET_BASE, label: "แดชบอร์ด", shortLabel: "แดชบอร์ด" },
  { key: "assets", href: `${ASSET_BASE}/assets`, label: "ทรัพย์สิน", shortLabel: "ทรัพย์สิน" },
  {
    key: "operations",
    href: `${ASSET_BASE}/transactions`,
    label: "ดำเนินการ",
    shortLabel: "ดำเนินการ",
    includes: [
      `${ASSET_BASE}/maintenance`,
      `${ASSET_BASE}/disposals`,
      `${ASSET_BASE}/audits`,
    ] as const,
  },
  {
    key: "master",
    href: `${ASSET_BASE}/master`,
    label: "ข้อมูลหลัก",
    shortLabel: "ข้อมูลหลัก",
    includes: [`${ASSET_BASE}/settings`] as const,
  },
  { key: "reports", href: `${ASSET_BASE}/reports`, label: "รายงาน", shortLabel: "รายงาน" },
] as const;

export function isAssetModulePath(pathname: string): boolean {
  return pathname === ASSET_BASE || pathname.startsWith(`${ASSET_BASE}/`);
}

export function assetPathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isAssetModulePath(pathname);

  const isDashboard = pathNorm === ASSET_BASE;

  const isAssets =
    pathNorm === `${ASSET_BASE}/assets` || pathNorm.startsWith(`${ASSET_BASE}/assets/`);

  const operationsPaths = [
    `${ASSET_BASE}/transactions`,
    `${ASSET_BASE}/maintenance`,
    `${ASSET_BASE}/disposals`,
    `${ASSET_BASE}/audits`,
  ];
  const isOperations = operationsPaths.some(
    (p) => pathNorm === p || pathNorm.startsWith(`${p}/`),
  );

  const masterPaths = [
    `${ASSET_BASE}/master`,
    `${ASSET_BASE}/master/departments`,
    `${ASSET_BASE}/master/locations`,
    `${ASSET_BASE}/master/suppliers`,
    `${ASSET_BASE}/settings`,
  ];
  const isMaster = masterPaths.some(
    (p) => pathNorm === p || pathNorm.startsWith(`${p}/`),
  );

  const isReports =
    pathNorm === `${ASSET_BASE}/reports` || pathNorm.startsWith(`${ASSET_BASE}/reports/`);

  return { onModule, isDashboard, isAssets, isOperations, isMaster, isReports };
}

export function isAssetNavItemActive(pathname: string, key: AssetNavKey): boolean {
  const f = assetPathFlags(pathname);
  switch (key) {
    case "dashboard":
      return f.isDashboard;
    case "assets":
      return f.isAssets;
    case "operations":
      return f.isOperations;
    case "master":
      return f.isMaster;
    case "reports":
      return f.isReports;
    default:
      return false;
  }
}

export function readAssetHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ASSET_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeAssetHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ASSET_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(ASSET_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
