import type { PrismaClient } from "@/generated/prisma/client";
import { bangkokDateKey, bangkokNowMinutes } from "@/lib/time/bangkok";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { ensureFootballTurfProfile } from "@/systems/football-turf/lib/ensure-profile";
import { parseBookingDate } from "@/systems/football-turf/lib/mappers";
import { minutesToTime, timeToMinutes } from "@/systems/football-turf/lib/time-queue";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

function daysAgoIsoDate(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return bangkokDateKey(d);
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
      paymentMethod: "TRANSFER",
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
      paymentMethod: "TRANSFER",
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

function liveDemoWindow(openHm: string, closeHm: string, slotMinutes: number) {
  const open = timeToMinutes(openHm);
  const close = timeToMinutes(closeHm);
  const slot = Math.max(30, slotMinutes || 60);
  let nowM = bangkokNowMinutes();
  if (nowM < open) nowM = open;
  if (nowM >= close) nowM = Math.max(open, close - slot);
  const start = Math.floor((nowM - open) / slot) * slot + open;
  const end = Math.min(start + slot, close);
  const nextStart = end < close ? end : null;
  const nextEnd = nextStart != null ? Math.min(nextStart + slot, close) : null;
  return {
    start: minutesToTime(start),
    end: minutesToTime(end),
    nextStart: nextStart != null ? minutesToTime(nextStart) : null,
    nextEnd: nextEnd != null ? minutesToTime(nextEnd) : null,
  };
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(aEnd) > timeToMinutes(bStart);
}

const LIVE_OVERVIEW_NOTE = "ตัวอย่างภาพรวมสด";

/**
 * ใส่จองวันนี้ตามช่วงเวลาปัจจุบัน (เล่นอยู่ / จองต่อ / รอเช็กอิน)
 * เพื่อให้การ์ดภาพรวมมีปุ่มเช็กอิน·ปิดรอบทดสอบได้ — รันซ้ำได้โดยไม่ซ้อนถ้ามีโน้ต marker วันนี้แล้ว
 */
export async function seedFootballTurfLiveOverviewBookings(
  db: PrismaClient | Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  const tx = db;
  const todayKey = daysAgoIsoDate(0);
  const todayDate = parseBookingDate(todayKey);

  const already = await tx.footballTurfBooking.count({
    where: {
      ownerUserId,
      trialSessionId,
      bookingDate: todayDate,
      note: LIVE_OVERVIEW_NOTE,
      status: { not: "CANCELLED" },
    },
  });
  if (already > 0) return;

  const courts = await tx.footballTurfCourt.findMany({
    where: { ownerUserId, trialSessionId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  if (courts.length === 0) return;

  const courtA = courts[0]!;
  const courtB = courts[1] ?? courts[0]!;
  const winA = liveDemoWindow(courtA.openTime, courtA.closeTime, courtA.slotMinutes);
  const winB = liveDemoWindow(courtB.openTime, courtB.closeTime, courtB.slotMinutes);

  const existingToday = await tx.footballTurfBooking.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      bookingDate: todayDate,
      status: { not: "CANCELLED" },
    },
    select: { courtId: true, startTime: true, endTime: true },
  });

  async function createFree(input: {
    courtId: number;
    startTime: string;
    endTime: string;
    customerName: string;
    customerPhone: string;
    teamName: string;
    source: string;
    status: string;
    listedPrice: number;
    paymentMethod: string;
  }) {
    const clash = existingToday.some(
      (row) =>
        row.courtId === input.courtId &&
        rangesOverlap(row.startTime, row.endTime, input.startTime, input.endTime),
    );
    if (clash) return;
    await tx.footballTurfBooking.create({
      data: {
        ownerUserId,
        trialSessionId,
        courtId: input.courtId,
        bookingDate: todayDate,
        startTime: input.startTime,
        endTime: input.endTime,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        teamName: input.teamName,
        playerCount: 10,
        source: input.source,
        status: input.status,
        listedPrice: input.listedPrice,
        finalPrice: input.listedPrice,
        note: LIVE_OVERVIEW_NOTE,
        paymentMethod: input.paymentMethod,
        paymentStatus: "PAID",
        paymentReference: input.paymentMethod === "TRANSFER" ? "REF-LIVE" : "",
        createdAt: new Date(),
      },
    });
    existingToday.push({
      courtId: input.courtId,
      startTime: input.startTime,
      endTime: input.endTime,
    });
  }

  await createFree({
    courtId: courtA.id,
    startTime: winA.start,
    endTime: winA.end,
    customerName: "ทีมเสือดำ",
    customerPhone: "0811111111",
    teamName: "เสือดำ FC",
    source: "WALK_IN",
    status: "PLAYING",
    listedPrice: courtA.weekdayPrice,
    paymentMethod: "ONSITE",
  });

  if (winA.nextStart && winA.nextEnd) {
    await createFree({
      courtId: courtA.id,
      startTime: winA.nextStart,
      endTime: winA.nextEnd,
      customerName: "คุณอาร์ม",
      customerPhone: "0822222222",
      teamName: "Arm United",
      source: "ONLINE",
      status: "BOOKED",
      listedPrice: courtA.weekdayPrice,
      paymentMethod: "TRANSFER",
    });
  }

  if (courtB.id !== courtA.id) {
    await createFree({
      courtId: courtB.id,
      startTime: winB.start,
      endTime: winB.end,
      customerName: "ทีมตัวอย่าง",
      customerPhone: "0899999999",
      teamName: "Night League",
      source: "ONLINE",
      status: "BOOKED",
      listedPrice: courtB.weekdayPrice,
      paymentMethod: "TRANSFER",
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
  await seedFootballTurfLiveOverviewBookings(tx, ownerUserId, trialSessionId);
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
  await db.$transaction(async (tx) => {
    await seedFootballTurfSampleActivity(tx, ownerUserId, TRIAL_PROD_SCOPE);
    await seedFootballTurfLiveOverviewBookings(tx, ownerUserId, TRIAL_PROD_SCOPE);
  });
}
