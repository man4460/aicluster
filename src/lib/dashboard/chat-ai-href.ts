/**
 * Chat AI (น้องมาเวล)
 *
 * - ใช้ `CHAT_AI_DASHBOARD_HREF` ใน `<Link>` / เมนู / การ์ด — นี่คือ URL หลัก
 * - `CHAT_AI_LEGACY_DASHBOARD_HREF` ยัง redirect มาที่หลัก (next.config) และยังอยู่ใน token exempt
 */
export const CHAT_AI_DASHBOARD_HREF = "/dashboard/chat-ai" as const;
export const CHAT_AI_LEGACY_DASHBOARD_HREF = "/dashboard/chatai" as const;

/** pathname หรือ href ชี้หน้า Chat AI หรือไม่ (รวม path เก่า) */
export function isChatAiDashboardPath(pathOrHref: string): boolean {
  return (
    pathOrHref === CHAT_AI_DASHBOARD_HREF ||
    pathOrHref.startsWith(`${CHAT_AI_DASHBOARD_HREF}/`) ||
    pathOrHref === CHAT_AI_LEGACY_DASHBOARD_HREF ||
    pathOrHref.startsWith(`${CHAT_AI_LEGACY_DASHBOARD_HREF}/`)
  );
}
