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
import { seedParkingProdDemoForOwner } from "../src/lib/trial/seed-parking";
import { seedWaitQueueProdDemoForOwner } from "../src/lib/trial/seed-wait-queue";
import { seedAppointmentQueueProdDemoForOwner } from "../src/lib/trial/seed-appointment-queue";
import { seedLoyaltyStampProdDemoForOwner } from "../src/lib/trial/seed-loyalty-stamp";
import { seedSchoolBankProdDemoForOwner } from "../src/lib/trial/seed-school-bank";
import { seedCommunityCoopProdDemoForOwner } from "../src/lib/trial/seed-community-coop";
import { seedAttendanceProdDemoForOwner } from "../src/lib/trial/seed-attendance";
import { seedDormitoryProdDemoForOwner } from "../src/lib/trial/seed-dorm";
import { fillBarberPortalDemoMedia, seedBarberProdDemoForOwner } from "../src/lib/trial/seed-barber";
import { seedCarWashProdDemoForOwner } from "../src/lib/trial/seed-car-wash";
import { seedFootballTurfProdDemoForOwner } from "../src/lib/trial/seed-football-turf";
import { seedMassageProdDemoForOwner } from "../src/lib/trial/seed-massage";
import { seedVillageProdDemoForOwner } from "../src/lib/trial/seed-village";
import { seedHomeFinanceProdDemoForOwner } from "../src/lib/trial/seed-home-finance";
import {
  seedLaundryProdDemoForOwner,
  seedMqttProdDemoForOwner,
} from "../src/lib/trial/seed-mqtt-laundry";
import { seedVaultProdDemoForOwner } from "../src/lib/trial/seed-vault";
import { seedInventoryProdDemoForOwner } from "../src/lib/trial/seed-inventory";
import { seedGeneralStorePosProdDemoForOwner } from "../src/lib/trial/seed-general-store-pos";
import { seedDrinkPosProdDemoForOwner } from "../src/lib/trial/seed-drink-pos";
import { seedHotelResortProdDemoForOwner } from "../src/lib/trial/seed-hotel-resort";
import { seedEcommerceStoreProdDemoForOwner } from "../src/lib/trial/seed-ecommerce-store";
import { seedSmartPoliceProdDemoForOwner } from "../src/lib/trial/seed-smart-police";
import {
  ASSET_MODULE_SLUG,
  ATTENDANCE_MODULE_SLUG,
  APPOINTMENT_QUEUE_MODULE_SLUG,
  BARBER_MODULE_SLUG,
  BUILDING_POS_MODULE_SLUG,
  CAR_WASH_MODULE_SLUG,
  MASSAGE_MODULE_SLUG,
  COMMUNITY_COOP_MODULE_SLUG,
  DOC_TRANSMISSION_MODULE_SLUG,
  DORMITORY_MODULE_SLUG,
  EDUCARE_MODULE_SLUG,
  HOME_FINANCE_BASIC_MODULE_SLUG,
  INVENTORY_MODULE_SLUG,
  GENERAL_STORE_POS_MODULE_SLUG,
  DRINK_POS_MODULE_SLUG,
  HOTEL_RESORT_MODULE_SLUG,
  ECOMMERCE_STORE_MODULE_SLUG,
  SMART_POLICE_MODULE_SLUG,
  LAUNDRY_MODULE_SLUG,
  LOYALTY_STAMP_MODULE_SLUG,
  MEDIA_REGISTRY_MODULE_SLUG,
  MQTT_SERVICE_MODULE_SLUG,
  PARKING_MODULE_SLUG,
  PROMPT_LIBRARY_MODULE_SLUG,
  SCHOOL_BANK_MODULE_SLUG,
  VAULT_MODULE_SLUG,
  VILLAGE_MODULE_SLUG,
  WAIT_QUEUE_MODULE_SLUG,
} from "../src/lib/modules/config";
import { subscribeModule } from "../src/lib/modules/subscriptions-store";
import { DEMO_USER_PROFILE_SEED } from "../src/lib/seed/demo-user-profile";

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
      ...DEMO_USER_PROFILE_SEED,
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
      ...DEMO_USER_PROFILE_SEED,
    },
  });

  /** บัญชี demo แบบใช้งานจริง (เดียวกับ user@mawell.local — อีเมล .com สำหรับลูกค้าทดลอง) */
  await prisma.user.upsert({
    where: { email: "user@mawell.local.com" },
    update: {
      passwordHash: userHash,
      role: "USER",
      ...DEMO_USER_PROFILE_SEED,
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
      ...DEMO_USER_PROFILE_SEED,
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
      slug: "football-turf",
      title: "สนามฟุตบอล",
      description:
        "กลุ่ม 1 (Basic) — แดชบอร์ดสนาม คิวจอง walk-in โปรโมชั่น รายรับ–รายจ่าย และลิงก์/QR ลูกค้า",
      groupId: 1,
      sortOrder: 16,
    },
    {
      slug: "massage",
      title: "ระบบจัดการร้านนวด",
      description: "กลุ่ม 1 (Basic) — คิวจอง walk-in แพ็กเกจ รายรับ-รายจ่าย QR ลูกค้า/พนักงาน",
      groupId: 1,
      sortOrder: 17,
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
      slug: "wait-queue",
      title: "คิวหน้าร้าน",
      description:
        "กลุ่ม 1 (Basic) — พนักงานลงคิวลูกค้า walk-in เรียกคิว แจ้งเมื่อถึงคิวเข้าร้าน",
      groupId: 1,
      sortOrder: 27,
    },
    {
      slug: "appointment-queue",
      title: "จองคิวอัจฉริยะ",
      description:
        "กลุ่ม 1 (Basic) — ลูกค้าจองเวลาล่วงหน้า มัดจำสลิป บอร์ดคิวลากสถานะ แปะลิงก์ Facebook/TikTok (ใช้งานฟรี)",
      groupId: 1,
      sortOrder: 28,
    },
    {
      slug: "loyalty-stamp",
      title: "สะสมแต้มดิจิทัล",
      description:
        "กลุ่ม 1 (Basic) — บัตรสะสมแต้มดิจิทัล ร้านกาแฟ/อาหาร ลูกค้าไม่ต้องโหลดแอป (ใช้งานฟรี)",
      groupId: 1,
      sortOrder: 29,
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
        "กลุ่ม 1 (Basic) — เก็บ จัดหมวด แท็ก ประวัติเวอร์ชัน prompt ส่วนตัว · นับการใช้ · ส่งออก/นำเข้า JSON (ใช้งานฟรี ไม่หักโทเคนรายวัน)",
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
      slug: "school-bank",
      title: "ธนาคารโรงเรียน",
      description:
        "กลุ่ม 1 (Basic) — บัญชีออมนักเรียน ฝาก–ถอน ประวัติรายการ สรุปยอด (ใช้งานฟรี ไม่หักโทเคนรายวัน)",
      groupId: 1,
      sortOrder: 33,
    },
    {
      slug: "community-coop",
      title: "สหกรณ์ชุมชน",
      description:
        "กลุ่ม 1 (Basic) — สมาชิก หุ้น เงินออม ปันผลจำลอง บันทึกรายการ (ใช้งานฟรี ไม่หักโทเคนรายวัน)",
      groupId: 1,
      sortOrder: 34,
    },
    {
      slug: "vault",
      title: "คลังรหัสผ่าน",
      description:
        "กลุ่ม 1 (Basic) — เก็บ username/password ของบริการ Google · Facebook ฯลฯ แบบเข้ารหัส (ใช้งานฟรี ไม่หักโทเคนรายวัน)",
      groupId: 1,
      sortOrder: 36,
    },
    {
      slug: "inventory",
      title: "คลัง · สต๊อกสินค้า",
      description:
        "กลุ่ม 1 (Basic) — จัดการหลายคลัง/โกดัง ทะเบียนสินค้า SKU หมวดสินค้า รับเข้า–เบิกออก–โอนระหว่างคลัง ปรับยอด แจ้งของใกล้หมด พร้อมประวัติเคลื่อนไหว",
      groupId: 1,
      sortOrder: 37,
    },
    {
      slug: "general-store-pos",
      title: "POS ร้านทั่วไป (ง่าย)",
      description:
        "กลุ่ม 1 (Basic) — หมวด สินค้า การ์ดทันสมัย บันทึกขายง่าย (ไม่หักโทเคนรายวัน)",
      groupId: 1,
      sortOrder: 38,
    },
    {
      slug: "drink-pos",
      title: "POS ร้านเครื่องดื่ม",
      description:
        "กลุ่ม 1 (Basic) — POS เครื่องดื่ม สะสมแต้ม ยอดขาย/ต้นทุน · สายรายวัน 1 บาท/วันต่อโมดูล",
      groupId: 1,
      sortOrder: 30,
    },
    {
      slug: "hotel-resort",
      title: "โรงแรม / รีสอร์ท",
      description:
        "กลุ่ม 1 (Basic) — ห้องพัก จอง เช็คอิน walk-in บิล QR · สายรายวัน 1 บาท/วันต่อโมดูล",
      groupId: 1,
      sortOrder: 31,
    },
    {
      slug: "ecommerce-store",
      title: "E-Commerce Store Builder",
      description:
        "กลุ่ม 1 (Basic) — สร้างร้านออนไลน์ จัดการสต๊อก หน้าร้องสาธารณะ ลูกค้าแนบสลิป PromptPay QR",
      groupId: 1,
      sortOrder: 39,
    },
    {
      slug: "laundry",
      title: "รับฝากซักผ้า",
      description:
        "กลุ่ม 1 (Basic) — แพ็กเกจซักรีด ออเดอร์ รับ–ส่ง ติดตามสถานะ",
      groupId: 1,
      sortOrder: 35,
    },
    {
      slug: "smart-police",
      title: "Smart Police (สำนวนคดี)",
      description:
        "กลุ่ม 2 (Silver) — สำนวนคดี คำให้การ หมายเรียก แม่แบบเอกสาร พิมพ์ A4 รายงานสรุป (อิง SmartPolice desktop)",
      groupId: 2,
      sortOrder: 28,
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
   * บัญชีที่ได้รับข้อมูลตัวอย่างจาก seed — เฉพาะ user demo (ไม่ใส่แอดมิน)
   * แอดมิน = ทดสอบสิทธิ์/หลังบ้าน — ไม่ต้องมีข้อมูลตัวอย่างโมดูล
   */
  const demoSeedDataOwnerEmails = [
    "user@mawell.local.com",
    "user@mawell.local",
  ] as const;

  /** โมดูลที่มี prod demo seed — subscribe ให้ครบเพื่อเห็นการ์ดบนแดชบอร์ดและเข้าใช้ได้ทันที */
  const demoAutoSubscribeSlugs = [
    WAIT_QUEUE_MODULE_SLUG,
    APPOINTMENT_QUEUE_MODULE_SLUG,
    LOYALTY_STAMP_MODULE_SLUG,
    SCHOOL_BANK_MODULE_SLUG,
    COMMUNITY_COOP_MODULE_SLUG,
    PROMPT_LIBRARY_MODULE_SLUG,
    BUILDING_POS_MODULE_SLUG,
    EDUCARE_MODULE_SLUG,
    ASSET_MODULE_SLUG,
    DOC_TRANSMISSION_MODULE_SLUG,
    MEDIA_REGISTRY_MODULE_SLUG,
    PARKING_MODULE_SLUG,
    ATTENDANCE_MODULE_SLUG,
    DORMITORY_MODULE_SLUG,
    BARBER_MODULE_SLUG,
    CAR_WASH_MODULE_SLUG,
    "football-turf",
    MASSAGE_MODULE_SLUG,
    VILLAGE_MODULE_SLUG,
    HOME_FINANCE_BASIC_MODULE_SLUG,
    MQTT_SERVICE_MODULE_SLUG,
    LAUNDRY_MODULE_SLUG,
    VAULT_MODULE_SLUG,
    INVENTORY_MODULE_SLUG,
    GENERAL_STORE_POS_MODULE_SLUG,
    DRINK_POS_MODULE_SLUG,
    HOTEL_RESORT_MODULE_SLUG,
    ECOMMERCE_STORE_MODULE_SLUG,
    SMART_POLICE_MODULE_SLUG,
  ] as const;

  for (const slug of demoAutoSubscribeSlugs) {
    const mod = await prisma.appModule.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!mod) continue;
    for (const email of demoSeedDataOwnerEmails) {
      const row = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (row) {
        await subscribeModule(row.id, mod.id);
      }
    }
  }

  /**
   * ข้อมูล demo ต่อโมดูล — ต้องการตาราง migration ครบ
   * ถ้า DB ใหม่ / migrate ค้าง / schema ไม่ตรง ให้ข้ามเฉพาะบล็อกนั้น อย่าให้ล้มก่อน module_list ถูก upsert แล้ว
   * (ตาราง module_list upsert ไว้ด้านบนแล้วเสมอ)
   */
  async function tryDemoSeed(label: string, work: () => Promise<void>): Promise<void> {
    try {
      await work();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[seed] ข้าม ${label}: ${msg}`);
    }
  }

  /** POS ร้านอาหาร — หมวด+เมนู+รูป (scope prod) สำหรับบัญชี demo ถ้ายังไม่มีข้อมูล */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`building-pos (${email})`, () => seedBuildingPosProdDemoForOwner(prisma, row.id));
    }
  }

  /** EduCare — โรงเรียน + ห้อง + นักเรียน + บันทึกเช็ค 7 วัน (scope prod) สำหรับบัญชี demo ถ้ายังไม่มีข้อมูล */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`educare (${email})`, () => seedEducareProdDemoForOwner(prisma, row.id));
    }
  }

  /** Asset — ทรัพย์สิน + เคลื่อนไหว + ซ่อม + ตรวจนับ (scope prod) สำหรับบัญชี demo ถ้ายังไม่มีข้อมูล */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`asset (${email})`, () => seedAssetProdDemoForOwner(prisma, row.id));
    }
  }

  /** Doc Transmission — สารบรรณดิจิทัล (scope prod) สำหรับบัญชี demo ถ้ายังไม่มีข้อมูล */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`doc-transmission (${email})`, () => seedDocTransmissionProdDemoForOwner(prisma, row.id));
    }
  }

  /** คลังคำสั่ง AI — หมวด + prompt ตัวอย่างสำหรับบัญชีทดลอง (ข้ามถ้ามีคำสั่ง ACTIVE แล้ว) */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`prompt-library (${email})`, () => seedPromptLibraryProdDemoForOwner(prisma, row.id));
    }
  }

  /** ทะเบียนคุมสื่อ — ตัวอย่างทะเบียน/ยืม/บันทึก (ข้ามถ้ามีรายการสื่อแล้ว) */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`media-registry (${email})`, () => seedMediaRegistryProdDemoForOwner(prisma, row.id));
    }
  }

  /** ที่จอดรถ — ประวัติตัวอย่าง 20 แถวต่อลาน (ข้ามถ้ามีแถว seed ครบแล้ว) */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`parking (${email})`, () => seedParkingProdDemoForOwner(prisma, row.id));
    }
  }

  /** คิวหน้าร้าน — คิววันนี้ตัวอย่าง (รอ / เรียกแล้ว / เข้าร้านแล้ว) */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`wait-queue (${email})`, () => seedWaitQueueProdDemoForOwner(prisma, row.id));
    }
  }

  /** จองคิวอัจฉริยะ — บริการ ช่าง ตารางเวลา คิวตัวอย่างวันนี้ */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`appointment-queue (${email})`, () =>
        seedAppointmentQueueProdDemoForOwner(prisma, row.id),
      );
      await tryDemoSeed(`loyalty-stamp (${email})`, () =>
        seedLoyaltyStampProdDemoForOwner(prisma, row.id),
      );
    }
  }

  /** ธนาคารโรงเรียน — บัญชี + รายการตัวอย่าง */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`school-bank (${email})`, () => seedSchoolBankProdDemoForOwner(prisma, row.id));
    }
  }

  /** สหกรณ์ชุมชน — สมาชิก + รายการตัวอย่าง */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`community-coop (${email})`, () => seedCommunityCoopProdDemoForOwner(prisma, row.id));
    }
  }

  /** เช็คอิน — จุดเช็ค + กะ + รายชื่อตัวอย่าง */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`attendance (${email})`, () => seedAttendanceProdDemoForOwner(prisma, row.id));
    }
  }

  /** หอพัก — ห้อง ผู้เข้าพัก บิลตัวอย่าง */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`dormitory (${email})`, () => seedDormitoryProdDemoForOwner(prisma, row.id));
    }
  }

  /** ร้านตัดผม — โปรไฟล์ + เมนู + ตัวอย่าง */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`barber (${email})`, () => seedBarberProdDemoForOwner(prisma, row.id));
    }
  }
  await tryDemoSeed("barber portal media fill", async () => {
    await fillBarberPortalDemoMedia(prisma);
  });

  /** คาร์แคร์ — แพ็กตัวอย่าง */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`car-wash (${email})`, () => seedCarWashProdDemoForOwner(prisma, row.id));
    }
  }

  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`football-turf (${email})`, () => seedFootballTurfProdDemoForOwner(prisma, row.id));
    }
  }

  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`massage (${email})`, () => seedMassageProdDemoForOwner(prisma, row.id));
    }
  }

  /** หมู่บ้าน — โปรไฟล์ + ข้อมูลตัวอย่าง */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`village (${email})`, () => seedVillageProdDemoForOwner(prisma, row.id));
    }
  }

  /** รายรับ–รายจ่ายบ้าน — รายการตัวอย่าง */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`home-finance (${email})`, () => seedHomeFinanceProdDemoForOwner(prisma, row.id));
    }
  }

  /** MQTT — โปรไฟล์ tenant ตัวอย่าง */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`mqtt (${email})`, () => seedMqttProdDemoForOwner(prisma, row.id));
    }
  }

  /** รับฝากซักผ้า — แพ็กตัวอย่าง */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`laundry (${email})`, () => seedLaundryProdDemoForOwner(prisma, row.id));
    }
  }

  /** คลังรหัสผ่าน — ตัวอย่าง 13 รายการ (Google, Facebook, LINE, GitHub ฯลฯ) */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`vault (${email})`, () => seedVaultProdDemoForOwner(prisma, row.id));
    }
  }

  /** คลังสต๊อกสินค้า — 3 คลัง + 5 หมวด + 14 สินค้า + ประวัติเคลื่อนไหว 12 รายการ */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`inventory (${email})`, () => seedInventoryProdDemoForOwner(prisma, row.id));
    }
  }

  /** POS ร้านทั่วไป — ล้าง scope owner แล้วใส่หมวด 4 + สินค้า 20 (รูป) + บิลตัวอย่าง ~13 ใบ */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`general-store-pos (${email})`, () => seedGeneralStorePosProdDemoForOwner(prisma, row.id));
    }
  }

  /** POS ร้านเครื่องดื่ม — หมวด สินค้า สมาชิกสะสมคะแนน บิล+ต้นทุนตัวอย่าง */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`drink-pos (${email})`, () => seedDrinkPosProdDemoForOwner(prisma, row.id));
    }
  }

  /** โรงแรม / รีสอร์ท — ห้องพัก จอง เช็คอิน ต้นทุนตัวอย่าง */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`hotel-resort (${email})`, () => seedHotelResortProdDemoForOwner(prisma, row.id));
    }
  }

  /** E-Commerce Store Builder — ร้านตัวอย่าง 8 สินค้า + Sale Page + ออเดอร์รอตรวจ */
  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`ecommerce-store (${email})`, () =>
        seedEcommerceStoreProdDemoForOwner(prisma, row.id),
      );
    }
  }

  for (const email of demoSeedDataOwnerEmails) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (row) {
      await tryDemoSeed(`smart-police (${email})`, () =>
        seedSmartPoliceProdDemoForOwner(prisma, row.id),
      );
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
