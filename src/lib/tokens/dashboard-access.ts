import type { SubscriptionTier, SubscriptionType, UserRole } from "@/generated/prisma/enums";
import { isTokenDebtLocked } from "@/lib/tokens/token-debt";

export type DashboardAccessUser = {
  role: UserRole;
  subscriptionType: SubscriptionType;
  subscriptionTier: SubscriptionTier;
  tokens: number;
  lastBuffetBillingMonth: string | null;
  /** คงไว้เพื่อเข้ากันกับ caller เดิม — ไม่ใช้ล็อคแดชบอร์ดแล้ว */
  hasChargedModuleToday?: boolean;
};

/**
 * เข้าแดชบอร์ดได้เมื่อยังไม่ล็อคหนี้ (ติดลบถึงเกณฑ์)
 * ยอด 0 หรือติดลบไม่ถึงเกณฑ์ยังใช้ได้ — หักรายวันต่อโมดูลตอนเข้าใช้จริง
 */
export function computeDashboardAccessAllowed(user: DashboardAccessUser): boolean {
  if (user.role === "ADMIN") return true;
  return !isTokenDebtLocked(user.tokens);
}
