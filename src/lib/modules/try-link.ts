import { dashboardModuleHref } from "@/lib/dashboard-nav";

/** พาธสาธารณะสำหรับสแกน QR / แชร์ลิงก์ทดลองโมดูล */
export function moduleTryPath(slug: string): string {
  const s = slug.trim();
  return `/try/${encodeURIComponent(s)}`;
}

/** แดชบอร์ดโมดูลหลังเข้าบัญชีทดลอง */
export function moduleTryDashboardHref(slug: string): string {
  return dashboardModuleHref(slug.trim());
}

/** สร้าง absolute URL สำหรับคัดลอก / QR (base ไม่มี trailing slash) */
export function moduleTryAbsoluteUrl(baseUrl: string, slug: string): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}${moduleTryPath(slug)}`;
}
