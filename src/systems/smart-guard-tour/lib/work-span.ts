import type { PrismaClient } from "@/generated/prisma/client";
import {
  computeDayWage,
  bangkokWeekMonday,
  dutyWorkMinutes,
  bangkokDutyBounds,
  resolveHolidayKind,
  type HolidayKind,
  type WageShopRates,
} from "@/systems/smart-guard-tour/lib/wage-engine";

type Db = Pick<
  PrismaClient,
  | "smartGuardShop"
  | "smartGuardStaff"
  | "smartGuardShiftLog"
  | "smartGuardWorkSpan"
  | "smartGuardDutyTemplate"
  | "smartGuardPostDuty"
>;

type TemplateWageFields = {
  plannedMinutes: number;
  breakMinutes: number;
  normalCapMinutes: number;
  shiftRateBaht: number;
};

function dec(v: { toString(): string } | number | null | undefined, fallback: number): number {
  if (v == null) return fallback;
  const n = typeof v === "number" ? v : Number(v.toString());
  return Number.isFinite(n) ? n : fallback;
}

const NON_COUNTABLE = new Set(["ABSENT", "CANCELLED", "SWAPPED"]);

const TEMPLATE_WAGE_SELECT = {
  plannedMinutes: true,
  breakMinutes: true,
  normalCapMinutes: true,
  shiftRateBaht: true,
} as const;

export async function ensureSmartGuardDutyTemplates(
  db: Pick<PrismaClient, "smartGuardDutyTemplate">,
  shopId: string,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  const n = await db.smartGuardDutyTemplate.count({ where: { shopId } });
  if (n === 0) {
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
          shiftRateBaht: 600,
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
          shiftRateBaht: 600,
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
          shiftRateBaht: 400,
          roleMask: "BOTH",
          sortOrder: 30,
        },
      ],
    });
    return;
  }

  // เติมอัตรากะให้แม่แบบเก่าที่ยังเป็น 0
  await db.smartGuardDutyTemplate.updateMany({
    where: { shopId, shiftRateBaht: 0, plannedMinutes: { gte: 720 } },
    data: { shiftRateBaht: 600 },
  });
  await db.smartGuardDutyTemplate.updateMany({
    where: { shopId, shiftRateBaht: 0, plannedMinutes: { gt: 0, lt: 720 } },
    data: { shiftRateBaht: 400 },
  });
}

async function shopRates(db: Db, shopId: string): Promise<WageShopRates | null> {
  const shop = await db.smartGuardShop.findUnique({
    where: { id: shopId },
    select: {
      dailyNormalCapMinutes: true,
      weeklyNormalCapMinutes: true,
      otMultiplier: true,
      holidayMultiplier: true,
      holidayOtMultiplier: true,
    },
  });
  if (!shop) return null;
  return {
    dailyNormalCapMinutes: shop.dailyNormalCapMinutes,
    weeklyNormalCapMinutes: shop.weeklyNormalCapMinutes,
    otMultiplier: dec(shop.otMultiplier, 1.5),
    holidayMultiplier: dec(shop.holidayMultiplier, 2),
    holidayOtMultiplier: dec(shop.holidayOtMultiplier, 3),
  };
}

async function upsertWorkSpanForShift(
  db: Db,
  params: {
    shift: {
      id: string;
      ownerUserId: string;
      trialSessionId: string;
      shopId: string;
      staffId: string;
      shiftOn: string;
    };
    staff: { hourlyRateBaht: number; wageBahtPerShift: number };
    rates: WageShopRates;
    dutyMinutes: number | null;
    template: TemplateWageFields | null;
    holidayKind: HolidayKind;
    countable: boolean;
  },
): Promise<void> {
  const weekStart = bangkokWeekMonday(params.shift.shiftOn);
  const prior = await db.smartGuardWorkSpan.aggregate({
    where: {
      shopId: params.shift.shopId,
      staffId: params.shift.staffId,
      workOn: { gte: weekStart, lte: params.shift.shiftOn },
      NOT: { shiftLogId: params.shift.id },
    },
    _sum: { normalMinutes: true },
  });

  const breakdown = computeDayWage(
    {
      dutyMinutes: params.dutyMinutes,
      templateNormalCapMinutes: params.template?.normalCapMinutes ?? null,
      plannedMinutes: params.template?.plannedMinutes ?? null,
      shiftRateBaht: params.template?.shiftRateBaht ?? null,
      holidayKind: params.holidayKind,
      countable: params.countable,
    },
    {
      wageBahtPerShift: params.staff.wageBahtPerShift,
      hourlyRateBaht: params.staff.hourlyRateBaht,
    },
    params.rates,
    { weekNormalMinutesBeforeThisShift: prior._sum.normalMinutes ?? 0 },
  );

  const existing = await db.smartGuardWorkSpan.findUnique({
    where: { shiftLogId: params.shift.id },
    select: { id: true, locked: true },
  });
  if (existing?.locked) return;

  const data = {
    ownerUserId: params.shift.ownerUserId,
    trialSessionId: params.shift.trialSessionId,
    shopId: params.shift.shopId,
    staffId: params.shift.staffId,
    shiftLogId: params.shift.id,
    workOn: params.shift.shiftOn,
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

/**
 * สร้าง/อัปเดต ShiftLog ห่อ PostDuty แล้วคำนวณ WorkSpan จากแม่แบบกะ + อัตรากะ
 */
export async function recomputeSmartGuardWorkSpanForPostDuty(
  db: Db,
  postDutyId: string,
  holidayKind?: HolidayKind,
): Promise<void> {
  const duty = await db.smartGuardPostDuty.findUnique({
    where: { id: postDutyId },
    include: {
      template: {
        select: {
          ...TEMPLATE_WAGE_SELECT,
          startHm: true,
          endHm: true,
        },
      },
      staff: { select: { hourlyRateBaht: true, wageBahtPerShift: true } },
      shiftLogs: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { id: true },
      },
    },
  });
  if (!duty) return;

  const rates = await shopRates(db, duty.shopId);
  if (!rates) return;

  const bounds = bangkokDutyBounds(duty.dutyOn, duty.template.startHm, duty.template.endHm);
  let shiftId = duty.shiftLogs[0]?.id ?? null;

  if (!shiftId) {
    const created = await db.smartGuardShiftLog.create({
      data: {
        ownerUserId: duty.ownerUserId,
        trialSessionId: duty.trialSessionId,
        shopId: duty.shopId,
        staffId: duty.staffId,
        shiftOn: duty.dutyOn,
        checkInAt: bounds.start,
        checkOutAt: bounds.end,
        breakMinutes: duty.template.breakMinutes,
        templateId: duty.templateId,
        postDutyId: duty.id,
        note: "duty-roster",
      },
    });
    shiftId = created.id;
  } else {
    await db.smartGuardShiftLog.update({
      where: { id: shiftId },
      data: {
        checkInAt: bounds.start,
        checkOutAt: bounds.end,
        breakMinutes: duty.template.breakMinutes,
        templateId: duty.templateId,
        postDutyId: duty.id,
      },
    });
  }

  const countable = !NON_COUNTABLE.has(duty.status);
  await upsertWorkSpanForShift(db, {
    shift: {
      id: shiftId,
      ownerUserId: duty.ownerUserId,
      trialSessionId: duty.trialSessionId,
      shopId: duty.shopId,
      staffId: duty.staffId,
      shiftOn: duty.dutyOn,
    },
    staff: duty.staff,
    rates,
    dutyMinutes: dutyWorkMinutes(duty.template.plannedMinutes, duty.template.breakMinutes),
    template: {
      plannedMinutes: duty.template.plannedMinutes,
      breakMinutes: duty.template.breakMinutes,
      normalCapMinutes: duty.template.normalCapMinutes,
      shiftRateBaht: duty.template.shiftRateBaht,
    },
    holidayKind: holidayKind ?? resolveHolidayKind(duty.dutyOn, null),
    countable,
  });
}

/**
 * คำนวณ WorkSpan จาก ShiftLog — ถ้าผูก PostDuty/แม่แบบกะ จะนับตามกะ + อัตรากะ
 */
export async function recomputeSmartGuardWorkSpan(
  db: Db,
  shiftLogId: string,
  holidayKind?: HolidayKind,
): Promise<void> {
  const shift = await db.smartGuardShiftLog.findUnique({
    where: { id: shiftLogId },
    include: {
      template: { select: TEMPLATE_WAGE_SELECT },
      postDuty: {
        select: {
          status: true,
          template: { select: TEMPLATE_WAGE_SELECT },
        },
      },
      staff: { select: { hourlyRateBaht: true, wageBahtPerShift: true } },
    },
  });
  if (!shift) return;

  const rates = await shopRates(db, shift.shopId);
  if (!rates) return;

  const tpl = shift.postDuty?.template ?? shift.template;
  if (!tpl) {
    await upsertWorkSpanForShift(db, {
      shift: {
        id: shift.id,
        ownerUserId: shift.ownerUserId,
        trialSessionId: shift.trialSessionId,
        shopId: shift.shopId,
        staffId: shift.staffId,
        shiftOn: shift.shiftOn,
      },
      staff: shift.staff,
      rates,
      dutyMinutes: null,
      template: null,
      holidayKind: holidayKind ?? resolveHolidayKind(shift.shiftOn, null),
      countable: true,
    });
    return;
  }

  const countable = shift.postDuty ? !NON_COUNTABLE.has(shift.postDuty.status) : true;
  await upsertWorkSpanForShift(db, {
    shift: {
      id: shift.id,
      ownerUserId: shift.ownerUserId,
      trialSessionId: shift.trialSessionId,
      shopId: shift.shopId,
      staffId: shift.staffId,
      shiftOn: shift.shiftOn,
    },
    staff: shift.staff,
    rates,
    dutyMinutes: dutyWorkMinutes(tpl.plannedMinutes, tpl.breakMinutes),
    template: tpl,
    holidayKind: holidayKind ?? resolveHolidayKind(shift.shiftOn, null),
    countable,
  });
}
