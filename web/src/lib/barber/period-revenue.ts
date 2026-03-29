import { prisma } from "@/lib/prisma";

/**
 * รายได้ในช่วง [start, end) — เงินสดจาก walk-in + มูลค่าตามการหักแพ็ก (ราคาแพ็ก/จำนวนครั้ง ต่อครั้งที่ใช้)
 * สอดคล้องกับสรุปในหน้าประวัติ (ไม่มีตัวกรองข้อความ)
 */
export async function getBarberRevenueBahtInRange(
  ownerId: string,
  start: Date,
  end: Date,
  trialSessionId: string,
): Promise<{
  revenueCashBaht: number;
  revenuePackageBaht: number;
  revenueTotalBaht: number;
  cashSumOk: boolean;
}> {
  let revenuePackageBaht = 0;
  try {
    const row = await prisma.$queryRaw<[{ total: unknown }]>`
      SELECT COALESCE(SUM(CAST(bp.price AS DECIMAL(14, 4)) / NULLIF(bp.total_sessions, 0)), 0) AS total
      FROM barber_service_logs l
      INNER JOIN customer_subscriptions cs ON l.subscription_id = cs.id
      INNER JOIN barber_packages bp ON cs.package_id = bp.id
      WHERE l.owner_id = ${ownerId}
        AND l.trial_session_id = ${trialSessionId}
        AND l.visit_type = 'PACKAGE_USE'
        AND l.created_at >= ${start}
        AND l.created_at < ${end}
    `;
    revenuePackageBaht = Number(row[0]?.total ?? 0);
  } catch (e) {
    console.error("[barber/period-revenue] package sum", e);
  }

  let revenueCashBaht = 0;
  let cashSumOk = true;
  try {
    const cashSumRow = await prisma.barberServiceLog.aggregate({
      where: {
        ownerUserId: ownerId,
        trialSessionId,
        visitType: "CASH_WALK_IN",
        createdAt: { gte: start, lt: end },
      },
      _sum: { amountBaht: true },
    });
    revenueCashBaht = Number(cashSumRow._sum.amountBaht ?? 0);
  } catch (e) {
    cashSumOk = false;
    console.error("[barber/period-revenue] cash sum", e);
  }

  return {
    revenueCashBaht,
    revenuePackageBaht,
    revenueTotalBaht: revenueCashBaht + revenuePackageBaht,
    cashSumOk,
  };
}
