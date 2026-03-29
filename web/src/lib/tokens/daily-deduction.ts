import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";

/**
 * สายรายวัน (DAILY): หักโทเคน 1 ต่อวันปฏิทิน Bangkok ที่ข้ามนับจาก last_deduction_date
 * สมัครใหม่ lastDeductionDate = null → ครั้งแรกแค่ตั้งวันนี้ ไม่หัก — BUFFET ไม่ผ่านฟังก์ชันนี้
 */
export async function applyDailyTokenDeduction(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || user.role === "ADMIN") return;
    if (user.subscriptionType === "BUFFET") return;

    const todayKey = bangkokDateKey();

    if (user.lastDeductionDate === null) {
      await tx.user.update({
        where: { id: userId },
        data: { lastDeductionDate: new Date() },
      });
      return;
    }

    const lastKey = bangkokDateKey(user.lastDeductionDate);
    if (lastKey >= todayKey) return;

    const ms =
      Date.parse(`${todayKey}T00:00:00+07:00`) - Date.parse(`${lastKey}T00:00:00+07:00`);
    const days = Math.floor(ms / 86_400_000);
    if (days < 1) return;

    const deduct = Math.min(days, user.tokens);
    await tx.user.update({
      where: { id: userId },
      data: {
        tokens: Math.max(0, user.tokens - deduct),
        lastDeductionDate: new Date(),
      },
    });
  });
}
