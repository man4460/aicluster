import { dashboardModuleHref } from "@/lib/dashboard-nav";

/** พาธสาธารณะสำหรับสแกน QR / แชร์ลิงก์ทดลองโมดูล */
export function moduleTryPath(slug: string): string {
  const s = slug.trim();
  return `/try/${encodeURIComponent(s)}`;
}

/** หน้าทดลองใช้ทุกโมดูล — เข้าบัญชี demo แล้วไประบบทั้งหมด */
export const MODULE_TRY_ALL_PATH = "/try" as const;

/** แดชบอร์ดหลังขอสาธิตฟรี — เมนูระบบทั้งหมดของบัญชีทดลอง */
export const MODULE_TRY_ALL_DASHBOARD_HREF = "/dashboard/modules" as const;

/** แดชบอร์ดโมดูลหลังเข้าบัญชีทดลอง */
export function moduleTryDashboardHref(slug: string): string {
  return dashboardModuleHref(slug.trim());
}

/** สร้าง absolute URL สำหรับคัดลอก / QR (base ไม่มี trailing slash) */
export function moduleTryAbsoluteUrl(baseUrl: string, slug: string): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}${moduleTryPath(slug)}`;
}
