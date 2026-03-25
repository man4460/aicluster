import { prisma } from "@/lib/prisma";
import { bangkokMonthKey } from "@/lib/time/bangkok";
import { tierMonthlyBuffetTokenCost } from "@/lib/modules/config";

/**
 * หักโทเคนค่าแพ็กเกจรายเดือน (BUFFET) ตามงวดปฏิทิน Bangkok
 * ถ้าโทเคนไม่พอจะไม่อัปเดตงวด — ผู้ใช้ต้องเติมโทเคน (เข้าใช้งานไม่ได้จนกว่าจะหักสำเร็จ)
 */
export async function applyBuffetMonthlyBilling(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || user.role === "ADMIN") return;
    if (user.subscriptionType !== "BUFFET" || user.subscriptionTier === "NONE") return;

    const mk = bangkokMonthKey();
    if (user.lastBuffetBillingMonth === mk) return;

    const cost = tierMonthlyBuffetTokenCost(user.subscriptionTier);
    if (cost <= 0) {
      await tx.user.update({
        where: { id: userId },
        data: { lastBuffetBillingMonth: mk },
      });
      return;
    }

    if (user.tokens >= cost) {
      await tx.user.update({
        where: { id: userId },
        data: {
          tokens: user.tokens - cost,
          lastBuffetBillingMonth: mk,
        },
      });
    }
  });
}
