import type { SubscriptionTier, SubscriptionType, UserRole } from "@/generated/prisma/enums";
import { bangkokMonthKey } from "@/lib/time/bangkok";
import { tierMonthlyBuffetTokenCost } from "@/lib/modules/config";

export type DashboardAccessUser = {
  role: UserRole;
  subscriptionType: SubscriptionType;
  subscriptionTier: SubscriptionTier;
  tokens: number;
  lastBuffetBillingMonth: string | null;
  /** สายรายวันที่หักโทเคนไปแล้วในวัน Bangkok นี้อย่างน้อย 1 โมดูล (จะอนุโลมแม้ tokens = 0) */
  hasChargedModuleToday?: boolean;
};

/**
 * เข้าแดชบอร์ด/ฟีเจอร์หลักได้หรือไม่ (ไม่รวมเส้นทางยกเว้นเช่น refill, plans, profile)
 * - สายรายวัน: ต้องมีโทเคน > 0 หรือเคยหักโทเคนโมดูลในวันนี้แล้ว (ใช้โมดูลที่หักแล้วต่อจนถึงเที่ยงคืน Bangkok)
 * - แพ็กเกจ BUFFET: ต้องหักรายเดือนงวดปัจจุบันสำเร็จแล้ว หรือมีโทเคนพอสำหรับงวดนี้
 */
export function computeDashboardAccessAllowed(user: DashboardAccessUser): boolean {
  if (user.role === "ADMIN") return true;
  if (user.subscriptionType === "DAILY") {
    if (user.tokens > 0) return true;
    return Boolean(user.hasChargedModuleToday);
  }
  if (user.subscriptionType === "BUFFET") {
    if (user.subscriptionTier === "NONE") return user.tokens > 0;
    const mk = bangkokMonthKey();
    if (user.lastBuffetBillingMonth === mk) return true;
    const cost = tierMonthlyBuffetTokenCost(user.subscriptionTier);
    if (cost <= 0) return true;
    return user.tokens >= cost;
  }
  return user.tokens > 0;
}
