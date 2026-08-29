import type { PrismaClient } from "@/generated/prisma/client";
import { bangkokDateKey, bangkokNowMinutes } from "@/lib/time/bangkok";
import {
  bangkokDateKeyMinusDays,
  bangkokDayStartEnd,
  bangkokDayStartEndForDateKey,
} from "@/lib/massage/bangkok-day";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

type DbLike = PrismaClient | Tx;

/** หมายเหตุแถวที่ระบบใส่ให้อัตโนมัติ — ลบ/รีเฟรชได้โดยไม่แตะข้อมูลที่ผู้ใช้สร้าง */
export const MASSAGE_LIVE_DEMO_NOTE = "ตัวอย่างอัตโนมัติ";

/** รูปตัวอย่างสำหรับ sandbox เท่านั้น — โหลดจาก CDN สาธารณะ */
function trialPhoto(seed: string, w: number, h: number): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

/** วันที่ + ชั่วโมงไทย → Date (กลางวัน/ช่วงเปิดร้าน) */
function bangkokDateTime(dateKey: string, hour: number, minute = 0): Date {
  const hh = String(Math.max(0, Math.min(23, hour))).padStart(2, "0");
  const mm = String(Math.max(0, Math.min(59, minute))).padStart(2, "0");
  return new Date(`${dateKey}T${hh}:${mm}:00+07:00`);
}

function clampHourAroundNow(offsetHours: number, fallbackHour: number): { hour: number; minute: number } {
  const nowMin = bangkokNowMinutes();
  const target = nowMin + offsetHours * 60;
  if (target < 8 * 60 || target > 21 * 60) {
    return { hour: fallbackHour, minute: 0 };
  }
  const h = Math.floor(target / 60);
  const m = Math.floor((target % 60) / 15) * 15;
  return { hour: h, minute: m };
}

const PACKAGE_DEFS = [
  { name: "นวดไทย 10 ครั้ง", price: 3500, totalSessions: 10 },
  { name: "นวดน้ำมันอโรมา 8 ครั้ง", price: 4800, totalSessions: 8 },
  { name: "นวดเท้า 12 ครั้ง", price: 2400, totalSessions: 12 },
  { name: "ประคบสมุนไพร 6 ครั้ง", price: 2700, totalSessions: 6 },
  { name: "แพ็กผ่อนคลายพรีเมียม 5 ครั้ง", price: 5500, totalSessions: 5 },
] as const;

const THERAPIST_DEFS = [
  { name: "พี่สมหญิง หมอนวดไทย", phone: "0812223001" },
  { name: "พี่มาลี นวดน้ำมัน", phone: "0812223002" },
  { name: "น้องน้ำฝน นวดเท้า", phone: "0812223003" },
  { name: "พี่วิไล ประคบสมุนไพร", phone: "0812223004" },
  { name: "พี่กานต์ ผ่อนคลาย", phone: "0812223005" },
] as const;

const CUSTOMER_DEFS = [
  { phone: "0897772001", name: "คุณแพร" },
  { phone: "0897772002", name: "คุณต้น" },
  { phone: "0897772003", name: "คุณมาย" },
  { phone: "0897772004", name: "คุณนิว" },
  { phone: "0897772005", name: "คุณฟ้า" },
] as const;

const COST_CATEGORIES = ["น้ำมันนวด / สมุนไพร", "ค่าสาธารณูปโภค", "ผ้าขนหนู / วัสดุสิ้นเปลือง"] as const;

const COST_ENTRIES = [
  { label: "น้ำมันนวดอโรมากลอน", amount: 890 },
  { label: "สมุนไพรประคบชุดใหญ่", amount: 650 },
  { label: "ค่าไฟเดือนนี้", amount: 3200 },
  { label: "ผ้าขนหนูผืนใหญ่", amount: 1200 },
  { label: "โปรโมทเพจร้านนวด", amount: 1500 },
] as const;

const BARBERISH_PACKAGE_FRAGMENTS = ["ตัด", "ทำสี", "นักเรียน", "สระ", "โกน"] as const;

async function ensureMassageCatalog(tx: DbLike, ownerUserId: string, trialSessionId: string) {
  let profile = await tx.massageShopProfile.findFirst({
    where: { ownerUserId, trialSessionId },
  });
  if (!profile) {
    profile = await tx.massageShopProfile.create({
      data: {
        ownerUserId,
        trialSessionId,
        displayName: "MAWELL Massage Studio (ทดลอง)",
        logoUrl: trialPhoto("massage-trial-logo-v2", 160, 160),
        contactPhone: "0890002233",
        promptPayPhone: "0890002233",
        address: "88/12 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย กทม. 10110",
        taxId: "0123456789012",
        bankName: "กสิกรไทย",
        bankAccountNumber: "123-4-56789-0",
        bankAccountName: "หจก.มาเวล นวดเพื่อสุขภาพ",
        defaultSlotMinutes: 60,
      },
    });
  }

  let packages = await tx.massagePackage.findMany({
    where: { ownerUserId, trialSessionId },
    orderBy: { id: "asc" },
  });
  if (packages.length === 0) {
    packages = await Promise.all(
      PACKAGE_DEFS.map((p) =>
        tx.massagePackage.create({
          data: {
            ownerUserId,
            trialSessionId,
            name: p.name,
            price: p.price,
            totalSessions: p.totalSessions,
          },
        }),
      ),
    );
  }

  let therapists = await tx.massageTherapist.findMany({
    where: { ownerUserId, trialSessionId },
    orderBy: { id: "asc" },
  });
  if (therapists.length === 0) {
    therapists = await Promise.all(
      THERAPIST_DEFS.map((s, i) =>
        tx.massageTherapist.create({
          data: {
            ownerUserId,
            trialSessionId,
            name: s.name,
            phone: s.phone,
            photoUrl: trialPhoto(`massage-trial-therapist-v2-${i}`, 280, 280),
            isActive: true,
          },
        }),
      ),
    );
  }

  let customers = await tx.massageCustomer.findMany({
    where: { ownerUserId, trialSessionId },
    orderBy: { id: "asc" },
  });
  if (customers.length === 0) {
    customers = await Promise.all(
      CUSTOMER_DEFS.map((c) =>
        tx.massageCustomer.create({
          data: {
            ownerUserId,
            trialSessionId,
            phone: c.phone,
            name: c.name,
          },
        }),
      ),
    );
  }

  let categories = await tx.massageCostCategory.findMany({
    where: { ownerUserId, trialSessionId },
    orderBy: { id: "asc" },
  });
  if (categories.length === 0) {
    categories = await Promise.all(
      COST_CATEGORIES.map((name) =>
        tx.massageCostCategory.create({
          data: { ownerUserId, trialSessionId, name },
        }),
      ),
    );
  }

  return { profile, packages, therapists, customers, categories };
}

async function ensureTodaySchedule(tx: DbLike, ownerUserId: string, trialSessionId: string) {
  const todayKey = bangkokDateKey();
  const scheduleDate = new Date(`${todayKey}T12:00:00+07:00`);
  await tx.massageDaySchedule.upsert({
    where: {
      ownerUserId_trialSessionId_scheduleDate: {
        ownerUserId,
        trialSessionId,
        scheduleDate,
      },
    },
    create: {
      ownerUserId,
      trialSessionId,
      scheduleDate,
      openTime: "09:00",
      closeTime: "21:00",
      slotMinutes: 60,
      isClosed: false,
    },
    update: {},
  });
}

/**
 * ใส่กิจกรรมวันนี้ (คิว + ประวัติบริการ) ตามเวลาไทยปัจจุบัน
 * — เรียกเมื่อยังไม่มีข้อมูลวันนี้ หรือ force รีเฟรชแถวตัวอย่าง
 */
export async function seedMassageLiveTodayActivity(
  db: DbLike,
  ownerUserId: string,
  trialSessionId: string,
  opts?: { force?: boolean },
): Promise<void> {
  const catalog = await ensureMassageCatalog(db, ownerUserId, trialSessionId);
  await ensureTodaySchedule(db, ownerUserId, trialSessionId);

  const { start, end } = bangkokDayStartEnd();
  const todayKey = bangkokDateKey();

  if (opts?.force) {
    await db.massageServiceLog.deleteMany({
      where: {
        ownerUserId,
        trialSessionId,
        createdAt: { gte: start, lt: end },
        note: MASSAGE_LIVE_DEMO_NOTE,
      },
    });
    await db.massageBooking.deleteMany({
      where: {
        ownerUserId,
        trialSessionId,
        scheduledAt: { gte: start, lt: end },
        note: MASSAGE_LIVE_DEMO_NOTE,
      },
    });
  }

  const todayLogs = await db.massageServiceLog.count({
    where: { ownerUserId, trialSessionId, createdAt: { gte: start, lt: end } },
  });
  const todayBookings = await db.massageBooking.count({
    where: { ownerUserId, trialSessionId, scheduledAt: { gte: start, lt: end } },
  });

  const { packages, therapists, customers } = catalog;
  if (packages.length === 0 || therapists.length === 0 || customers.length === 0) return;

  /** สมาชิกแพ็ก ACTIVE สำหรับหักวันนี้ */
  let activeSubs = await db.massageCustomerSubscription.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      status: "ACTIVE",
      remainingSessions: { gt: 0 },
    },
    orderBy: { id: "asc" },
    take: 3,
  });

  if (activeSubs.length === 0) {
    const subStatuses = ["ACTIVE", "ACTIVE", "ACTIVE", "EXHAUSTED", "CANCELLED"] as const;
    activeSubs = [];
    for (let i = 0; i < customers.length; i += 1) {
      const customer = customers[i]!;
      const pkg = packages[i % packages.length]!;
      const therapist = therapists[i % therapists.length]!;
      const st = subStatuses[i]!;
      const remaining =
        st === "ACTIVE" ? Math.max(2, pkg.totalSessions - i - 1) : st === "EXHAUSTED" ? 0 : 2;
      const sub = await db.massageCustomerSubscription.create({
        data: {
          ownerUserId,
          trialSessionId,
          massageCustomerId: customer.id,
          packageId: pkg.id,
          soldByTherapistId: therapist.id,
          remainingSessions: remaining,
          status: st,
          saleReceiptImageUrl: i % 2 === 0 ? trialPhoto(`massage-trial-sale-v2-${i}`, 480, 640) : null,
        },
      });
      if (st === "ACTIVE") activeSubs.push(sub);
    }
  }

  if (todayLogs === 0 || opts?.force) {
    const pastA = clampHourAroundNow(-3, 10);
    const pastB = clampHourAroundNow(-1.5, 12);
    const pastC = clampHourAroundNow(-0.5, 14);

    const logSpecs: Array<{
      hour: number;
      minute: number;
      visitType: "PACKAGE_USE" | "CASH_WALK_IN";
      amountBaht?: number;
      customerIdx: number;
      therapistIdx: number;
      subIdx?: number;
    }> = [
      {
        hour: pastA.hour,
        minute: pastA.minute,
        visitType: "PACKAGE_USE",
        customerIdx: 0,
        therapistIdx: 0,
        subIdx: 0,
      },
      {
        hour: pastB.hour,
        minute: pastB.minute,
        visitType: "CASH_WALK_IN",
        amountBaht: 450,
        customerIdx: 1,
        therapistIdx: 1,
      },
      {
        hour: pastC.hour,
        minute: pastC.minute,
        visitType: "PACKAGE_USE",
        customerIdx: 2,
        therapistIdx: 2,
        subIdx: 1,
      },
    ];

    for (const spec of logSpecs) {
      const customer = customers[spec.customerIdx % customers.length]!;
      const therapist = therapists[spec.therapistIdx % therapists.length]!;
      const sub =
        spec.visitType === "PACKAGE_USE" && activeSubs.length > 0
          ? activeSubs[(spec.subIdx ?? 0) % activeSubs.length]!
          : null;
      await db.massageServiceLog.create({
        data: {
          ownerUserId,
          trialSessionId,
          subscriptionId: sub?.id ?? null,
          massageCustomerId: customer.id,
          visitType: spec.visitType,
          therapistId: therapist.id,
          amountBaht: spec.amountBaht ?? null,
          receiptImageUrl:
            spec.visitType === "CASH_WALK_IN"
              ? trialPhoto(`massage-live-cash-${spec.hour}`, 480, 640)
              : null,
          note: MASSAGE_LIVE_DEMO_NOTE,
          createdAt: bangkokDateTime(todayKey, spec.hour, spec.minute),
        },
      });
    }

    /** ขายแพ็กใหม่วันนี้ — ให้กราฟรายรับขายแพ็กไม่ว่าง */
    const buyer = customers[3 % customers.length]!;
    const pkgNew = packages[0]!;
    const seller = therapists[0]!;
    const existingNewSale = await db.massageCustomerSubscription.findFirst({
      where: {
        ownerUserId,
        trialSessionId,
        massageCustomerId: buyer.id,
        packageId: pkgNew.id,
        createdAt: { gte: start, lt: end },
      },
    });
    if (!existingNewSale) {
      await db.massageCustomerSubscription.create({
        data: {
          ownerUserId,
          trialSessionId,
          massageCustomerId: buyer.id,
          packageId: pkgNew.id,
          soldByTherapistId: seller.id,
          remainingSessions: pkgNew.totalSessions,
          status: "ACTIVE",
          saleReceiptImageUrl: trialPhoto("massage-live-new-sale", 480, 640),
          createdAt: bangkokDateTime(todayKey, pastA.hour, 15),
        },
      });
    }
  }

  if (todayBookings === 0 || opts?.force) {
    const slotPast = clampHourAroundNow(-2, 11);
    const slotNow = clampHourAroundNow(0, 15);
    const slotSoon = clampHourAroundNow(1.5, 17);
    const slotLater = clampHourAroundNow(3, 19);

    const bookingSpecs: Array<{
      hour: number;
      minute: number;
      status: "ARRIVED" | "IN_SERVICE" | "SCHEDULED" | "SCHEDULED";
      customerIdx: number;
      therapistIdx: number;
    }> = [
      {
        hour: slotPast.hour,
        minute: slotPast.minute,
        status: "ARRIVED",
        customerIdx: 0,
        therapistIdx: 0,
      },
      {
        hour: slotNow.hour,
        minute: slotNow.minute,
        status: "IN_SERVICE",
        customerIdx: 1,
        therapistIdx: 1,
      },
      {
        hour: slotSoon.hour,
        minute: slotSoon.minute,
        status: "SCHEDULED",
        customerIdx: 2,
        therapistIdx: 2,
      },
      {
        hour: slotLater.hour,
        minute: slotLater.minute,
        status: "SCHEDULED",
        customerIdx: 3,
        therapistIdx: 3,
      },
    ];

    for (const spec of bookingSpecs) {
      const customer = customers[spec.customerIdx % customers.length]!;
      const therapist = therapists[spec.therapistIdx % therapists.length]!;
      await db.massageBooking.create({
        data: {
          ownerUserId,
          trialSessionId,
          massageCustomerId: customer.id,
          therapistId: therapist.id,
          phone: customer.phone,
          customerName: customer.name,
          scheduledAt: bangkokDateTime(todayKey, spec.hour, spec.minute),
          durationMinutes: 60,
          status: spec.status,
          note: MASSAGE_LIVE_DEMO_NOTE,
        },
      });
    }
  }
}

/**
 * ข้อมูลตัวอย่างร้านนวด (~5 แถวต่อเมนูหลัก + กิจกรรมวันนี้ตามเวลาไทย)
 * เรียกเมื่อเริ่ม trial หรือรีเฟรช demo
 */
export async function seedMassageTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  await ensureMassageCatalog(tx, ownerUserId, trialSessionId);

  const todayKey = bangkokDateKey();
  const { packages, therapists, customers, categories } = await ensureMassageCatalog(
    tx,
    ownerUserId,
    trialSessionId,
  );

  /** ค่าใช้จ่ายย้อนหลังไม่กี่วัน */
  const costCount = await tx.massageCostEntry.count({ where: { ownerUserId, trialSessionId } });
  if (costCount === 0 && categories.length > 0) {
    await Promise.all(
      COST_ENTRIES.map((item, i) => {
        const cat = categories[i % categories.length]!;
        const dayKey = bangkokDateKeyMinusDays(todayKey, i + 1);
        return tx.massageCostEntry.create({
          data: {
            ownerUserId,
            trialSessionId,
            categoryId: cat.id,
            spentAt: bangkokDateTime(dayKey, 11, 0),
            amount: item.amount,
            itemLabel: item.label,
            note: MASSAGE_LIVE_DEMO_NOTE,
            slipPhotoUrl: trialPhoto(`massage-trial-cost-v2-${i}`, 480, 640),
          },
        });
      }),
    );
  }

  /** ประวัติย้อนหลัง 1–4 วัน (นอกเหนือวันนี้) */
  const olderLogs = await tx.massageServiceLog.count({
    where: {
      ownerUserId,
      trialSessionId,
      createdAt: { lt: bangkokDayStartEnd().start },
    },
  });
  if (olderLogs === 0 && customers.length > 0 && therapists.length > 0) {
    let subs = await tx.massageCustomerSubscription.findMany({
      where: { ownerUserId, trialSessionId, status: "ACTIVE" },
      take: 3,
    });
    if (subs.length === 0) {
      const subStatuses = ["ACTIVE", "ACTIVE", "ACTIVE", "EXHAUSTED", "CANCELLED"] as const;
      for (let i = 0; i < customers.length; i += 1) {
        const customer = customers[i]!;
        const pkg = packages[i % packages.length]!;
        const therapist = therapists[i % therapists.length]!;
        const st = subStatuses[i]!;
        const remaining =
          st === "ACTIVE" ? Math.max(2, pkg.totalSessions - i - 1) : st === "EXHAUSTED" ? 0 : 2;
        const sub = await tx.massageCustomerSubscription.create({
          data: {
            ownerUserId,
            trialSessionId,
            massageCustomerId: customer.id,
            packageId: pkg.id,
            soldByTherapistId: therapist.id,
            remainingSessions: remaining,
            status: st,
            saleReceiptImageUrl: i % 2 === 0 ? trialPhoto(`massage-trial-sale-seed-${i}`, 480, 640) : null,
          },
        });
        if (st === "ACTIVE") subs.push(sub);
      }
    }

    for (let i = 1; i <= 4; i += 1) {
      const dayKey = bangkokDateKeyMinusDays(todayKey, i);
      const customer = customers[i % customers.length]!;
      const therapist = therapists[i % therapists.length]!;
      if (i <= 2 && subs.length > 0) {
        const sub = subs[i % subs.length]!;
        await tx.massageServiceLog.create({
          data: {
            ownerUserId,
            trialSessionId,
            subscriptionId: sub.id,
            massageCustomerId: customer.id,
            visitType: "PACKAGE_USE",
            therapistId: therapist.id,
            note: MASSAGE_LIVE_DEMO_NOTE,
            createdAt: bangkokDateTime(dayKey, 10 + i, 0),
          },
        });
      } else {
        await tx.massageServiceLog.create({
          data: {
            ownerUserId,
            trialSessionId,
            subscriptionId: null,
            massageCustomerId: customer.id,
            visitType: "CASH_WALK_IN",
            therapistId: therapist.id,
            amountBaht: 350 + i * 50,
            receiptImageUrl: trialPhoto(`massage-trial-cash-seed-${i}`, 480, 640),
            note: MASSAGE_LIVE_DEMO_NOTE,
            createdAt: bangkokDateTime(dayKey, 14, 0),
          },
        });
      }
    }
  }

  await seedMassageLiveTodayActivity(tx, ownerUserId, trialSessionId, { force: true });

  /** คิววันพรุ่งนี้เพิ่มเล็กน้อย */
  const tomorrowKey = bangkokDateKeyMinusDays(todayKey, -1);
  const { start: tStart, end: tEnd } = bangkokDayStartEndForDateKey(tomorrowKey);
  const tomorrowCount = await tx.massageBooking.count({
    where: { ownerUserId, trialSessionId, scheduledAt: { gte: tStart, lt: tEnd } },
  });
  if (tomorrowCount === 0 && customers.length > 0) {
    for (const [i, hour] of [10, 15].entries()) {
      const customer = customers[i % customers.length]!;
      const therapist = therapists[i % therapists.length]!;
      await tx.massageBooking.create({
        data: {
          ownerUserId,
          trialSessionId,
          massageCustomerId: customer.id,
          therapistId: therapist.id,
          phone: customer.phone,
          customerName: customer.name,
          scheduledAt: bangkokDateTime(tomorrowKey, hour, 0),
          durationMinutes: 60,
          status: "SCHEDULED",
          note: MASSAGE_LIVE_DEMO_NOTE,
        },
      });
    }
  }
}

/** ลบชุดข้อมูลร้านนวดใน scope — ใช้ก่อน seed prod ใหม่ */
async function deleteMassageScopeRows(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  await tx.massageServiceLog.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massageBooking.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massageCustomerSubscription.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massagePortalStaffPing.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massageCustomer.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massagePackage.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massageTherapist.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massageCostEntry.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massageCostCategory.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massageDaySchedule.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.massageShopProfile.deleteMany({ where: { ownerUserId, trialSessionId } });
}

function packageLooksBarberish(name: string): boolean {
  return BARBERISH_PACKAGE_FRAGMENTS.some((frag) => name.includes(frag));
}

/**
 * เรียกเมื่อเปิดแดชบอร์ดร้านนวดในโหมดทดลอง / บัญชี demo
 * — เติมแคตตาล็อกถ้าว่าง · ถ้าแพ็กยังเป็นของร้านตัดผม → รีเซ็ตชุดนวด
 * — ถ้าวันนี้ยังไม่มีคิว/ประวัติ → ใส่กิจกรรมสดตามเวลาไทย
 */
export async function ensureMassageDemoDataForScope(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  const packages = await db.massagePackage.findMany({
    where: { ownerUserId, trialSessionId },
    select: { name: true },
    take: 8,
  });

  if (packages.length === 0) {
    await db.$transaction(async (tx) => {
      await seedMassageTrialData(tx, ownerUserId, trialSessionId);
    });
    return;
  }

  if (packages.some((p) => packageLooksBarberish(p.name))) {
    await db.$transaction(async (tx) => {
      await deleteMassageScopeRows(tx, ownerUserId, trialSessionId);
      await seedMassageTrialData(tx, ownerUserId, trialSessionId);
    });
    return;
  }

  await seedMassageLiveTodayActivity(db, ownerUserId, trialSessionId);
}

/**
 * ข้อมูลตัวอย่าง prod — ล้างแล้วใส่ใหม่เมื่อ refreshDaily
 * @param opts.refreshDaily — ล้างแล้วใส่ใหม่ (ค่าเริ่ม true) ให้แดชบอร์ดรายวันไม่ค้างวันเก่า
 */
export async function seedMassageProdDemoForOwner(
  db: PrismaClient,
  ownerUserId: string,
  opts?: { refreshDaily?: boolean },
): Promise<void> {
  const refresh = opts?.refreshDaily !== false;
  const pkgCount = await db.massagePackage.count({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE },
  });
  if (pkgCount > 0 && !refresh) {
    await ensureMassageDemoDataForScope(db, ownerUserId, TRIAL_PROD_SCOPE);
    return;
  }

  await db.$transaction(async (tx) => {
    await deleteMassageScopeRows(tx, ownerUserId, TRIAL_PROD_SCOPE);
    await seedMassageTrialData(tx, ownerUserId, TRIAL_PROD_SCOPE);
  });
}
