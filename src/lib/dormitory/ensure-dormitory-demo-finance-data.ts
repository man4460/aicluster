import type { PrismaClient } from "@/generated/prisma/client";
import { ensureDormitoryIncomeCategories } from "@/lib/dormitory/ensure-dormitory-income-categories";
import { bangkokMonthKey } from "@/lib/time/bangkok";

type DbLike = Pick<
  PrismaClient,
  | "dormitoryProfile"
  | "dormitoryCostCategory"
  | "dormitoryCostEntry"
  | "dormitoryIncomeCategory"
  | "dormitoryIncomeEntry"
  | "room"
  | "tenant"
  | "utilityBill"
  | "splitBillPayment"
>;

const DEMO_ROOM_COUNT = 12;
const DEMO_MONTHS = 12;

const COST_CATEGORIES = ["ค่าน้ำ-ไฟส่วนกลาง", "ซ่อมบำรุง", "ค่าดูแลอาคาร"] as const;

const INCOME_LABELS = [
  "ค่าจอดรถรายเดือน",
  "ขายของฝาก",
  "ค่าใช้ห้องซักผ้า",
  "ค่าเช่าตู้เย็น",
] as const;

function addMonthsYm(ym: string, delta: number): string {
  const y = parseInt(ym.slice(0, 4), 10);
  const m = parseInt(ym.slice(5, 7), 10);
  let ny = y;
  let nm = m + delta;
  while (nm > 12) {
    nm -= 12;
    ny += 1;
  }
  while (nm < 1) {
    nm += 12;
    ny -= 1;
  }
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

function monthParts(ym: string): { y: number; m: number } {
  return { y: Number(ym.slice(0, 4)), m: Number(ym.slice(5, 7)) };
}

function monthsBack(count: number, endYm = bangkokMonthKey()): string[] {
  const out: string[] = [];
  let ym = endYm;
  for (let i = 0; i < count; i += 1) {
    out.unshift(ym);
    ym = addMonthsYm(ym, -1);
  }
  return out;
}

function monthRangeUtc(ym: string): { start: Date; endExclusive: Date } {
  const next = addMonthsYm(ym, 1);
  return {
    start: new Date(`${ym}-01T00:00:00+07:00`),
    endExclusive: new Date(`${next}-01T00:00:00+07:00`),
  };
}

async function ensureDormProfile(db: DbLike, ownerUserId: string, trialSessionId: string) {
  const existing = await db.dormitoryProfile.findFirst({
    where: { ownerUserId, trialSessionId },
    select: { id: true },
  });
  if (existing) return;
  await db.dormitoryProfile.create({
    data: {
      ownerUserId,
      trialSessionId,
      displayName: trialSessionId === "prod" ? "หอพักตัวอย่าง" : "หอพักตัวอย่าง (ทดลอง)",
      defaultPaperSize: "SLIP_58",
      paymentChannelsNote: "โอนธนาคาร / พร้อมเพย์ — ชุดทดลอง",
    },
  });
}

async function ensureCostCategories(db: DbLike, ownerUserId: string, trialSessionId: string) {
  const map = new Map<string, number>();
  for (const name of COST_CATEGORIES) {
    const found = await db.dormitoryCostCategory.findFirst({
      where: { ownerUserId, trialSessionId, name },
      select: { id: true },
    });
    if (found) {
      map.set(name, found.id);
      continue;
    }
    const created = await db.dormitoryCostCategory.create({
      data: { ownerUserId, trialSessionId, name },
      select: { id: true },
    });
    map.set(name, created.id);
  }
  return map;
}

/** งวดบิลที่ผ่านแล้ว → บังคับชำระแล้ว (รายรับ = จ่ายก่อน) · เดือนปัจจุบันใช้ mix ทดลอง */
async function syncDormitoryDemoFinanceToPresent(
  db: DbLike,
  ownerUserId: string,
  trialSessionId: string,
) {
  const currentYm = bangkokMonthKey();

  const openPayments = await db.splitBillPayment.findMany({
    where: {
      paymentStatus: { in: ["PENDING", "OVERDUE"] },
      tenant: { room: { ownerUserId, trialSessionId } },
    },
    select: {
      id: true,
      bill: { select: { billingYear: true, billingMonth: true } },
    },
  });

  for (const row of openPayments) {
    const billYm = `${row.bill.billingYear}-${String(row.bill.billingMonth).padStart(2, "0")}`;
    if (billYm >= currentYm) continue;

    await db.splitBillPayment.update({
      where: { id: row.id },
      data: {
        paymentStatus: "PAID",
        paidAt: new Date(`${billYm}-08T12:00:00+07:00`),
      },
    });
  }
}

async function monthHasFinanceData(
  db: DbLike,
  ownerUserId: string,
  trialSessionId: string,
  ym: string,
): Promise<boolean> {
  const { start, endExclusive } = monthRangeUtc(ym);
  const [paidCount, costCount, incomeCount] = await Promise.all([
    db.splitBillPayment.count({
      where: {
        paymentStatus: "PAID",
        paidAt: { gte: start, lt: endExclusive },
        tenant: { room: { ownerUserId, trialSessionId } },
      },
    }),
    db.dormitoryCostEntry.count({
      where: { ownerUserId, trialSessionId, spentAt: { gte: start, lt: endExclusive } },
    }),
    db.dormitoryIncomeEntry.count({
      where: { ownerUserId, trialSessionId, earnedAt: { gte: start, lt: endExclusive } },
    }),
  ]);
  return paidCount > 0 || costCount > 0 || incomeCount > 0;
}

async function seedDemoMonth(
  db: DbLike,
  ownerUserId: string,
  trialSessionId: string,
  ym: string,
  ymIndex: number,
  catIds: Map<string, number>,
  customIncomeCategoryId: string | null,
) {
  const currentYm = bangkokMonthKey();
  const isCurrent = ym === currentYm;
  const { y, m } = monthParts(ym);

  for (let i = 1; i <= DEMO_ROOM_COUNT; i += 1) {
    const roomNumber = `${Math.floor((i - 1) / 4) + 1}${String(((i - 1) % 4) + 1).padStart(2, "0")}`;
    const floor = Math.floor((i - 1) / 4) + 1;
    const basePrice = 3200 + (i % 4) * 250 + (ymIndex % 3) * 40;
    const occupied = i % 5 !== 0;

    const room = await db.room.upsert({
      where: {
        ownerUserId_roomNumber_trialSessionId: { ownerUserId, roomNumber, trialSessionId },
      },
      update: {
        floor,
        roomType: i % 2 === 0 ? "แอร์" : "พัดลม",
        maxOccupants: i % 3 === 0 ? 2 : 1,
        basePrice,
        status: occupied ? "OCCUPIED" : "AVAILABLE",
      },
      create: {
        ownerUserId,
        trialSessionId,
        roomNumber,
        floor,
        roomType: i % 2 === 0 ? "แอร์" : "พัดลม",
        maxOccupants: i % 3 === 0 ? 2 : 1,
        basePrice,
        status: occupied ? "OCCUPIED" : "AVAILABLE",
      },
    });

    if (!occupied) continue;

    const tenant =
      (await db.tenant.findFirst({
        where: { roomId: room.id, status: "ACTIVE" },
      })) ??
      (await db.tenant.create({
        data: {
          roomId: room.id,
          name: `ผู้เช่าทดลอง ${roomNumber}`,
          phone: `08${String(10000000 + i).slice(0, 8)}`,
          idCard: `${String(1100000000000 + i).slice(0, 13)}`,
          status: "ACTIVE",
          checkInDate: new Date(`${ym}-01T12:00:00+07:00`),
        },
      }));

    const billAmount = basePrice + 420 + (ymIndex % 4) * 60;
    const bill = await db.utilityBill.upsert({
      where: { roomId_billingYear_billingMonth: { roomId: room.id, billingYear: y, billingMonth: m } },
      update: { totalRoomAmount: billAmount },
      create: {
        roomId: room.id,
        billingYear: y,
        billingMonth: m,
        waterMeterPrev: 100 + i * 2 + ymIndex,
        waterMeterCurr: 106 + i * 2 + ymIndex,
        electricMeterPrev: 1500 + i * 15 + ymIndex * 3,
        electricMeterCurr: 1590 + i * 15 + ymIndex * 3,
        waterPrice: 18,
        electricPrice: 8,
        fixedFees: [{ label: "ค่าส่วนกลาง", amount: 200 + (ymIndex % 2) * 50 }],
        totalRoomAmount: billAmount,
      },
    });

    const payDay = String(Math.min(28, 5 + (i % 10))).padStart(2, "0");
    let paymentStatus: "PENDING" | "PAID" | "OVERDUE" = "PAID";
    if (isCurrent) {
      paymentStatus = i % 6 === 0 ? "OVERDUE" : i % 3 === 0 ? "PAID" : "PENDING";
    }

    await db.splitBillPayment.upsert({
      where: { tenantId_billId: { tenantId: tenant.id, billId: bill.id } },
      update: {
        amountToPay: billAmount,
        paymentStatus,
        paidAt:
          paymentStatus === "PAID" ? new Date(`${ym}-${payDay}T12:00:00+07:00`) : null,
      },
      create: {
        tenantId: tenant.id,
        billId: bill.id,
        amountToPay: billAmount,
        paymentStatus,
        paidAt:
          paymentStatus === "PAID" ? new Date(`${ym}-${payDay}T12:00:00+07:00`) : null,
      },
    });
  }

  const costRows = [
    {
      day: 6,
      category: COST_CATEGORIES[ymIndex % COST_CATEGORIES.length]!,
      item: `ค่าใช้จ่าย ${ym.slice(5, 7)}/${ym.slice(0, 4)}`,
      amount: 1800 + ymIndex * 180,
    },
    {
      day: 18,
      category: COST_CATEGORIES[(ymIndex + 1) % COST_CATEGORIES.length]!,
      item: `ซ่อม/ดูแล ${ym.slice(5, 7)}/${ym.slice(0, 4)}`,
      amount: 1200 + ymIndex * 120,
    },
  ] as const;

  for (const row of costRows) {
    const categoryId = catIds.get(row.category);
    if (!categoryId) continue;
    const spentAt = new Date(`${ym}-${String(row.day).padStart(2, "0")}T10:00:00+07:00`);
    const existing = await db.dormitoryCostEntry.findFirst({
      where: {
        ownerUserId,
        trialSessionId,
        categoryId,
        spentAt,
        itemLabel: row.item,
      },
      select: { id: true },
    });
    if (existing) continue;
    await db.dormitoryCostEntry.create({
      data: {
        ownerUserId,
        trialSessionId,
        categoryId,
        spentAt,
        amount: row.amount,
        itemLabel: row.item,
        note: "ข้อมูลทดลอง",
      },
    });
  }

  if (customIncomeCategoryId) {
    const label = INCOME_LABELS[ymIndex % INCOME_LABELS.length]!;
    const earnedAt = new Date(`${ym}-12T15:00:00+07:00`);
    const amountBaht = 900 + ymIndex * 75;
    const existingIncome = await db.dormitoryIncomeEntry.findFirst({
      where: {
        ownerUserId,
        trialSessionId,
        categoryId: customIncomeCategoryId,
        earnedAt,
        label,
      },
      select: { id: true },
    });
    if (!existingIncome) {
      await db.dormitoryIncomeEntry.create({
        data: {
          ownerUserId,
          trialSessionId,
          categoryId: customIncomeCategoryId,
          label,
          amountBaht,
          earnedAt,
          note: "ข้อมูลทดลอง",
        },
      });
    }
  }
}

export type EnsureDormitoryDemoFinanceOptions = {
  /** จำนวนเดือนย้อนหลัง (รวมเดือนปัจจุบัน) — ค่าเริ่ม 12 */
  months?: number;
  /** true = เติมเฉพาะเดือนที่ยังไม่มีข้อมูล */
  fillMissingOnly?: boolean;
};

/**
 * เติมข้อมูลรายรับ/รายจ่ายตัวอย่างหลายเดือน — สำหรับทดลองใช้และ demo prod
 * idempotent: ข้ามเดือนที่มีข้อมูลแล้ว (เมื่อ fillMissingOnly)
 */
export async function ensureDormitoryDemoFinanceData(
  db: DbLike,
  ownerUserId: string,
  trialSessionId: string,
  opts?: EnsureDormitoryDemoFinanceOptions,
): Promise<{ seededMonths: number }> {
  const monthCount = opts?.months ?? DEMO_MONTHS;
  const fillMissingOnly = opts?.fillMissingOnly !== false;

  await ensureDormProfile(db, ownerUserId, trialSessionId);
  const catIds = await ensureCostCategories(db, ownerUserId, trialSessionId);
  await ensureDormitoryIncomeCategories(ownerUserId, trialSessionId);
  await syncDormitoryDemoFinanceToPresent(db, ownerUserId, trialSessionId);

  const currentYm = bangkokMonthKey();
  const customIncome = await db.dormitoryIncomeCategory.findFirst({
    where: {
      ownerUserId,
      trialSessionId,
      kind: "CUSTOM",
      isBuiltin: false,
      name: "รายรับอื่น",
    },
    select: { id: true },
  });

  const ymList = monthsBack(monthCount);
  let seededMonths = 0;

  for (let idx = 0; idx < ymList.length; idx += 1) {
    const ym = ymList[idx]!;
    const isCurrentMonth = ym === currentYm;
    if (
      !isCurrentMonth &&
      fillMissingOnly &&
      (await monthHasFinanceData(db, ownerUserId, trialSessionId, ym))
    ) {
      continue;
    }
    await seedDemoMonth(db, ownerUserId, trialSessionId, ym, idx, catIds, customIncome?.id ?? null);
    seededMonths += 1;
  }

  return { seededMonths };
}
