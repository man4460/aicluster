import type { PrismaClient } from "@/generated/prisma/client";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

function daysAgoDateTime(days: number, hour = 10): Date {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

function daysAgoStartOfDay(days: number): Date {
  return daysAgoDateTime(days, 0);
}

/** แพ็กล้างรถตัวอย่าง — สร้าง 4 ระดับ 199/299/499/899 บาท */
async function ensureCarWashPackages(tx: Tx, ownerUserId: string, trialSessionId: string) {
  const n = await tx.carWashPackage.count({ where: { ownerUserId, trialSessionId } });
  if (n >= 4) {
    return tx.carWashPackage.findMany({
      where: { ownerUserId, trialSessionId, isActive: true },
      orderBy: { price: "asc" },
      take: 4,
    });
  }
  const data = [
    {
      ownerUserId,
      trialSessionId,
      name: "ล้างสี + ดูดฝุ่น (เบสิค)",
      price: 199,
      durationMinutes: 30,
      description: "ล้างรถน้ำยา, เช็ดผ้าไมโครไฟเบอร์, ดูดฝุ่นภายในเบสิค",
      isActive: true,
    },
    {
      ownerUserId,
      trialSessionId,
      name: "ล้างสี + ขัดสีอย่างรวดเร็ว",
      price: 299,
      durationMinutes: 45,
      description: "เบสิค + ครีมขัดสีอย่างเร็ว, ยางเงา, เคมีล้างหน้าต่าง",
      isActive: true,
    },
    {
      ownerUserId,
      trialSessionId,
      name: "เคลือบแก้วสีเร่งด่วน",
      price: 499,
      durationMinutes: 60,
      description: "ล้างขัด + สเปรย์เคลือบแก้วระดับ Hi-Gloss, ห้องเครื่องอ่อนๆ, ฆ่าเชื้อภายใน",
      isActive: true,
    },
    {
      ownerUserId,
      trialSessionId,
      name: "สปาเครื่องอบสี (เต็มรายการ)",
      price: 899,
      durationMinutes: 120,
      description: "ดีทัช, เคลือบสี 9H, ฆ่าเชื้อแอร์, ทำความสะอาดห้องเครื่อง + ยาง + โครเมียม",
      isActive: true,
    },
  ];
  for (const row of data) {
    await tx.carWashPackage.create({ data: row });
  }
  return tx.carWashPackage.findMany({
    where: { ownerUserId, trialSessionId, isActive: true },
    orderBy: { price: "asc" },
    take: 4,
  });
}

/** หมวดค่าใช้จ่ายต้นทุนตัวอย่าง — สำหรับหน้ารายจ่าย */
async function ensureCostCategories(tx: Tx, ownerUserId: string, trialSessionId: string) {
  const n = await tx.carWashCostCategory.count({ where: { ownerUserId, trialSessionId } });
  if (n >= 4) return;
  await tx.carWashCostCategory.createMany({
    data: [
      { ownerUserId, trialSessionId, name: "น้ำยาล้างรถ / น้ำยาบำรุง" },
      { ownerUserId, trialSessionId, name: "ค่าน้ำประปา / ค่าไฟฟ้า" },
      { ownerUserId, trialSessionId, name: "ผ้าไมโคร / อุปกรณ์" },
      { ownerUserId, trialSessionId, name: "ค่าจ้างพนักงานรายวัน" },
    ],
    skipDuplicates: true,
  });
}

/**
 * สร้างกิจกรรมตัวอย่าง: ลูกค้า, visit (วันนี้ + ย้อนหลัง 6 วัน), แพ็กเหมา (วันนี้), ค่าใช้จ่ายต้นทุน
 * ให้หน้า dashboard stat cards และกราฟไม่เป็น 0 หมด
 * (idempotent: มี visit แล้วจะข้าม — ปลอดภัยรันซ้ำ)
 */
export async function seedCarWashSampleActivity(
  db: PrismaClient | Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  const tx = db;
  const visitCount = await tx.carWashVisit.count({ where: { ownerUserId, trialSessionId } });
  if (visitCount > 0) return;

  const packages = await ensureCarWashPackages(tx, ownerUserId, trialSessionId);
  const pkgBasic = packages[0]!; // 199
  const pkgQuick = packages[1]!; // 299
  const pkgCoat = packages[2]!; // 499
  const pkgSpa = packages[3]!; // 899

  await ensureCostCategories(tx, ownerUserId, trialSessionId);
  const categories = await tx.carWashCostCategory.findMany({
    where: { ownerUserId, trialSessionId },
    orderBy: { id: "asc" },
  });
  const catChem = categories[0];
  const catUtility = categories[1] ?? catChem;
  const catEquip = categories[2] ?? catChem;

  /** สมัครสมาชิกแพ็กเหมา (วันนี้) — ขึ้น bundleRevenue ใน todayStats */
  const bundleToday = await tx.carWashBundle.create({
    data: {
      ownerUserId,
      trialSessionId,
      customerName: "คุณสมชาย ใจดี (สมาชิก)",
      customerPhone: "081-234-5678",
      plateNumber: "กข-1234 กรุงเทพฯ",
      packageId: pkgCoat.id,
      packageName: pkgCoat.name,
      paidAmount: 2990,
      totalUses: 10,
      usedUses: 2,
      isActive: true,
      createdAt: daysAgoDateTime(0, 9),
      updatedAt: daysAgoDateTime(0, 9),
    },
  });

  /** ลูกค้าประจำ — สร้าง visits ด้านล่าง */
  const visitSpecs: Array<{
    daysAgo: number;
    hour: number;
    customerName: string;
    customerPhone: string;
    plateNumber: string;
    package: { id: number | null; name: string; price: number };
    finalPrice: number;
    serviceStatus: string;
    note: string;
    bundleId?: number;
    recordedByName?: string;
  }> = [
    /** ===== วันนี้ (2026-08-07) ===== ขึ้น todayStats ทั้ง 4 ใบ */
    {
      daysAgo: 0, hour: 9,
      customerName: "คุณสมศักดิ์",
      customerPhone: "080-111-2222",
      plateNumber: "กพ-8889 นนทบุรี",
      package: { id: pkgBasic.id, name: pkgBasic.name, price: pkgBasic.price },
      finalPrice: pkgBasic.price, // 199
      serviceStatus: "COMPLETED",
      note: "จอดหน้า, ลุยน้ำมันบนฝาท้าย",
      recordedByName: "แอดมิน (ตัวอย่าง)",
    },
    {
      daysAgo: 0, hour: 10,
      customerName: "คุณนิภาภรณ์",
      customerPhone: "081-555-6666",
      plateNumber: "กม-4521 ปทุมธานี",
      package: { id: null, name: "Walk-in ล้างขัด", price: pkgQuick.price },
      finalPrice: pkgQuick.price, // 299
      serviceStatus: "WASHING", // กำลังล้าง
      note: "walk-in ไม่มี pre-book",
      recordedByName: "แอดมิน (ตัวอย่าง)",
    },
    {
      daysAgo: 0, hour: 8,
      customerName: "คุณสมชาย ใจดี (สมาชิก)",
      customerPhone: "081-234-5678",
      plateNumber: "กข-1234 กรุงเทพฯ",
      package: { id: pkgCoat.id, name: pkgCoat.name, price: pkgCoat.price },
      finalPrice: 0, // หักจากแพ็กเหมา ไม่นับ visitRevenue (จะนับเมื่อซื้อแพ็กด้านบน bundle 2,990)
      serviceStatus: "PAID",
      note: "หักครั้งที่ 1 จากแพ็ก 10 ครั้ง",
      bundleId: bundleToday.id,
      recordedByName: "แอดมิน (ตัวอย่าง)",
    },

    /** ===== เมื่อวาน (08-06) ===== */
    {
      daysAgo: 1, hour: 11,
      customerName: "คุณวิศรุต",
      customerPhone: "089-777-7777",
      plateNumber: "สส-5150 สมุทรปราการ",
      package: { id: pkgSpa.id, name: pkgSpa.name, price: pkgSpa.price },
      finalPrice: pkgSpa.price, // 899
      serviceStatus: "PAID",
      note: "สปาเต็มรายการ จองผ่านไลน์",
    },
    {
      daysAgo: 1, hour: 14,
      customerName: "คุณอรทัย",
      customerPhone: "084-112-2345",
      plateNumber: "กก-7654 กรุงเทพฯ",
      package: { id: pkgQuick.id, name: pkgQuick.name, price: pkgQuick.price },
      finalPrice: pkgQuick.price, // 299
      serviceStatus: "PAID",
      note: "",
    },

    /** ===== 2 วันก่อน (08-05) ===== */
    {
      daysAgo: 2, hour: 10,
      customerName: "คุณมงคล",
      customerPhone: "086-334-4556",
      plateNumber: "กน-4011 ฉะเชิงเทรา",
      package: { id: pkgCoat.id, name: pkgCoat.name, price: pkgCoat.price },
      finalPrice: pkgCoat.price, // 499
      serviceStatus: "PAID",
      note: "เคลือบแก้วเบสิค",
    },
    {
      daysAgo: 2, hour: 16,
      customerName: "คุณจันทร์จิระ",
      customerPhone: "083-990-0112",
      plateNumber: "จจ-1122 นครนายก",
      package: { id: pkgBasic.id, name: pkgBasic.name, price: pkgBasic.price },
      finalPrice: pkgBasic.price, // 199
      serviceStatus: "PAID",
      note: "",
    },

    /** ===== 3 วันก่อน (08-04) ===== */
    {
      daysAgo: 3, hour: 15,
      customerName: "คุณวิศรุต",
      customerPhone: "089-777-7777",
      plateNumber: "สส-5150 สมุทรปราการ",
      package: { id: pkgQuick.id, name: pkgQuick.name, price: pkgQuick.price },
      finalPrice: pkgQuick.price, // 299
      serviceStatus: "PAID",
      note: "ซ้ำ 2 วันติด รถกลับมาอีกคัน",
    },

    /** ===== 5 วันก่อน (08-02) ===== */
    {
      daysAgo: 5, hour: 9,
      customerName: "คุณเกียรติชัย",
      customerPhone: "082-771-8899",
      plateNumber: "กจ-9999 กรุงเทพฯ",
      package: { id: pkgCoat.id, name: pkgCoat.name, price: pkgCoat.price },
      finalPrice: pkgCoat.price, // 499
      serviceStatus: "PAID",
      note: "",
    },
  ];

  for (const spec of visitSpecs) {
    await tx.carWashVisit.create({
      data: {
        ownerUserId,
        trialSessionId,
        visitAt: daysAgoDateTime(spec.daysAgo, spec.hour),
        customerName: spec.customerName,
        customerPhone: spec.customerPhone,
        plateNumber: spec.plateNumber,
        packageId: spec.package.id,
        packageName: spec.package.name,
        listedPrice: spec.package.price,
        finalPrice: spec.finalPrice,
        serviceStatus: spec.serviceStatus,
        note: spec.note,
        recordedByName: spec.recordedByName ?? "",
        bundleId: spec.bundleId,
      },
    });
  }

  /** ต้นทุนตัวอย่าง (ไม่จำเป็นต้องตรงกับจำนวน visit — ให้กราฟรายจ่ายมีข้อมูล) */
  const costSpecs = [
    { daysAgo: 0, cat: catChem, amount: 450, item: "น้ำยาล้างรถ Hi-Gloss 1 แกลลอน", note: "รีฟิลรายสัปดาห์" },
    { daysAgo: 0, cat: catEquip, amount: 280, item: "ผ้าไมโครไฟเบอร์ 10 ผืน", note: "" },
    { daysAgo: 1, cat: catUtility, amount: 320, item: "ค่าน้ำ + ค่าไฟ รายวัน (เฉลี่ย)", note: "ประมาณค่า" },
    { daysAgo: 2, cat: catChem, amount: 690, item: "สเปรย์เคลือบสี Nano Coat", note: "ใช้สำหรับคิว Package 499" },
    { daysAgo: 4, cat: catUtility, amount: 1500, item: "ซ่อมปั๊มน้ำความดันสูง", note: "เปลี่ยนวาล์ว" },
  ];
  for (const c of costSpecs) {
    if (!c.cat) continue;
    await tx.carWashCostEntry.create({
      data: {
        ownerUserId,
        trialSessionId,
        categoryId: c.cat.id,
        spentAt: daysAgoStartOfDay(c.daysAgo),
        amount: c.amount,
        itemLabel: c.item,
        note: c.note,
      },
    });
  }
}

/** ทดลอง: สร้างแพ็ก (แค่ 1 ใบ) — เก็บฟังก์ชันเพื่อ backward compat กับ code เก่า */
export async function seedCarWashTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  await ensureCarWashPackages(tx, ownerUserId, trialSessionId);
  await seedCarWashSampleActivity(tx, ownerUserId, trialSessionId);
}

export async function seedCarWashProdDemoForOwner(db: PrismaClient, ownerUserId: string): Promise<void> {
  const n = await db.carWashPackage.count({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE },
  });
  await db.$transaction((tx) => seedCarWashTrialData(tx, ownerUserId, TRIAL_PROD_SCOPE));
  if (n === 0) return;
  const visits = await db.carWashVisit.count({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE },
  });
  if (visits === 0) {
    await db.$transaction((tx) => seedCarWashSampleActivity(tx, ownerUserId, TRIAL_PROD_SCOPE));
  }
}
