import { dashboardModuleHref } from "@/lib/dashboard-nav";

/** พาธสาธารณะสำหรับสแกน QR / แชร์ลิงก์ทดลองโมดูล */
export function moduleTryPath(slug: string): string {
  const s = slug.trim();
  return `/try/${encodeURIComponent(s)}`;
}

/** หน้าขอสาธิต / เลือกโมดูล — ยังไม่ล็อกอินอัตโนมัติ (ล็อกอินเมื่อกดเข้าทดลองจริง) */
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

export type ModuleTryUtmParams = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
};

function clipUtm(raw: string | null | undefined, max = 120): string | null {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return null;
  return s.slice(0, max);
}

/** absolute หรือ path `/try/{slug}` พร้อม UTM — ใช้สร้างลิงก์โฆษณา */
export function moduleTryUrlWithUtm(
  baseOrPath: string,
  slug: string,
  utm: ModuleTryUtmParams,
): string {
  const path = moduleTryPath(slug);
  const isAbs = /^https?:\/\//i.test(baseOrPath);
  const qs = new URLSearchParams();
  const src = clipUtm(utm.utmSource);
  const med = clipUtm(utm.utmMedium);
  const camp = clipUtm(utm.utmCampaign);
  const cont = clipUtm(utm.utmContent);
  const term = clipUtm(utm.utmTerm);
  if (src) qs.set("utm_source", src);
  if (med) qs.set("utm_medium", med);
  if (camp) qs.set("utm_campaign", camp);
  if (cont) qs.set("utm_content", cont);
  if (term) qs.set("utm_term", term);
  if (isAbs) {
    const url = new URL(path, baseOrPath.replace(/\/$/, ""));
    qs.forEach((v, k) => url.searchParams.set(k, v));
    return url.toString();
  }
  const q = qs.toString();
  return q ? `${path}?${q}` : path;
}
