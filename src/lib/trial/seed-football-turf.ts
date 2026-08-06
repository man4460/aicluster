import type { PrismaClient } from "@/generated/prisma/client";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { ensureFootballTurfProfile } from "@/systems/football-turf/lib/ensure-profile";
import { parseBookingDate } from "@/systems/football-turf/lib/mappers";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

function daysAgoIsoDate(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function daysAgoDateTime(days: number, hour = 12): Date {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * ใส่จอง / ขายโปร / รายจ่ายตัวอย่าง เมื่อยังไม่มีรายการจอง
 * (ให้หน้าการเงินและกราฟมีข้อมูลดูได้ทันที)
 */
export async function seedFootballTurfSampleActivity(
  db: PrismaClient | Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  const tx = db;
  const bookingCount = await tx.footballTurfBooking.count({
    where: { ownerUserId, trialSessionId },
  });
  if (bookingCount > 0) return;

  const courts = await tx.footballTurfCourt.findMany({
    where: { ownerUserId, trialSessionId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  if (courts.length === 0) return;

  const courtA = courts[0]!;
  const courtB = courts[1] ?? courts[0]!;

  const categories = await tx.footballTurfCostCategory.findMany({
    where: { ownerUserId, trialSessionId },
    orderBy: { id: "asc" },
  });
  const catUtility = categories.find((c) => c.name.includes("น้ำ")) ?? categories[0];
  const catField = categories.find((c) => c.name.includes("ดูแล")) ?? categories[1] ?? categories[0];

  const promotions = await tx.footballTurfPromotion.findMany({
    where: { ownerUserId, trialSessionId },
    orderBy: { id: "asc" },
  });
  const promo10 = promotions[0];

  await tx.footballTurfCustomer.createMany({
    data: [
      {
        ownerUserId,
        trialSessionId,
        name: "ทีมเสือดำ",
        phone: "0811111111",
        teamName: "เสือดำ FC",
        note: "ลูกค้าประจำ · ข้อมูลตัวอย่าง",
        isActive: true,
      },
      {
        ownerUserId,
        trialSessionId,
        name: "ทีมตัวอย่าง",
        phone: "0899999999",
        teamName: "Night League",
        note: "ข้อมูลตัวอย่าง",
        isActive: true,
      },
      {
        ownerUserId,
        trialSessionId,
        name: "คุณอาร์ม",
        phone: "0822222222",
        teamName: "Arm United",
        note: "",
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  const bookingSpecs: Array<{
    daysAgo: number;
    courtId: number;
    startTime: string;
    endTime: string;
    customerName: string;
    customerPhone: string;
    teamName: string;
    playerCount: number;
    source: string;
    status: string;
    listedPrice: number;
    finalPrice: number;
    note: string;
    paymentMethod: string;
  }> = [
    {
      daysAgo: 0,
      courtId: courtA.id,
      startTime: "18:00",
      endTime: "19:00",
      customerName: "ทีมเสือดำ",
      customerPhone: "0811111111",
      teamName: "เสือดำ FC",
      playerCount: 10,
      source: "ONLINE",
      status: "BOOKED",
      listedPrice: courtA.weekdayPrice,
      finalPrice: courtA.weekdayPrice,
      note: "จองจากลิงก์ลูกค้า",
      paymentMethod: "TRANSFER",
    },
    {
      daysAgo: 0,
      courtId: courtB.id,
      startTime: "20:00",
      endTime: "21:30",
      customerName: "ทีมตัวอย่าง",
      customerPhone: "0899999999",
      teamName: "Night League",
      playerCount: 12,
      source: "WALK_IN",
      status: "PLAYING",
      listedPrice: courtB.weekendPrice || courtB.weekdayPrice,
      finalPrice: courtB.weekendPrice || courtB.weekdayPrice,
      note: "walk-in หน้างาน",
      paymentMethod: "ONSITE",
    },
    {
      daysAgo: 1,
      courtId: courtA.id,
      startTime: "17:00",
      endTime: "18:00",
      customerName: "คุณอาร์ม",
      customerPhone: "0822222222",
      teamName: "Arm United",
      playerCount: 8,
      source: "ONLINE",
      status: "COMPLETED",
      listedPrice: 900,
      finalPrice: 900,
      note: "",
      paymentMethod: "PROMPTPAY",
    },
    {
      daysAgo: 2,
      courtId: courtB.id,
      startTime: "19:00",
      endTime: "20:30",
      customerName: "ทีมเสือดำ",
      customerPhone: "0811111111",
      teamName: "เสือดำ FC",
      playerCount: 11,
      source: "ONLINE",
      status: "COMPLETED",
      listedPrice: 1500,
      finalPrice: 1500,
      note: "",
      paymentMethod: "TRANSFER",
    },
    {
      daysAgo: 3,
      courtId: courtA.id,
      startTime: "21:00",
      endTime: "22:00",
      customerName: "ทีมตัวอย่าง",
      customerPhone: "0899999999",
      teamName: "Night League",
      playerCount: 10,
      source: "WALK_IN",
      status: "COMPLETED",
      listedPrice: 900,
      finalPrice: 900,
      note: "",
      paymentMethod: "ONSITE",
    },
    {
      daysAgo: 5,
      courtId: courtA.id,
      startTime: "18:00",
      endTime: "19:00",
      customerName: "คุณอาร์ม",
      customerPhone: "0822222222",
      teamName: "Arm United",
      playerCount: 9,
      source: "ONLINE",
      status: "COMPLETED",
      listedPrice: 900,
      finalPrice: 900,
      note: "",
      paymentMethod: "PROMPTPAY",
    },
    {
      daysAgo: 7,
      courtId: courtB.id,
      startTime: "16:00",
      endTime: "17:30",
      customerName: "ทีมเสือดำ",
      customerPhone: "0811111111",
      teamName: "เสือดำ FC",
      playerCount: 12,
      source: "ONLINE",
      status: "COMPLETED",
      listedPrice: 1500,
      finalPrice: 1350,
      note: "ส่วนลดลูกค้าประจำ",
      paymentMethod: "TRANSFER",
    },
  ];

  for (const spec of bookingSpecs) {
    await tx.footballTurfBooking.create({
      data: {
        ownerUserId,
        trialSessionId,
        courtId: spec.courtId,
        bookingDate: parseBookingDate(daysAgoIsoDate(spec.daysAgo)),
        startTime: spec.startTime,
        endTime: spec.endTime,
        customerName: spec.customerName,
        customerPhone: spec.customerPhone,
        teamName: spec.teamName,
        playerCount: spec.playerCount,
        source: spec.source,
        status: spec.status,
        listedPrice: spec.listedPrice,
        finalPrice: spec.finalPrice,
        note: spec.note,
        paymentMethod: spec.paymentMethod,
        paymentStatus: "PAID",
        paymentReference: spec.paymentMethod === "TRANSFER" ? `REF-FT-${spec.daysAgo}` : "",
        createdAt: daysAgoDateTime(spec.daysAgo, 10),
      },
    });
  }

  if (promo10) {
    await tx.footballTurfPromotionSale.create({
      data: {
        ownerUserId,
        trialSessionId,
        promotionId: promo10.id,
        promotionName: promo10.name,
        customerName: "ทีมเสือดำ",
        customerPhone: "0811111111",
        teamName: "เสือดำ FC",
        totalUses: promo10.totalUses,
        remainingUses: Math.max(1, promo10.totalUses - 3),
        price: promo10.price,
        status: "ACTIVE",
        paymentMethod: "TRANSFER",
        paymentStatus: "PAID",
        paymentReference: "PROMO-001",
        createdAt: daysAgoDateTime(4, 15),
      },
    });
  }

  if (catField) {
    await tx.footballTurfCostEntry.create({
      data: {
        ownerUserId,
        trialSessionId,
        categoryId: catField.id,
        spentAt: daysAgoDateTime(1, 9),
        amount: 1200,
        itemLabel: "เติมยางเม็ด + ดูแลพื้น",
        note: "ข้อมูลตัวอย่าง",
      },
    });
  }
  if (catUtility) {
    await tx.footballTurfCostEntry.create({
      data: {
        ownerUserId,
        trialSessionId,
        categoryId: catUtility.id,
        spentAt: daysAgoDateTime(3, 11),
        amount: 850,
        itemLabel: "ค่าไฟช่วงเย็น",
        note: "ข้อมูลตัวอย่าง",
      },
    });
    await tx.footballTurfCostEntry.create({
      data: {
        ownerUserId,
        trialSessionId,
        categoryId: catUtility.id,
        spentAt: daysAgoDateTime(6, 14),
        amount: 640,
        itemLabel: "ค่าน้ำประปา",
        note: "",
      },
    });
  }
}

export async function seedFootballTurfTrialData(
  tx: Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  await ensureFootballTurfProfile(ownerUserId, trialSessionId);
  await seedFootballTurfSampleActivity(tx, ownerUserId, trialSessionId);
}

export async function seedFootballTurfProdDemoForOwner(
  db: PrismaClient,
  ownerUserId: string,
): Promise<void> {
  await ensureFootballTurfProfile(ownerUserId, TRIAL_PROD_SCOPE);
  const n = await db.footballTurfBooking.count({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE },
  });
  if (n > 0) return;
  await db.$transaction((tx) => seedFootballTurfSampleActivity(tx, ownerUserId, TRIAL_PROD_SCOPE));
}
