/**
 * Chat AI (น้องมาเวล) — เส้นทางเดียว: `/dashboard/chat-ai`
 */
export const CHAT_AI_DASHBOARD_HREF = "/dashboard/chat-ai" as const;

/** path เก่าที่อาจค้างใน cache — ไม่ใช้ในเมนู แต่ต้องจับให้ active / แปลง href */
const LEGACY_CHATAI_PATH = /^\/dashboard\/chatai(\/|$)/;

/** pathname หรือ href ชี้หน้า Chat AI (รวม URL สั้นเก่าที่อาจเหลือใน history) */
export function isChatAiDashboardPath(pathOrHref: string): boolean {
  const h = pathOrHref.trim();
  if (LEGACY_CHATAI_PATH.test(h)) return true;
  return h === CHAT_AI_DASHBOARD_HREF || h.startsWith(`${CHAT_AI_DASHBOARD_HREF}/`);
}

/** ใช้กับ `<Link>` / การ์ด — trim แล้วคง canonical */
export function resolveDashboardNavLinkHref(href: string): string {
  const h = href.trim();
  if (LEGACY_CHATAI_PATH.test(h)) return CHAT_AI_DASHBOARD_HREF;
  if (isChatAiDashboardPath(h)) return CHAT_AI_DASHBOARD_HREF;
  return h;
}

/** @deprecated ใช้ {@link resolveDashboardNavLinkHref} */
export function canonicalDashboardNavHref(href: string): string {
  return resolveDashboardNavLinkHref(href);
}
