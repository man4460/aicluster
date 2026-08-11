export const ATTENDANCE_BASE = "/dashboard/attendance";

export const ATTENDANCE_SETTINGS_HREF = `${ATTENDANCE_BASE}/settings`;

export const ATTENDANCE_MODULE_DISPLAY_NAME = "เช็คอินอัจฉริยะ";

export const ATTENDANCE_HEADER_COLLAPSE_KEY = "mawell-attendance-module-header-collapsed";

export const ATTENDANCE_HEADER_COLLAPSE_EVENT = "mawell-attendance-header-collapse";

export type AttendanceNavKey = "dashboard" | "manage" | "reports" | "qr";

export type AttendanceNavItem = {
  key: AttendanceNavKey;
  href: string;
  label: string;
  shortLabel: string;
  includes?: readonly string[];
};

export const ATTENDANCE_NAV_ITEMS: AttendanceNavItem[] = [
  { key: "dashboard", href: ATTENDANCE_BASE, label: "แดชบอร์ด", shortLabel: "แดชบอร์ด" },
  {
    key: "manage",
    href: `${ATTENDANCE_BASE}/settings`,
    label: "จัดการเช็คอิน",
    shortLabel: "จัดการเช็คอิน",
    includes: [
      `${ATTENDANCE_BASE}/roster`,
      `${ATTENDANCE_BASE}/check`,
    ] as const,
  },
  { key: "reports", href: `${ATTENDANCE_BASE}/logs`, label: "รายงาน", shortLabel: "รายงาน" },
  { key: "qr", href: `${ATTENDANCE_BASE}/qr`, label: "QR จุดเช็คอิน", shortLabel: "QR จุดเช็คอิน" },
] as const;

export function isAttendanceModulePath(pathname: string): boolean {
  return pathname === ATTENDANCE_BASE || pathname.startsWith(`${ATTENDANCE_BASE}/`);
}

export function attendancePathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isAttendanceModulePath(pathname);

  const isDashboard = pathNorm === ATTENDANCE_BASE;

  const managePaths = [
    `${ATTENDANCE_BASE}/settings`,
    `${ATTENDANCE_BASE}/roster`,
    `${ATTENDANCE_BASE}/check`,
    `${ATTENDANCE_BASE}/staff`,
  ];
  const isManage = managePaths.some(
    (p) => pathNorm === p || pathNorm.startsWith(`${p}/`),
  );

  const isReports =
    pathNorm === `${ATTENDANCE_BASE}/logs` || pathNorm.startsWith(`${ATTENDANCE_BASE}/logs/`);

  const isQr =
    pathNorm === `${ATTENDANCE_BASE}/qr` || pathNorm.startsWith(`${ATTENDANCE_BASE}/qr/`);

  return { onModule, isDashboard, isManage, isReports, isQr };
}

export function isAttendanceNavItemActive(pathname: string, key: AttendanceNavKey): boolean {
  const f = attendancePathFlags(pathname);
  switch (key) {
    case "dashboard":
      return f.isDashboard;
    case "manage":
      return f.isManage;
    case "reports":
      return f.isReports;
    case "qr":
      return f.isQr;
    default:
      return false;
  }
}

export function readAttendanceHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ATTENDANCE_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeAttendanceHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ATTENDANCE_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(ATTENDANCE_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
