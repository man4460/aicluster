import type { PrismaClient } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { ensureDefaultParkingSite, ensureSampleSpotsIfEmpty } from "@/systems/parking/lib/ensure-site";
import { ensureParkingIncomeCategories } from "@/systems/parking/lib/ensure-income-categories";
import {
  PARKING_PORTAL_SAMPLE_BANNER,
  PARKING_PORTAL_SAMPLE_GALLERY,
} from "@/systems/parking/lib/portal-media";

/** แถว demo — รันซ้ำได้ · ลบแล้วใส่ใหม่เมื่อ refreshDaily */
export const PARKING_DEMO_NOTE = "seed:parking-demo-v2";

const DEMO_OWNER_EMAILS = new Set(["user@mawell.local.com", "user@mawell.local"]);

const SAMPLE_PLATES = [
  "1กข 1234",
  "4ขค 5599",
  "2งจ 7788",
  "5คง 1122",
  "7บถ 3344",
  "9จป 5566",
  "3ดฟ 8899",
  "6ตภ 0011",
  "8ถศ 2233",
  "1ธษ 4455",
  "4ณโ 6677",
  "2บญ 9900",
] as const;

const EXTRA_SPOTS = [
  { spotCode: "A-04", zoneLabel: "โซน A", sortFloor: 1, sortOrder: 3 },
  { spotCode: "A-05", zoneLabel: "โซน A", sortFloor: 1, sortOrder: 4 },
  { spotCode: "A-06", zoneLabel: "โซน A", sortFloor: 1, sortOrder: 5 },
  { spotCode: "B-01", zoneLabel: "โซน B", sortFloor: 1, sortOrder: 10 },
  { spotCode: "B-02", zoneLabel: "โซน B", sortFloor: 1, sortOrder: 11 },
  { spotCode: "B-03", zoneLabel: "โซน B", sortFloor: 1, sortOrder: 12 },
] as const;

function bangkokDayBounds(ymd: string) {
  return {
    start: new Date(`${ymd}T00:00:00+07:00`),
    end: new Date(`${ymd}T23:59:59.999+07:00`),
    noon: new Date(`${ymd}T12:00:00+07:00`),
  };
}

function atBangkok(ymd: string, hour: number, minute = 0) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${ymd}T${hh}:${mm}:00+07:00`);
}

function phoneFor(i: number) {
  const tail = String(10000000 + ((i * 104729) % 90000000)).padStart(8, "0").slice(0, 8);
  return `08${tail}`;
}

async function ensureExtraSpots(prisma: PrismaClient, siteId: number) {
  const { newParkingCheckInToken } = await import("@/systems/parking/lib/parking-token");
  for (const row of EXTRA_SPOTS) {
    const exists = await prisma.parkingSpot.findFirst({
      where: { siteId, spotCode: row.spotCode },
      select: { id: true },
    });
    if (exists) continue;
    try {
      await prisma.parkingSpot.create({
        data: {
          siteId,
          spotCode: row.spotCode,
          zoneLabel: row.zoneLabel,
          sortFloor: row.sortFloor,
          sortOrder: row.sortOrder,
          checkInToken: newParkingCheckInToken(),
        },
      });
    } catch {
      /* race / unique */
    }
  }
}

const LEGACY_DEMO_NOTES = [PARKING_DEMO_NOTE, "seed:parking-history-v1"] as const;

async function clearParkingDemo(prisma: PrismaClient, ownerUserId: string, siteId: number) {
  await prisma.parkingSession.deleteMany({
    where: { internalNote: { in: [...LEGACY_DEMO_NOTES] }, spot: { siteId } },
  });
  await prisma.parkingBooking.deleteMany({
    where: {
      ownerUserId,
      trialSessionId: TRIAL_PROD_SCOPE,
      OR: [{ note: { in: [...LEGACY_DEMO_NOTES] } }, { customerName: { startsWith: "คุณทดลอง" } }],
    },
  });
  await prisma.parkingMembership.deleteMany({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE, customerName: { startsWith: "คุณทดลอง" } },
  });
  await prisma.parkingPackage.deleteMany({
    where: {
      ownerUserId,
      trialSessionId: TRIAL_PROD_SCOPE,
      OR: [
        { description: { contains: PARKING_DEMO_NOTE } },
        { description: { contains: "seed:parking" } },
        { name: { in: ["จอดเหมารายวัน", "เหมา 10 ครั้ง (รายวัน)"] } },
      ],
    },
  });
  await prisma.parkingCostEntry.deleteMany({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE, note: { in: [...LEGACY_DEMO_NOTES] } },
  });
  await prisma.parkingIncomeEntry.deleteMany({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE, note: { in: [...LEGACY_DEMO_NOTES] } },
  });
  const demoMembers = await prisma.parkingLoyaltyMember.findMany({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE, customerName: { startsWith: "คุณทดลอง" } },
    select: { id: true },
  });
  if (demoMembers.length > 0) {
    const ids = demoMembers.map((m) => m.id);
    await prisma.parkingLoyaltyLedger.deleteMany({ where: { memberId: { in: ids } } });
    await prisma.parkingLoyaltyMember.deleteMany({ where: { id: { in: ids } } });
  }
}

/**
 * เติมข้อมูลตัวอย่างครบเมนูจอดรถ (ภาพรวม · เช็คอิน · เช็คเอาต์ · จอง · แพ็ก · การเงิน · พอร์ทัล)
 * @param opts.refreshDaily — ลบ demo เก่าแล้วใส่ใหม่ตามวันนี้ (Asia/Bangkok) ค่าเริ่ม true
 */
export async function seedParkingProdDemoForOwner(
  prisma: PrismaClient,
  ownerUserId: string,
  opts?: { refreshDaily?: boolean },
): Promise<void> {
  const refresh = opts?.refreshDaily !== false;
  const today = bangkokDateKey();
  const tomorrow = bangkokDateKey(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const { start: todayStart } = bangkokDayBounds(today);

  let site = await ensureDefaultParkingSite(ownerUserId, TRIAL_PROD_SCOPE);
  await ensureSampleSpotsIfEmpty(site.id);
  await ensureExtraSpots(prisma, site.id);
  await ensureParkingIncomeCategories(ownerUserId, TRIAL_PROD_SCOPE);

  site = await prisma.parkingSite.update({
    where: { id: site.id },
    data: {
      name: site.name?.trim() || "ลานหลัก",
      pricingMode: "HOURLY",
      hourlyRateBaht: site.hourlyRateBaht ?? new Prisma.Decimal(20),
      dailyRateBaht: site.dailyRateBaht ?? new Prisma.Decimal(150),
      monthlyRateBaht: site.monthlyRateBaht ?? new Prisma.Decimal(2500),
      loyaltyEnabled: true,
      loyaltyBahtPerPoint: 100,
      loyaltyPointsPerUnit: 1,
      bookingPaymentMode: "DEPOSIT",
      depositPercent: 30,
      promptPayPhone: site.promptPayPhone ?? "0812345678",
      bankName: site.bankName ?? "กสิกรไทย",
      bankAccountNumber: site.bankAccountNumber ?? "123-4-56789-0",
      bankAccountName: site.bankAccountName ?? "ลานจอดมาเวล (ทดลอง)",
      contactPhone: site.contactPhone ?? "02-123-4567",
      tagline: site.tagline ?? "จอดสะดวก · ปลอดภัย · ใกล้รถไฟฟ้า",
      address: site.address ?? "99 ถนนตัวอย่าง แขวงทดลอง เขตสาทร กรุงเทพฯ 10120",
      lineId: site.lineId ?? "@mawell-parking",
      facebookUrl: site.facebookUrl ?? "https://facebook.com/mawell",
      mapUrl: site.mapUrl ?? "https://maps.google.com/?q=Bangkok",
      portalBannerUrl: site.portalBannerUrl ?? PARKING_PORTAL_SAMPLE_BANNER,
      portalGalleryJson:
        !site.portalGalleryJson || site.portalGalleryJson === "[]"
          ? JSON.stringify([...PARKING_PORTAL_SAMPLE_GALLERY])
          : site.portalGalleryJson,
      note: `ตัวอย่างลานจอด · ${PARKING_DEMO_NOTE} · ${today}`,
      isActive: true,
    },
  });

  if (refresh) {
    await clearParkingDemo(prisma, ownerUserId, site.id);
  } else {
    const existingToday = await prisma.parkingSession.count({
      where: {
        internalNote: PARKING_DEMO_NOTE,
        spot: { siteId: site.id },
        checkInAt: { gte: todayStart },
      },
    });
    if (existingToday > 0) return;
  }

  const spots = await prisma.parkingSpot.findMany({
    where: { siteId: site.id },
    orderBy: [{ sortFloor: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
  });
  if (spots.length === 0) return;

  const hourly = Number(site.hourlyRateBaht ?? 20);
  const daily = Number(site.dailyRateBaht ?? 150);

  /** แพ็กเกจ */
  const pkgDaily = await prisma.parkingPackage.create({
    data: {
      ownerUserId,
      trialSessionId: TRIAL_PROD_SCOPE,
      name: "จอดเหมารายวัน",
      price: daily,
      stayMode: "DAILY",
      stayUnits: 1,
      totalUses: 1,
      description: `แพ็กตัวอย่างรายวัน · ${PARKING_DEMO_NOTE}`,
      isActive: true,
    },
  });
  const pkgBundle = await prisma.parkingPackage.create({
    data: {
      ownerUserId,
      trialSessionId: TRIAL_PROD_SCOPE,
      name: "เหมา 10 ครั้ง (รายวัน)",
      price: daily * 9,
      stayMode: "DAILY",
      stayUnits: 1,
      totalUses: 10,
      description: `แพ็กเหมาตัวอย่าง · ${PARKING_DEMO_NOTE}`,
      isActive: true,
    },
  });

  await prisma.parkingMembership.createMany({
    data: [
      {
        ownerUserId,
        trialSessionId: TRIAL_PROD_SCOPE,
        customerName: "คุณทดลอง สมาชิก A",
        customerPhone: "0811111111",
        licensePlate: SAMPLE_PLATES[0]!,
        packageId: pkgBundle.id,
        packageName: pkgBundle.name,
        paidAmount: pkgBundle.price,
        totalUses: 10,
        usedUses: 2,
        isActive: true,
      },
      {
        ownerUserId,
        trialSessionId: TRIAL_PROD_SCOPE,
        customerName: "คุณทดลอง สมาชิก B",
        customerPhone: "0822222222",
        licensePlate: SAMPLE_PLATES[1]!,
        packageId: pkgBundle.id,
        packageName: pkgBundle.name,
        paidAmount: pkgBundle.price,
        totalUses: 10,
        usedUses: 8,
        isActive: true,
      },
    ],
  });

  /** กำลังจอด — แท็บเช็คเอาต์ / ภาพรวม */
  const activeCount = Math.min(3, spots.length);
  for (let i = 0; i < activeCount; i++) {
    const spot = spots[i]!;
    const hoursAgo = 1 + (i % 4);
    const checkIn = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    const due = Math.round(hourly * Math.max(1, hoursAgo));
    await prisma.parkingSession.create({
      data: {
        spotId: spot.id,
        status: "ACTIVE",
        checkInAt: checkIn,
        licensePlate: SAMPLE_PLATES[i % SAMPLE_PLATES.length]!,
        customerName: `คุณทดลอง จอดอยู่ ${i + 1}`,
        customerPhone: phoneFor(i),
        selfCheckIn: i % 2 === 0,
        pricingMode: "HOURLY",
        hourlyRateSnap: site.hourlyRateBaht,
        dailyRateSnap: site.dailyRateBaht,
        amountDueBaht: new Prisma.Decimal(due),
        amountPaidBaht: null,
        paymentMethod: null,
        internalNote: PARKING_DEMO_NOTE,
      },
    });
  }

  /** ประวัติวันนี้ + ย้อนหลัง — การเงิน / ประวัติ */
  for (let i = 0; i < 14; i++) {
    const spot = spots[(activeCount + i) % spots.length]!;
    const daysAgo = i === 0 ? 0 : 1 + (i % 10);
    const ymd =
      daysAgo === 0
        ? today
        : bangkokDateKey(new Date(todayStart.getTime() - daysAgo * 24 * 60 * 60 * 1000));
    const checkIn = atBangkok(ymd, 8 + (i % 8), (i * 7) % 60);
    const checkOut = new Date(checkIn.getTime() + (2 + (i % 5)) * 60 * 60 * 1000);
    const units = 2 + (i % 5);
    const amount = Math.round(hourly * units);
    await prisma.parkingSession.create({
      data: {
        spotId: spot.id,
        status: i % 13 === 0 ? "CANCELLED" : "COMPLETED",
        checkInAt: checkIn,
        checkOutAt: i % 13 === 0 ? null : checkOut,
        licensePlate: SAMPLE_PLATES[(i + 3) % SAMPLE_PLATES.length]!,
        customerName: `คุณทดลอง ประวัติ ${i + 1}`,
        customerPhone: phoneFor(20 + i),
        selfCheckIn: i % 3 === 0,
        pricingMode: "HOURLY",
        hourlyRateSnap: site.hourlyRateBaht,
        dailyRateSnap: site.dailyRateBaht,
        billedUnits: i % 13 === 0 ? null : units,
        amountDueBaht: i % 13 === 0 ? null : new Prisma.Decimal(amount),
        amountPaidBaht: i % 13 === 0 ? null : new Prisma.Decimal(amount),
        paymentMethod: i % 13 === 0 ? null : i % 2 === 0 ? "CASH" : "PROMPTPAY",
        pointsEarned: i % 13 === 0 ? 0 : Math.floor(amount / 100),
        memberPhone: phoneFor(20 + i),
        internalNote: PARKING_DEMO_NOTE,
      },
    });
  }

  /** จองวันนี้ / พรุ่งนี้ */
  const bookingRows = [
    {
      spot: spots[activeCount] ?? spots[0]!,
      plate: SAMPLE_PLATES[4]!,
      name: "คุณทดลอง จองวันนี้",
      phone: "0833333333",
      start: atBangkok(today, 16, 0),
      end: atBangkok(today, 22, 0),
      days: 1,
      paidRatio: 0.3,
    },
    {
      spot: spots[(activeCount + 1) % spots.length]!,
      plate: SAMPLE_PLATES[5]!,
      name: "คุณทดลอง จองพรุ่งนี้",
      phone: "0844444444",
      start: atBangkok(tomorrow, 9, 0),
      end: atBangkok(tomorrow, 18, 0),
      days: 1,
      paidRatio: 1,
    },
    {
      spot: null as (typeof spots)[0] | null,
      plate: SAMPLE_PLATES[6]!,
      name: "คุณทดลอง จอง 2 วัน",
      phone: "0855555555",
      start: atBangkok(tomorrow, 8, 0),
      end: atBangkok(bangkokDateKey(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)), 20, 0),
      days: 2,
      paidRatio: 0.3,
    },
  ];

  for (const row of bookingRows) {
    const amount = daily * row.days;
    const deposit = Math.round(amount * row.paidRatio);
    await prisma.parkingBooking.create({
      data: {
        ownerUserId,
        trialSessionId: TRIAL_PROD_SCOPE,
        siteId: site.id,
        spotId: row.spot?.id ?? null,
        licensePlate: row.plate,
        customerName: row.name,
        customerPhone: row.phone,
        packageId: pkgDaily.id,
        packageName: pkgDaily.name,
        scheduledStart: row.start,
        scheduledEnd: row.end,
        pricingMode: "DAILY",
        amountBaht: amount,
        amountPaidBaht: deposit,
        depositAmountBaht: deposit,
        paymentStatus: deposit >= amount ? "PAID" : deposit > 0 ? "PARTIAL" : "UNPAID",
        paymentMethod: deposit > 0 ? "PROMPTPAY" : null,
        status: "SCHEDULED",
        note: PARKING_DEMO_NOTE,
      },
    });
  }

  /** การเงิน — หมวด + รายรับ/รายจ่าย */
  let costCat = await prisma.parkingCostCategory.findFirst({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE },
    orderBy: { id: "asc" },
  });
  if (!costCat) {
    costCat = await prisma.parkingCostCategory.create({
      data: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE, name: "สาธารณูปโภค", sortOrder: 1 },
    });
    await prisma.parkingCostCategory.create({
      data: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE, name: "วัสดุ/อุปกรณ์", sortOrder: 2 },
    });
  }
  const costCats = await prisma.parkingCostCategory.findMany({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE },
    orderBy: { sortOrder: "asc" },
  });

  const customIncome = await prisma.parkingIncomeCategory.findFirst({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE, kind: "CUSTOM", isBuiltin: false },
    orderBy: { sortOrder: "asc" },
  });

  for (let i = 0; i < 5; i++) {
    const ymd = bangkokDateKey(new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000));
    const cat = costCats[i % costCats.length]!;
    await prisma.parkingCostEntry.create({
      data: {
        ownerUserId,
        trialSessionId: TRIAL_PROD_SCOPE,
        categoryId: cat.id,
        spentAt: atBangkok(ymd, 14, 30),
        amountBaht: 200 + i * 85,
        label: i % 2 === 0 ? "ค่าไฟลานจอด" : "น้ำยาทำความสะอาด",
        note: PARKING_DEMO_NOTE,
        paymentSlipUrl: "",
      },
    });
  }

  if (customIncome) {
    for (let i = 0; i < 3; i++) {
      const ymd = bangkokDateKey(new Date(todayStart.getTime() - i * 2 * 24 * 60 * 60 * 1000));
      await prisma.parkingIncomeEntry.create({
        data: {
          ownerUserId,
          trialSessionId: TRIAL_PROD_SCOPE,
          categoryId: customIncome.id,
          label: i === 0 ? "ค่าบริการล้างรถเพิ่ม" : `รายรับอื่น ${i + 1}`,
          amountBaht: 150 + i * 50,
          earnedAt: atBangkok(ymd, 11, 0),
          note: PARKING_DEMO_NOTE,
        },
      });
    }
  }

  /** สะสมคะแนน */
  for (let i = 0; i < 4; i++) {
    const phone = phoneFor(40 + i);
    const member = await prisma.parkingLoyaltyMember.create({
      data: {
        ownerUserId,
        trialSessionId: TRIAL_PROD_SCOPE,
        phone,
        customerName: `คุณทดลอง คะแนน ${i + 1}`,
        pointsBalance: 50 + i * 25,
        totalEarned: 80 + i * 30,
        totalRedeemed: 30 + i * 5,
      },
    });
    await prisma.parkingLoyaltyLedger.create({
      data: {
        ownerUserId,
        trialSessionId: TRIAL_PROD_SCOPE,
        memberId: member.id,
        kind: "EARN",
        pointsDelta: 20 + i * 5,
        balanceAfter: member.pointsBalance,
        note: PARKING_DEMO_NOTE,
      },
    });
  }
}

/**
 * สำหรับบัญชี demo — รีเฟรชข้อมูลจอดรถให้เป็นวันนี้เมื่อยังไม่มี demo ของวันนี้
 */
export async function ensureParkingDemoFreshForOwner(
  prisma: PrismaClient,
  ownerUserId: string,
  ownerEmail?: string | null,
): Promise<void> {
  if (ownerEmail && !DEMO_OWNER_EMAILS.has(ownerEmail)) return;
  if (!ownerEmail) {
    const user = await prisma.user.findUnique({ where: { id: ownerUserId }, select: { email: true } });
    if (!user || !DEMO_OWNER_EMAILS.has(user.email)) return;
  }

  const today = bangkokDateKey();
  const { start: todayStart } = bangkokDayBounds(today);
  const site = await prisma.parkingSite.findFirst({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE },
    select: { id: true },
  });
  if (!site) {
    await seedParkingProdDemoForOwner(prisma, ownerUserId, { refreshDaily: true });
    return;
  }

  const todayDemo = await prisma.parkingSession.count({
    where: {
      internalNote: PARKING_DEMO_NOTE,
      spot: { siteId: site.id },
      checkInAt: { gte: todayStart },
    },
  });
  if (todayDemo > 0) return;

  await seedParkingProdDemoForOwner(prisma, ownerUserId, { refreshDaily: true });
}
