import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";

export type DormitoryTokenResult = { ok: true } | { ok: false; reason: "no_tokens" };

/**
 * สายรายวัน: เข้าโมดูลหอพักหัก 1 โทเคน ต่อวันปฏิทิน Bangkok (ไม่ซ้ำในวันเดียวกัน)
 * ADMIN / BUFFET ไม่หัก
 */
export async function applyDormitoryModuleTokenDeduction(userId: string): Promise<DormitoryTokenResult> {
  return prisma.$transaction(async (tx): Promise<DormitoryTokenResult> => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || user.role === "ADMIN") return { ok: true };
    if (user.subscriptionType === "BUFFET") return { ok: true };

    const todayKey = bangkokDateKey();
    const lastKey = user.lastDormitoryTokenDate ? bangkokDateKey(user.lastDormitoryTokenDate) : null;
    if (lastKey === todayKey) return { ok: true };

    if (user.tokens < 1) return { ok: false, reason: "no_tokens" };

    await tx.user.update({
      where: { id: userId },
      data: {
        tokens: user.tokens - 1,
        lastDormitoryTokenDate: new Date(`${todayKey}T12:00:00+07:00`),
      },
    });
    return { ok: true };
  });
}
