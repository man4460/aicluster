import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";

export type VillageTokenResult = { ok: true } | { ok: false; reason: "no_tokens" };

/** สายรายวัน: เข้าโมดูลหมู่บ้านหัก 1 โทเคน/วัน Bangkok */
export async function applyVillageModuleTokenDeduction(userId: string): Promise<VillageTokenResult> {
  return prisma.$transaction(async (tx): Promise<VillageTokenResult> => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || user.role === "ADMIN") return { ok: true };
    if (user.subscriptionType === "BUFFET") return { ok: true };

    const todayKey = bangkokDateKey();
    const lastKey = user.lastVillageTokenDate ? bangkokDateKey(user.lastVillageTokenDate) : null;
    if (lastKey === todayKey) return { ok: true };

    if (user.tokens < 1) return { ok: false, reason: "no_tokens" };

    await tx.user.update({
      where: { id: userId },
      data: {
        tokens: user.tokens - 1,
        lastVillageTokenDate: new Date(`${todayKey}T12:00:00+07:00`),
      },
    });
    return { ok: true };
  });
}
