import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import { bangkokMonthKey } from "../src/lib/time/bangkok";
import { seedBuildingPosProdDemoForOwner } from "../src/lib/trial/seed-building-pos";
import { seedEducareProdDemoForOwner } from "../src/lib/trial/seed-educare";
import { seedAssetProdDemoForOwner } from "../src/lib/trial/seed-asset";
import { seedDocTransmissionProdDemoForOwner } from "../src/lib/trial/seed-doc-transmission";
import { seedPromptLibraryProdDemoForOwner } from "../src/lib/trial/seed-prompt-library";
import { seedMediaRegistryProdDemoForOwner } from "../src/lib/trial/seed-media-registry";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("admin4460", 12);
  await prisma.user.upsert({
    where: { email: "admin@mawell.local" },
    update: {
      passwordHash: adminHash,
      role: "ADMIN",
      tokens: 99999,
      subscriptionType: "BUFFET",
      subscriptionTier: "TIER_599",
      lastBuffetBillingMonth: bangkokMonthKey(),
    },
    create: {
      email: "admin@mawell.local",
      username: "admin",
      passwordHash: adminHash,
      role: "ADMIN",
      tokens: 99999,
      lastDeductionDate: new Date(),
      subscriptionType: "BUFFET",
      subscriptionTier: "TIER_599",
      lastBuffetBillingMonth: bangkokMonthKey(),
    },
  });

  const userHash = await bcrypt.hash("User123!", 12);
  // หมายเหตุสำคัญ: `update` ต้องไม่แตะ tokens / subscription* / lastBuffetBillingMonth
  // เพราะ seed ถูกรันซ้ำได้ (deploy/CLI) — ถ้ารีเซ็ตจะทำให้บัญชีทดลองที่เติมโทเคน
  // หรือสมัครแพ็ก 199 แล้ว ถูกเริ่มต้นใหม่ทุกครั้งที่ seed
  await prisma.user.upsert({
    where: { email: "user@mawell.local" },
    update: {
      passwordHash: userHash,
      role: "USER",
    },
    create: {
      email: "user@mawell.local",
      username: "user",
      passwordHash: userHash,
      role: "USER",
      tokens: 7,
      lastDeductionDate: null,
      subscriptionType: "DAILY",
      subscriptionTier: "NONE",
      lastBuffetBillingMonth: null,
    },
  });

  /** บัญชี demo แบบใช้งานจริง (เดียวกับ user@mawell.local — อีเมล .com สำหรับลูกค้าทดลอง) */
  await prisma.user.upsert({
    where: { email: "user@mawell.local.com" },
    update: {
      passwordHash: userHash,
      role: "USER",
    },
    create: {
      email: "user@mawell.local.com",
      username: "user_com",
      passwordHash: userHash,
      role: "USER",
      tokens: 7,
      lastDeductionDate: null,
      subscriptionType: "DAILY",
      subscriptionTier: "NONE",
      lastBuffetBillingMonth: null,
    },
  });

  /** slug ตัวอย่างเก่า — ลบออกเมื่อ seed ใหม่เพื่อไม่ให้ค้างใน DB */
  const legacyModuleSlugs = [
    "g1-inventory",
    "g1-pos-lite",
    "g2-menu-engine",
    "g3-reports",
    "g4-branches",
    "g5-api-hub",
  ];
  await prisma.appModule.deleteMany({
    where: { slug: { in: legacyModuleSlugs } },
  });

  /**
   * module_list: group_id 1–5 ตรงกับแพ็ก 199–599 และสายรายวัน (กลุ่ม 1)
   * Group 1 Basic … Group 5 Ultimate — ชื่อระดับดูที่ src/lib/modules/config.ts
   */
  const moduleSeeds = [
    {
      slug: "attendance",
      title: "เช็คอินอัจฉริยะ",
      description: "กลุ่ม 1 (Basic) — เช็คเข้า-ออก GPS · หลังบ้าน · พนักงานใต้เจ้าของ",
      groupId: 1,
      sortOrder: 10,
    },
    {
      slug: "dormitory",
      title: "ระบบจัดการหอพัก",
      description: "กลุ่ม 1 (Basic) — ห้อง/ผู้เข้าพัก มิเตอร์น้ำไฟ Split Bill ใบเสร็จ",
      groupId: 1,
      sortOrder: 12,
    },
    {
      slug: "barber",
      title: "ระบบจัดการร้านตัดผม",
      description: "กลุ่ม 1 (Basic) — แพ็กเกจ สมาชิก เช็คอินเบอร์ ประวัติ",
      groupId: 1,
      sortOrder: 14,
    },
    {
      slug: "car-wash",
      title: "ระบบจัดการคาร์แคร์",
      description: "กลุ่ม 1 (Basic) — แพ็กเกจบริการ บันทึกเข้ารับบริการ และติดตามร้องเรียน",
      groupId: 1,
      sortOrder: 16,
    },
    {
      slug: "village",
      title: "ระบบจัดการหมู่บ้าน",
      description:
        "กลุ่ม 1 (Basic) — ลูกบ้าน ค่าส่วนกลางรายบ้าน ตรวจสลิป สรุปรายปี รายงาน Excel",
      groupId: 1,
      sortOrder: 18,
    },
    {
      slug: "mqtt-service",
      title: "ระบบบริการ MQTT",
      description:
        "กลุ่ม 1 (Basic) — จัดการ credentials, ACL, และสถานะการเชื่อมต่อสำหรับอุปกรณ์ IoT",
      groupId: 1,
      sortOrder: 20,
    },
    {
      slug: "building-pos",
      title: "POS ร้านอาหาร",
      description:
        "กลุ่ม 1 (Basic) — เมนู ออเดอร์ QR สั่งอาหาร",
      groupId: 1,
      sortOrder: 22,
    },
    {
      slug: "income-expense-basic",
      title: "ระบบบันทึกรายรับรายจ่ายบ้าน",
      description: "กลุ่ม 1 (Basic) — ค่าน้ำไฟ รถ ซ่อมบ้าน รายรับรายจ่ายทั่วไป",
      groupId: 1,
      sortOrder: 24,
    },
    {
      slug: "parking",
      title: "บริการรับฝากจอดรถ",
      description:
        "กลุ่ม 1 (Basic) — รับฝากรถ บัตร QR ลูกค้า สมาชิกรายเดือน บัญชีรายรับ–รายจ่ายลานจอด",
      groupId: 1,
      sortOrder: 26,
    },
    {
      slug: "educare",
      title: "EduCare เช็คนักเรียน",
      description:
        "กลุ่ม 1 (Basic) — เช็คเข้าแถว ความเรียบร้อย เข้าเรียน อาหาร นม แปรงฟัน รายวัน 6 ฟีเจอร์",
      groupId: 1,
      sortOrder: 28,
    },
    {
      slug: "asset",
      title: "บริหารทรัพย์สิน",
      description:
        "กลุ่ม 1 (Basic) — ทะเบียนทรัพย์สิน หมวด/แผนก/สถานที่ มอบหมาย-ยืม-ย้าย ซ่อมบำรุง จำหน่ายออก ตรวจนับ พร้อมรายงาน",
      groupId: 1,
      sortOrder: 29,
    },
    {
      slug: "doc-transmission",
      title: "สารบรรณดิจิทัล",
      description:
        "กลุ่ม 1 (Basic) — รับ-ส่งหนังสือ คำสั่ง บันทึกข้อความ หนังสือเวียน · timeline workflow · ไฟล์ PDF revision · Public share link",
      groupId: 1,
      sortOrder: 30,
    },
    {
      slug: "prompt-library",
      title: "คลังคำสั่ง AI (Prompt)",
      description:
        "กลุ่ม 1 (Basic) — เก็บ จัดหมวด แท็ก ประวัติเวอร์ชัน prompt ส่วนตัว · นับการใช้ · ส่งออก/นำเข้า JSON",
      groupId: 1,
      sortOrder: 31,
    },
    {
      slug: "media-registry",
      title: "ทะเบียนคุมสื่อ",
      description:
        "กลุ่ม 1 (Basic) — ทะเบียนสื่อการเรียนรู้ ยืม-คืน คุมจำนวน มูลค่า สถานที่เก็บ บันทึกชำรุด/ซ่อม/จำหน่าย · ข้อมูลหลัก (ประเภท/สถานที่)",
      groupId: 1,
      sortOrder: 32,
    },
    {
      slug: "stock-management",
      title: "ระบบจัดการสต็อกสินค้า",
      description: "กลุ่ม 2 (Silver)",
      groupId: 2,
      sortOrder: 30,
    },
    {
      slug: "receipt-print",
      title: "ระบบพิมพ์ใบเสร็จ",
      description: "กลุ่ม 2 (Silver)",
      groupId: 2,
      sortOrder: 40,
    },
    {
      slug: "analytics-dashboard",
      title: "ระบบวิเคราะห์ Dashboard (Data Analytics)",
      description: "กลุ่ม 3 (Gold)",
      groupId: 3,
      sortOrder: 50,
    },
    {
      slug: "inter-branch-chat",
      title: "ระบบ Chat ระหว่างสาขา",
      description: "กลุ่ม 3 (Gold)",
      groupId: 3,
      sortOrder: 60,
    },
    {
      slug: "employee-management",
      title: "ระบบจัดการพนักงาน",
      description: "กลุ่ม 4 (Platinum)",
      groupId: 4,
      sortOrder: 70,
    },
    {
      slug: "payroll",
      title: "ระบบเงินเดือน",
      description: "กลุ่ม 4 (Platinum)",
      groupId: 4,
      sortOrder: 80,
    },
    {
      slug: "external-api",
      title: "ระบบ API เชื่อมต่อภายนอก",
      description: "กลุ่ม 5 (Ultimate)",
      groupId: 5,
      sortOrder: 90,
    },
    {
      slug: "advanced-automation",
      title: "ระบบ Automation ขั้นสูง",
      description: "กลุ่ม 5 (Ultimate)",
      groupId: 5,
      sortOrder: 100,
    },
  ];

  for (const m of moduleSeeds) {
    await prisma.appModule.upsert({
      where: { slug: m.slug },
      update: {
        title: m.title,
        description: m.description,
        groupId: m.groupId,
        sortOrder: m.sortOrder,
        isActive: true,
      },
      create: {
        slug: m.slug,
        title: m.title,
        description: m.description,
        groupId: m.groupId,
        sortOrder: m.sortOrder,
        isActive: true,
      },
    });
  }

  /**
   * ข้อมูล demo ต่อโมดูล — ต้องการตาราง migration ครบ
   * ถ้า DB ใหม่ / migrate ค้าง / schema ไม่ตรง ให้ข้ามเฉพาะบล็อกนั้น อย่าให้ล้มก่อน module_list ถูก upsert แล้ว
   * (ตาราง module_list upsert ไว้ด้านบนแล้วเสมอ)
   */
  const demoPosOwnerEmails = ["user@mawell.local.com", "user@mawell.local"] as const;

  async function tryDemoSeed(label: string, work: () => Promise<void>): Promise<void> {
    try {
      await work();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[seed] ข้าม ${label}: ${msg}`);
    }
  }

  /** POS ร้านอาหาร — หมวด+เมนู+รูป (scope prod) สำหรับบัญชี demo ถ้ายังไม่มีข้อมูล */
  for (const email of demoPosOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`building-pos (${email})`, () => seedBuildingPosProdDemoForOwner(prisma, row.id));
    }
  }

  /** EduCare — โรงเรียน + ห้อง + นักเรียน + บันทึกเช็ค 7 วัน (scope prod) สำหรับบัญชี demo ถ้ายังไม่มีข้อมูล */
  for (const email of demoPosOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`educare (${email})`, () => seedEducareProdDemoForOwner(prisma, row.id));
    }
  }

  /** Asset — ทรัพย์สิน + เคลื่อนไหว + ซ่อม + ตรวจนับ (scope prod) สำหรับบัญชี demo ถ้ายังไม่มีข้อมูล */
  for (const email of demoPosOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`asset (${email})`, () => seedAssetProdDemoForOwner(prisma, row.id));
    }
  }

  /** Doc Transmission — สารบรรณดิจิทัล (scope prod) สำหรับบัญชี demo ถ้ายังไม่มีข้อมูล */
  for (const email of demoPosOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`doc-transmission (${email})`, () => seedDocTransmissionProdDemoForOwner(prisma, row.id));
    }
  }

  /** คลังคำสั่ง AI — หมวด + prompt ตัวอย่างสำหรับบัญชีทดลอง (ข้ามถ้ามีคำสั่ง ACTIVE แล้ว) */
  for (const email of demoPosOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`prompt-library (${email})`, () => seedPromptLibraryProdDemoForOwner(prisma, row.id));
    }
  }

  /** ทะเบียนคุมสื่อ — ตัวอย่างทะเบียน/ยืม/บันทึก (ข้ามถ้ามีรายการสื่อแล้ว) */
  for (const email of demoPosOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`media-registry (${email})`, () => seedMediaRegistryProdDemoForOwner(prisma, row.id));
    }
  }
}

main()
  .then(() => {
    console.log(
      "Seed OK — admin / admin4460 , user / User123! (user@mawell.local และ user@mawell.local.com)",
    );
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
