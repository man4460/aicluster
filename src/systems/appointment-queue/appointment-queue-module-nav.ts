export const APPOINTMENT_QUEUE_BASE = "/dashboard/appointment-queue";
export const APPOINTMENT_QUEUE_SETTINGS_HREF = `${APPOINTMENT_QUEUE_BASE}/settings`;
export const APPOINTMENT_QUEUE_MODULE_DISPLAY_NAME = "จองคิวอัจฉริยะ";

export const APPOINTMENT_QUEUE_HEADER_COLLAPSE_KEY = "mawell-appointment-queue-module-header-collapsed";
export const APPOINTMENT_QUEUE_HEADER_COLLAPSE_EVENT = "mawell-appointment-queue-header-collapse";

export type AppointmentQueueNavKey = "dashboard" | "schedule" | "services" | "staff" | "settings";

export type AppointmentQueueNavItem = {
  key: AppointmentQueueNavKey;
  href: string;
  label: string;
  shortLabel: string;
};

export const APPOINTMENT_QUEUE_NAV_ITEMS: AppointmentQueueNavItem[] = [
  { key: "dashboard", href: APPOINTMENT_QUEUE_BASE, label: "คิว", shortLabel: "คิว" },
  { key: "schedule", href: `${APPOINTMENT_QUEUE_BASE}/schedule`, label: "ตาราง", shortLabel: "ตาราง" },
  { key: "services", href: `${APPOINTMENT_QUEUE_BASE}/services`, label: "บริการ", shortLabel: "บริการ" },
  { key: "staff", href: `${APPOINTMENT_QUEUE_BASE}/staff`, label: "ช่าง", shortLabel: "ช่าง" },
  { key: "settings", href: APPOINTMENT_QUEUE_SETTINGS_HREF, label: "ตั้งค่า", shortLabel: "ตั้งค่า" },
];

export function isAppointmentQueueModulePath(pathname: string): boolean {
  return pathname === APPOINTMENT_QUEUE_BASE || pathname.startsWith(`${APPOINTMENT_QUEUE_BASE}/`);
}

export function appointmentQueuePathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isAppointmentQueueModulePath(pathname);
  const isSchedule = pathNorm.endsWith(`${APPOINTMENT_QUEUE_BASE}/schedule`) || pathNorm.endsWith("/schedule");
  const isServices = pathNorm.endsWith(`${APPOINTMENT_QUEUE_BASE}/services`) || pathNorm.endsWith("/services");
  const isStaff = pathNorm.endsWith(`${APPOINTMENT_QUEUE_BASE}/staff`) || pathNorm.endsWith("/staff");
  const isSettings = pathNorm === APPOINTMENT_QUEUE_SETTINGS_HREF || pathNorm.endsWith("/settings");
  const isDashboard = onModule && !isSchedule && !isServices && !isStaff && !isSettings;
  return { onModule, isDashboard, isSchedule, isServices, isStaff, isSettings };
}

export function isAppointmentQueueNavItemActive(pathname: string, key: AppointmentQueueNavKey): boolean {
  const f = appointmentQueuePathFlags(pathname);
  switch (key) {
    case "dashboard":
      return f.isDashboard;
    case "schedule":
      return f.isSchedule;
    case "services":
      return f.isServices;
    case "staff":
      return f.isStaff;
    case "settings":
      return f.isSettings;
    default:
      return false;
  }
}

export function readAppointmentQueueHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(APPOINTMENT_QUEUE_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeAppointmentQueueHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(APPOINTMENT_QUEUE_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(APPOINTMENT_QUEUE_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
