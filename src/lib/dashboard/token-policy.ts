import { CHAT_AI_DASHBOARD_HREF } from "@/lib/dashboard/chat-ai-href";

/** เส้นทางที่ผู้ใช้ทั่วไปยังเข้าได้เมื่อโทเคน = 0 */
export const TOKEN_EXEMPT_PATH_PREFIXES = [
  "/dashboard/refill",
  "/dashboard/plans",
  "/dashboard/profile",
  CHAT_AI_DASHBOARD_HREF,
] as const;

export function isTokenExemptPath(pathname: string): boolean {
  return TOKEN_EXEMPT_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
