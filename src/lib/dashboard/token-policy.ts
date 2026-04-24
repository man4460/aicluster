import { CHAT_AI_DASHBOARD_HREF, CHAT_AI_LEGACY_DASHBOARD_HREF } from "@/lib/dashboard/chat-ai-href";

/** เส้นทางที่ผู้ใช้ทั่วไปยังเข้าได้เมื่อโทเคน = 0 */
export const TOKEN_EXEMPT_PATH_PREFIXES = [
  "/dashboard/refill",
  "/dashboard/plans",
  "/dashboard/profile",
  /** เลขาส่วนตัว — ทั้ง canonical กับ path เก่า (redirect) */
  CHAT_AI_LEGACY_DASHBOARD_HREF,
  CHAT_AI_DASHBOARD_HREF,
] as const;

export function isTokenExemptPath(pathname: string): boolean {
  return TOKEN_EXEMPT_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
