import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";

export type AttendanceTokenResult = { ok: true } | { ok: false; reason: "no_tokens" };

/** สายรายวัน: เข้าโมดูลเช็คชื่อหัก 1 โทเคน/วัน Bangkok ที่บัญชีเจ้าของ (billing user) */
export async function applyAttendanceModuleTokenDeduction(billingUserId: string): Promise<AttendanceTokenResult> {
  return prisma.$transaction(async (tx): Promise<AttendanceTokenResult> => {
    const user = await tx.user.findUnique({ where: { id: billingUserId } });
    if (!user || user.role === "ADMIN") return { ok: true };
    if (user.subscriptionType === "BUFFET") return { ok: true };

    const todayKey = bangkokDateKey();
    const lastKey = user.lastAttendanceTokenDate ? bangkokDateKey(user.lastAttendanceTokenDate) : null;
    if (lastKey === todayKey) return { ok: true };

    if (user.tokens < 1) return { ok: false, reason: "no_tokens" };

    await tx.user.update({
      where: { id: billingUserId },
      data: {
        tokens: user.tokens - 1,
        lastAttendanceTokenDate: new Date(`${todayKey}T12:00:00+07:00`),
      },
    });
    return { ok: true };
  });
}
