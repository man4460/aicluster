export const ATTENDANCE_BASE = "/dashboard/attendance";

export const ATTENDANCE_SETTINGS_HREF = `${ATTENDANCE_BASE}/settings`;

/** แท็บสาขา · จุดเช็ค — ลิงก์จากรายชื่อพนักงาน / QR */
export const ATTENDANCE_BRANCH_SETTINGS_HREF = `${ATTENDANCE_SETTINGS_HREF}?tab=locations`;

export const ATTENDANCE_MODULE_DISPLAY_NAME = "เช็คอินอัจฉริยะ";

export const ATTENDANCE_HEADER_COLLAPSE_KEY = "mawell-attendance-module-header-collapsed";

export const ATTENDANCE_HEADER_COLLAPSE_EVENT = "mawell-attendance-header-collapse";

export type AttendanceNavKey = "dashboard" | "manage" | "reports" | "settings";

export type AttendanceNavItem = {
  key: AttendanceNavKey;
  href: string;
  label: string;
  shortLabel: string;
  includes?: readonly string[];
};

/** แท็บย่อยใต้ «จัดการเช็คอิน» — แสดงเมื่ออยู่ในกลุ่มจัดการ */
export const ATTENDANCE_MANAGE_SUB_LINKS = [
  { href: `${ATTENDANCE_BASE}/roster`, label: "รายชื่อพนักงาน" },
  { href: `${ATTENDANCE_BASE}/qr`, label: "QR จุดเช็คอิน" },
] as const;

export const ATTENDANCE_NAV_ITEMS: AttendanceNavItem[] = [
  { key: "dashboard", href: ATTENDANCE_BASE, label: "แดชบอร์ด", shortLabel: "แดชบอร์ด" },
  {
    key: "manage",
    href: `${ATTENDANCE_BASE}/roster`,
    label: "จัดการเช็คอิน",
    shortLabel: "จัดการ",
    includes: [
      `${ATTENDANCE_BASE}/roster`,
      `${ATTENDANCE_BASE}/qr`,
      `${ATTENDANCE_BASE}/staff`,
    ] as const,
  },
  { key: "reports", href: `${ATTENDANCE_BASE}/logs`, label: "รายงาน", shortLabel: "รายงาน" },
  { key: "settings", href: ATTENDANCE_SETTINGS_HREF, label: "ตั้งค่า", shortLabel: "ตั้งค่า" },
] as const;

export function isAttendanceModulePath(pathname: string): boolean {
  return pathname === ATTENDANCE_BASE || pathname.startsWith(`${ATTENDANCE_BASE}/`);
}

export function attendancePathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isAttendanceModulePath(pathname);

  const isDashboard = pathNorm === ATTENDANCE_BASE;

  const managePaths = [
    `${ATTENDANCE_BASE}/roster`,
    `${ATTENDANCE_BASE}/qr`,
    `${ATTENDANCE_BASE}/staff`,
  ];
  const isManage = managePaths.some(
    (p) => pathNorm === p || pathNorm.startsWith(`${p}/`),
  );

  const isReports =
    pathNorm === `${ATTENDANCE_BASE}/logs` || pathNorm.startsWith(`${ATTENDANCE_BASE}/logs/`);

  const isSettings =
    pathNorm === ATTENDANCE_SETTINGS_HREF || pathNorm.startsWith(`${ATTENDANCE_SETTINGS_HREF}/`);

  const isCheck =
    pathNorm === `${ATTENDANCE_BASE}/check` || pathNorm.startsWith(`${ATTENDANCE_BASE}/check/`);

  return { onModule, isDashboard, isManage, isReports, isSettings, isCheck };
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
    case "settings":
      return f.isSettings;
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
