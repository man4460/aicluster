import { prisma } from "@/lib/prisma";
import { startTrial } from "@/lib/trial/trial-service";
import { listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";

const DORM_MODULE_SLUG = "dormitory";
const FALLBACK_TRIAL_EMAILS = ["admin@mawell.local", "user@mawell.local", "user@mawell.local.com"] as const;
const COST_CATEGORIES = ["ค่าน้ำ-ไฟส่วนกลาง", "ซ่อมบำรุง", "ค่าดูแลอาคาร"] as const;

function thaiNowMonthKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }).slice(0, 7);
}

function previousMonthKey(ym: string) {
  const d = new Date(`${ym}-01T00:00:00+07:00`);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthParts(ym: string) {
  return { y: Number(ym.slice(0, 4)), m: Number(ym.slice(5, 7)) };
}

async function ensureDormProfile(ownerUserId: string, trialSessionId: string) {
  const existing = await prisma.dormitoryProfile.findFirst({
    where: { ownerUserId, trialSessionId },
    select: { id: true },
  });
  if (existing) return;
  await prisma.dormitoryProfile.create({
    data: {
      ownerUserId,
      trialSessionId,
      displayName: "หอพักตัวอย่าง (ทดลอง)",
      defaultPaperSize: "SLIP_58",
      paymentChannelsNote: "โอนธนาคาร / พร้อมเพย์",
    },
  });
}

async function ensureCostCategories(ownerUserId: string, trialSessionId: string) {
  const map = new Map<string, number>();
  for (const name of COST_CATEGORIES) {
    const found = await prisma.dormitoryCostCategory.findFirst({
      where: { ownerUserId, trialSessionId, name },
      select: { id: true },
    });
    if (found) {
      map.set(name, found.id);
      continue;
    }
    const created = await prisma.dormitoryCostCategory.create({
      data: { ownerUserId, trialSessionId, name },
      select: { id: true },
    });
    map.set(name, created.id);
  }
  return map;
}

async function ensureTrialDormData(ownerUserId: string, trialSessionId: string) {
  await ensureDormProfile(ownerUserId, trialSessionId);
  const catIds = await ensureCostCategories(ownerUserId, trialSessionId);

  const ymNow = thaiNowMonthKey();
  const ymPrev = previousMonthKey(ymNow);
  const current = monthParts(ymNow);
  const prev = monthParts(ymPrev);

  for (let i = 1; i <= 20; i += 1) {
    const roomNumber = `${Math.floor((i - 1) / 5) + 1}${String(((i - 1) % 5) + 1).padStart(2, "0")}`;
    const floor = Math.floor((i - 1) / 5) + 1;
    const basePrice = 3200 + (i % 4) * 250;
    const occupied = i % 5 !== 0;

    const room = await prisma.room.upsert({
      where: {
        ownerUserId_roomNumber_trialSessionId: {
          ownerUserId,
          roomNumber,
          trialSessionId,
        },
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

    const existedTenant = await prisma.tenant.findFirst({
      where: { roomId: room.id, status: "ACTIVE" },
    });
    const tenant =
      existedTenant ??
      (await prisma.tenant.create({
        data: {
          roomId: room.id,
          name: `ผู้เช่าทดลอง ${roomNumber}`,
          phone: `08${String(10000000 + i).slice(0, 8)}`,
          idCard: `${String(1100000000000 + i).slice(0, 13)}`,
          status: "ACTIVE",
          checkInDate: new Date(current.y, current.m - 1, 1),
        },
      }));

    const billPrev = await prisma.utilityBill.upsert({
      where: { roomId_billingYear_billingMonth: { roomId: room.id, billingYear: prev.y, billingMonth: prev.m } },
      update: {
        totalRoomAmount: basePrice + 450,
      },
      create: {
        roomId: room.id,
        billingYear: prev.y,
        billingMonth: prev.m,
        waterMeterPrev: 100 + i * 2,
        waterMeterCurr: 106 + i * 2,
        electricMeterPrev: 1500 + i * 20,
        electricMeterCurr: 1590 + i * 20,
        waterPrice: 18,
        electricPrice: 8,
        fixedFees: [{ label: "ค่าส่วนกลาง", amount: 200 }],
        totalRoomAmount: basePrice + 450,
      },
    });
    const billNow = await prisma.utilityBill.upsert({
      where: { roomId_billingYear_billingMonth: { roomId: room.id, billingYear: current.y, billingMonth: current.m } },
      update: {
        totalRoomAmount: basePrice + 520,
      },
      create: {
        roomId: room.id,
        billingYear: current.y,
        billingMonth: current.m,
        waterMeterPrev: 106 + i * 2,
        waterMeterCurr: 112 + i * 2,
        electricMeterPrev: 1590 + i * 20,
        electricMeterCurr: 1685 + i * 20,
        waterPrice: 18,
        electricPrice: 8,
        fixedFees: [{ label: "ค่าบริการส่วนกลาง", amount: 250 }],
        totalRoomAmount: basePrice + 520,
      },
    });

    await prisma.splitBillPayment.upsert({
      where: { tenantId_billId: { tenantId: tenant.id, billId: billPrev.id } },
      update: {
        amountToPay: basePrice + 450,
        paymentStatus: "PAID",
        paidAt: new Date(`${ymPrev}-08T12:00:00+07:00`),
      },
      create: {
        tenantId: tenant.id,
        billId: billPrev.id,
        amountToPay: basePrice + 450,
        paymentStatus: "PAID",
        paidAt: new Date(`${ymPrev}-08T12:00:00+07:00`),
      },
    });

    const nowStatus: "PENDING" | "PAID" | "OVERDUE" =
      i % 6 === 0 ? "OVERDUE" : i % 3 === 0 ? "PAID" : "PENDING";
    await prisma.splitBillPayment.upsert({
      where: { tenantId_billId: { tenantId: tenant.id, billId: billNow.id } },
      update: {
        amountToPay: basePrice + 520,
        paymentStatus: nowStatus,
        paidAt: nowStatus === "PAID" ? new Date(`${ymNow}-10T14:30:00+07:00`) : null,
      },
      create: {
        tenantId: tenant.id,
        billId: billNow.id,
        amountToPay: basePrice + 520,
        paymentStatus: nowStatus,
        paidAt: nowStatus === "PAID" ? new Date(`${ymNow}-10T14:30:00+07:00`) : null,
      },
    });
  }

  const costSeeds = [
    { ym: ymPrev, day: 7, category: "ค่าน้ำ-ไฟส่วนกลาง", item: "ค่าไฟพื้นที่ส่วนกลาง", amount: 4300 },
    { ym: ymPrev, day: 19, category: "ซ่อมบำรุง", item: "ซ่อมปั๊มน้ำ", amount: 2100 },
    { ym: ymNow, day: 5, category: "ค่าดูแลอาคาร", item: "ค่าดูแลอาคารรายเดือน", amount: 3500 },
    { ym: ymNow, day: 14, category: "ค่าน้ำ-ไฟส่วนกลาง", item: "ค่าน้ำพื้นที่ส่วนกลาง", amount: 1700 },
    { ym: ymNow, day: 23, category: "ซ่อมบำรุง", item: "เปลี่ยนอุปกรณ์ไฟทางเดิน", amount: 2400 },
  ] as const;

  for (const row of costSeeds) {
    const categoryId = catIds.get(row.category);
    if (!categoryId) continue;
    const spentAt = new Date(`${row.ym}-${String(row.day).padStart(2, "0")}T10:00:00+07:00`);
    const existing = await prisma.dormitoryCostEntry.findFirst({
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
    await prisma.dormitoryCostEntry.create({
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
}

async function main() {
  const dormModule = await prisma.appModule.findFirst({
    where: { slug: DORM_MODULE_SLUG },
    select: { id: true },
  });
  if (!dormModule) {
    console.log("Dormitory module not found.");
    return;
  }

  let sessions = await prisma.trialSession.findMany({
    where: {
      moduleId: dormModule.id,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    select: { id: true, userId: true, user: { select: { email: true } } },
  });

  if (sessions.length === 0) {
    const users = await prisma.user.findMany({
      where: { email: { in: [...FALLBACK_TRIAL_EMAILS] } },
      select: { id: true, email: true },
    });
    for (const user of users) {
      await startTrial(user.id, dormModule.id);
      console.log(`Started dormitory trial for ${user.email ?? user.id}`);
    }
    sessions = await prisma.trialSession.findMany({
      where: {
        moduleId: dormModule.id,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
        userId: { in: users.map((u) => u.id) },
      },
      select: { id: true, userId: true, user: { select: { email: true } } },
    });
    if (sessions.length === 0) {
      console.log("No active dormitory trial sessions found after starting trial.");
      return;
    }
  }

  for (const s of sessions) {
    await ensureTrialDormData(s.userId, s.id);
    console.log(`Seeded dorm trial data (20 rooms + revenue + costs) for ${s.user.email ?? s.userId}`);
  }

  const fallbackUsers = await prisma.user.findMany({
    where: { email: { in: [...FALLBACK_TRIAL_EMAILS] } },
    select: { id: true, email: true },
  });
  for (const user of fallbackUsers) {
    const subscribed = (await listSubscribedModuleIds(user.id)).includes(dormModule.id);
    if (!subscribed) continue;
    await ensureTrialDormData(user.id, "prod");
    console.log(`Seeded dorm prod data (visibility for subscribed user) for ${user.email ?? user.id}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

