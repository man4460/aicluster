import { prisma } from "@/lib/prisma";
import { villageFeeAmountDueForYearMonth, villageFeeRowStatusAfterRegenerate } from "@/lib/village/house-fee-cycle";

export type GenerateVillageFeeRowsResult = {
  created: number;
  updated: number;
  skipped: number;
};

/**
 * สร้าง/เติมแถวค่าส่วนกลางสำหรับเดือน YYYY-MM
 * — ข้ามบ้านที่ billingStartYm ตั้งไว้และ yearMonth ยังมาก่อนเดือนนั้น
 */
export async function generateVillageFeeRowsForScope(args: {
  ownerUserId: string;
  trialSessionId: string;
  yearMonth: string;
  houseIds?: number[];
}): Promise<GenerateVillageFeeRowsResult> {
  const { ownerUserId, trialSessionId, yearMonth, houseIds } = args;

  const profile = await prisma.villageProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: { ownerUserId, trialSessionId },
    },
    select: { defaultMonthlyFee: true },
  });
  const defaultFee = profile?.defaultMonthlyFee ?? 0;

  const houses = await prisma.villageHouse.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      isActive: true,
      ...(houseIds?.length ? { id: { in: houseIds } } : {}),
    },
    orderBy: { sortOrder: "asc" },
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const h of houses) {
    if (h.billingStartYm && yearMonth < h.billingStartYm) {
      skipped += 1;
      continue;
    }

    const monthlyRate = h.monthlyFeeOverride ?? defaultFee;
    const amountDue = villageFeeAmountDueForYearMonth(h.feeCycle, yearMonth, monthlyRate);
    const whereUnique = {
      ownerUserId_trialSessionId_houseId_yearMonth: {
        ownerUserId,
        trialSessionId,
        houseId: h.id,
        yearMonth,
      },
    } as const;

    const existing = await prisma.villageCommonFeeRow.findUnique({ where: whereUnique });
    const amountPaid = existing?.amountPaid ?? 0;
    const status = villageFeeRowStatusAfterRegenerate(amountDue, amountPaid);

    await prisma.villageCommonFeeRow.upsert({
      where: whereUnique,
      create: {
        ownerUserId,
        trialSessionId,
        houseId: h.id,
        yearMonth,
        amountDue,
        amountPaid: 0,
        status: amountDue <= 0 ? "WAIVED" : "PENDING",
      },
      update: {
        amountDue,
        status,
      },
    });

    if (existing) updated += 1;
    else created += 1;
  }

  return { created, updated, skipped };
}
