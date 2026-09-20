import type { PrismaClient } from "@/generated/prisma/client";
import {
  computeDayWage,
  bangkokWeekMonday,
  resolveHolidayKind,
  type HolidayKind,
  type WageShopRates,
} from "@/systems/smart-guard-tour/lib/wage-engine";

type Db = Pick<
  PrismaClient,
  "smartGuardShop" | "smartGuardStaff" | "smartGuardShiftLog" | "smartGuardWorkSpan" | "smartGuardDutyTemplate"
>;

function dec(v: { toString(): string } | number | null | undefined, fallback: number): number {
  if (v == null) return fallback;
  const n = typeof v === "number" ? v : Number(v.toString());
  return Number.isFinite(n) ? n : fallback;
}

export async function ensureSmartGuardDutyTemplates(
  db: Pick<PrismaClient, "smartGuardDutyTemplate">,
  shopId: string,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  const n = await db.smartGuardDutyTemplate.count({ where: { shopId } });
  if (n > 0) return;
  const base = { ownerUserId, trialSessionId, shopId, isActive: true };
  await db.smartGuardDutyTemplate.createMany({
    data: [
      {
        ...base,
        name: "กะ 12 ชม. (เช้า)",
        startHm: "07:00",
        endHm: "19:00",
        plannedMinutes: 720,
        breakMinutes: 0,
        normalCapMinutes: 480,
        roleMask: "BOTH",
        sortOrder: 10,
      },
      {
        ...base,
        name: "กะ 12 ชม. (ดึก)",
        startHm: "19:00",
        endHm: "07:00",
        plannedMinutes: 720,
        breakMinutes: 0,
        normalCapMinutes: 480,
        roleMask: "BOTH",
        sortOrder: 20,
      },
      {
        ...base,
        name: "กะ 8 ชม.",
        startHm: "08:00",
        endHm: "16:00",
        plannedMinutes: 480,
        breakMinutes: 0,
        normalCapMinutes: 480,
        roleMask: "BOTH",
        sortOrder: 30,
      },
    ],
  });
}

/** คำนวณ/อัปเซิร์ต WorkSpan จาก ShiftLog หนึ่งแถว */
export async function recomputeSmartGuardWorkSpan(
  db: Db,
  shiftLogId: string,
  holidayKind?: HolidayKind,
): Promise<void> {
  const shift = await db.smartGuardShiftLog.findUnique({
    where: { id: shiftLogId },
    include: {
      template: { select: { normalCapMinutes: true, plannedMinutes: true } },
      staff: { select: { hourlyRateBaht: true } },
    },
  });
  if (!shift) return;

  const shop = await db.smartGuardShop.findUnique({
    where: { id: shift.shopId },
    select: {
      dailyNormalCapMinutes: true,
      weeklyNormalCapMinutes: true,
      otMultiplier: true,
      holidayMultiplier: true,
      holidayOtMultiplier: true,
    },
  });
  if (!shop) return;

  const rates: WageShopRates = {
    dailyNormalCapMinutes: shop.dailyNormalCapMinutes,
    weeklyNormalCapMinutes: shop.weeklyNormalCapMinutes,
    otMultiplier: dec(shop.otMultiplier, 1.5),
    holidayMultiplier: dec(shop.holidayMultiplier, 2),
    holidayOtMultiplier: dec(shop.holidayOtMultiplier, 3),
  };

  const resolvedHoliday = holidayKind ?? resolveHolidayKind(shift.shiftOn, null);

  const weekStart = bangkokWeekMonday(shift.shiftOn);
  const prior = await db.smartGuardWorkSpan.aggregate({
    where: {
      shopId: shift.shopId,
      staffId: shift.staffId,
      workOn: { gte: weekStart, lte: shift.shiftOn },
      NOT: { shiftLogId },
    },
    _sum: { normalMinutes: true },
  });
  const weekBefore = prior._sum.normalMinutes ?? 0;

  const planned = shift.template?.plannedMinutes ?? null;
  const templateCap = shift.template?.normalCapMinutes ?? null;
  const breakdown = computeDayWage(
    {
      checkInAt: shift.checkInAt,
      checkOutAt: shift.checkOutAt,
      breakMinutes: shift.breakMinutes,
      templateNormalCapMinutes: templateCap,
      holidayKind: resolvedHoliday,
    },
    { hourlyRateBaht: shift.staff.hourlyRateBaht },
    rates,
    { weekNormalMinutesBeforeThisShift: weekBefore },
  );

  if (
    planned != null &&
    templateCap != null &&
    breakdown.otMinutes > Math.max(0, planned - templateCap)
  ) {
    if (!breakdown.flags.includes("DAILY_OT_ABOVE_TEMPLATE")) {
      breakdown.flags.push("DAILY_OT_ABOVE_TEMPLATE");
    }
  }

  const existing = await db.smartGuardWorkSpan.findUnique({
    where: { shiftLogId },
    select: { id: true, locked: true },
  });
  if (existing?.locked) return;

  const data = {
    ownerUserId: shift.ownerUserId,
    trialSessionId: shift.trialSessionId,
    shopId: shift.shopId,
    staffId: shift.staffId,
    shiftLogId: shift.id,
    workOn: shift.shiftOn,
    clockMinutes: breakdown.clockMinutes,
    normalMinutes: breakdown.normalMinutes,
    otMinutes: breakdown.otMinutes,
    holidayKind: breakdown.holidayKind,
    wageNormalBaht: breakdown.wageNormalBaht,
    wageOtBaht: breakdown.wageOtBaht,
    wageHolidayBaht: breakdown.wageHolidayBaht,
    totalBaht: breakdown.totalBaht,
    flagsJson: JSON.stringify(breakdown.flags),
  };

  if (existing) {
    await db.smartGuardWorkSpan.update({ where: { id: existing.id }, data });
  } else {
    await db.smartGuardWorkSpan.create({ data });
  }
}
