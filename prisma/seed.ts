import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import { bangkokMonthKey } from "../src/lib/time/bangkok";

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
  await prisma.user.upsert({
    where: { email: "user@mawell.local" },
    update: {
      passwordHash: userHash,
      role: "USER",
      tokens: 7,
      subscriptionType: "DAILY",
      subscriptionTier: "NONE",
      lastBuffetBillingMonth: null,
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
      title: "ระบบเช่าที่จอดรถ",
      description:
        "กลุ่ม 1 (Basic) — ผังช่องจอด เช็คอิน QR คิดรายชั่วโมงหรือเหมาวัน หมายเหตุรับส่ง ประวัติ",
      groupId: 1,
      sortOrder: 26,
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
}

main()
  .then(() => {
    console.log("Seed OK — admin / admin4460 , user / User123!");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
