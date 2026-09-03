import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { LAUNDRY_RECORDED_BY_CUSTOMER_PICKUP_QR } from "@/systems/laundry/laundry-customer-pickup-request";
import type { LaundryOrderStatus } from "@/systems/laundry/laundry-order-status";
import {
  LAUNDRY_BROKEN_UNSPLASH_REPLACEMENTS,
  LAUNDRY_PACKAGE_SAMPLE_IMAGES,
  LAUNDRY_PORTAL_SAMPLE_BANNER,
  LAUNDRY_PORTAL_SAMPLE_GALLERY,
  LAUNDRY_PORTAL_SAMPLE_LOGO,
  laundryNormalizePortalGallery,
  laundryPackageSampleImage,
  laundryRepairPortalGallery,
  laundryRepairSampleImageUrl,
  laundrySerializePortalGallery,
} from "@/systems/laundry/lib/portal-media";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

const EXAMPLE_PER_USE_NAME = "ซักรายครั้ง";
const EXAMPLE_BULK_NAME = "แพ็กเหมา 100 ชิ้น";
const EXAMPLE_EXPRESS_NAME = "ซักด่วน 24 ชม.";
const DEMO_NOTE = "ตัวอย่างระบบ";
const DEMO_STAFF = "พนักงานตัวอย่าง";

function demoSuffix(trialSessionId: string) {
  return trialSessionId === TRIAL_PROD_SCOPE ? "(ตัวอย่าง)" : "(ทดลอง)";
}

function bangkokDemoAt(hours: number, minutes: number): Date {
  const key = bangkokDateKey();
  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  return new Date(`${key}T${h}:${m}:00+07:00`);
}

function examplePackageRows(ownerUserId: string, trialSessionId: string) {
  const suffix = demoSuffix(trialSessionId);
  return [
    {
      ownerUserId,
      trialSessionId,
      name: `${EXAMPLE_PER_USE_NAME} ${suffix}`,
      pricingModel: "FLAT",
      basePrice: 80,
      totalSessions: 1,
      durationHours: new Prisma.Decimal("48"),
      description: "เลือกขนาดตะกร้าเล็ก / กลาง / ใหญ่ — รับผ้าหน้าร้าน POS",
      basketTiers: [
        { label: "ตะกร้าเล็ก", price: 80 },
        { label: "ตะกร้ากลาง", price: 120 },
        { label: "ตะกร้าใหญ่", price: 180 },
      ],
      imageUrl: LAUNDRY_PACKAGE_SAMPLE_IMAGES[0],
      isActive: true,
    },
    {
      ownerUserId,
      trialSessionId,
      name: `${EXAMPLE_BULK_NAME} ${suffix}`,
      pricingModel: "PER_ITEM",
      basePrice: 1000,
      totalSessions: 100,
      durationHours: new Prisma.Decimal("72"),
      description: "ซักได้ 100 ครั้ง ราคา 1,000 บาท — ขายที่แท็บสมาชิกแพ็ก แล้วหักครั้งตอนรับผ้า",
      imageUrl: LAUNDRY_PACKAGE_SAMPLE_IMAGES[1],
      isActive: true,
    },
    {
      ownerUserId,
      trialSessionId,
      name: `${EXAMPLE_EXPRESS_NAME} ${suffix}`,
      pricingModel: "FLAT",
      basePrice: 150,
      totalSessions: 1,
      durationHours: new Prisma.Decimal("24"),
      description: "ซัก–อบ–รีดภายใน 24 ชม. — เหมาะงานด่วน",
      imageUrl: LAUNDRY_PACKAGE_SAMPLE_IMAGES[2],
      isActive: true,
    },
  ];
}

type DemoOrderDef = {
  phone: string;
  customerName: string;
  status: LaundryOrderStatus;
  finalPrice: number;
  serviceTier: string;
  online: boolean;
  orderAt: Date;
  paymentMethod?: string;
};

function demoOrderDefs(): DemoOrderDef[] {
  return [
    {
      phone: "0811111001",
      customerName: "คุณสมชาย",
      status: "PICKED_UP",
      finalPrice: 80,
      serviceTier: "ตะกร้าเล็ก",
      online: false,
      orderAt: bangkokDemoAt(9, 15),
      paymentMethod: "CASH",
    },
    {
      phone: "0811111002",
      customerName: "คุณวิไล",
      status: "WASHING",
      finalPrice: 120,
      serviceTier: "ตะกร้ากลาง",
      online: false,
      orderAt: bangkokDemoAt(10, 30),
      paymentMethod: "PROMPTPAY",
    },
    {
      phone: "0811111003",
      customerName: "คุณนภา",
      status: "IRONING",
      finalPrice: 180,
      serviceTier: "ตะกร้าใหญ่",
      online: false,
      orderAt: bangkokDemoAt(11, 0),
      paymentMethod: "CASH",
    },
    {
      phone: "0812345678",
      customerName: "คุณมานี",
      status: "PENDING_PICKUP",
      finalPrice: 120,
      serviceTier: "ตะกร้ากลาง",
      online: true,
      orderAt: bangkokDemoAt(11, 45),
    },
    {
      phone: "0811111004",
      customerName: "คุณปิติ",
      status: "PENDING_PICKUP",
      finalPrice: 150,
      serviceTier: "ซักด่วน",
      online: true,
      orderAt: bangkokDemoAt(12, 10),
    },
    {
      phone: "0811111005",
      customerName: "คุณกานด์",
      status: "READY_TO_DELIVER",
      finalPrice: 120,
      serviceTier: "ตะกร้ากลาง",
      online: false,
      orderAt: bangkokDemoAt(8, 0),
      paymentMethod: "CASH",
    },
    {
      phone: "0811111006",
      customerName: "คุณอร",
      status: "DRYING",
      finalPrice: 80,
      serviceTier: "ตะกร้าเล็ก",
      online: false,
      orderAt: bangkokDemoAt(13, 20),
      paymentMethod: "CASH",
    },
  ];
}

async function repairLaundryBrokenSampleImagesDb(
  db: PrismaClient | Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  const profile = await db.laundryShopProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    select: { logoUrl: true, portalBannerUrl: true, portalGalleryJson: true },
  });
  if (profile) {
    const logoUrl = laundryRepairSampleImageUrl(profile.logoUrl);
    const portalBannerUrl = laundryRepairSampleImageUrl(profile.portalBannerUrl);
    const portalGalleryJson = laundrySerializePortalGallery(
      laundryRepairPortalGallery(laundryNormalizePortalGallery(profile.portalGalleryJson)),
    );
    const needsRepair =
      logoUrl !== profile.logoUrl ||
      portalBannerUrl !== profile.portalBannerUrl ||
      portalGalleryJson !== profile.portalGalleryJson;
    if (needsRepair) {
      await db.laundryShopProfile.update({
        where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
        data: { logoUrl, portalBannerUrl, portalGalleryJson },
      });
    }
  }

  for (const brokenId of Object.keys(LAUNDRY_BROKEN_UNSPLASH_REPLACEMENTS)) {
    await db.laundryPackage.updateMany({
      where: { ownerUserId, trialSessionId, imageUrl: { contains: brokenId } },
      data: { imageUrl: LAUNDRY_PACKAGE_SAMPLE_IMAGES[0] },
    });
  }

  const packagesMissingImage = await db.laundryPackage.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      OR: [{ imageUrl: null }, { imageUrl: "" }],
    },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  for (let i = 0; i < packagesMissingImage.length; i++) {
    const row = packagesMissingImage[i]!;
    await db.laundryPackage.update({
      where: { id: row.id },
      data: { imageUrl: laundryPackageSampleImage(i) },
    });
  }
}

async function ensureLaundryDemoShopProfileDb(
  db: PrismaClient | Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  const isProd = trialSessionId === TRIAL_PROD_SCOPE;
  const label = isProd ? "MAWELL Laundry (ตัวอย่าง)" : "MAWELL Laundry (ทดลอง)";
  const data = {
    displayName: label,
    tagline: "ซักรีด · รับ–ส่ง · แพ็กเหมา — บริการครบวงจร",
    logoUrl: LAUNDRY_PORTAL_SAMPLE_LOGO,
    contactPhone: "0890003344",
    contactLine: "@mawell-laundry-demo",
    address: "88/12 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110",
    shopLat: new Prisma.Decimal("13.7307000"),
    shopLng: new Prisma.Decimal("100.5696000"),
    pickupFeePerKmBaht: 15,
    openTime: "08:00",
    closeTime: "21:00",
    portalBannerUrl: LAUNDRY_PORTAL_SAMPLE_BANNER,
    portalGalleryJson: laundrySerializePortalGallery([...LAUNDRY_PORTAL_SAMPLE_GALLERY]),
    promptPayPhone: "0890003344",
    payAmountPresets: "80,100,120,150,180",
  };

  await db.laundryShopProfile.upsert({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    create: { ownerUserId, trialSessionId, ...data },
    update: data,
  });
}

/** ออเดอร์คิวออนไลน์ตัวอย่างที่สร้างก่อนมี pickup_public_token — เติมให้ค้นหาเบอร์บนพอร์ทัลได้ */
async function repairLaundryDemoPickupPublicTokensDb(
  db: PrismaClient | Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<number> {
  const rows = await db.laundryOrder.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      pickupPublicToken: null,
      recordedByName: LAUNDRY_RECORDED_BY_CUSTOMER_PICKUP_QR,
      note: { startsWith: DEMO_NOTE },
    },
    select: { id: true },
  });
  let n = 0;
  for (const row of rows) {
    await db.laundryOrder.update({
      where: { id: row.id },
      data: { pickupPublicToken: randomUUID() },
    });
    n += 1;
  }
  return n;
}

async function ensureLaundryDemoOrdersDb(
  db: PrismaClient | Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<number> {
  const perUse = await db.laundryPackage.findFirst({
    where: { ownerUserId, trialSessionId, name: { contains: EXAMPLE_PER_USE_NAME } },
    orderBy: { id: "asc" },
  });
  const express = await db.laundryPackage.findFirst({
    where: { ownerUserId, trialSessionId, name: { contains: EXAMPLE_EXPRESS_NAME } },
    orderBy: { id: "asc" },
  });

  let created = 0;
  for (const def of demoOrderDefs()) {
    const exists = await db.laundryOrder.findFirst({
      where: {
        ownerUserId,
        trialSessionId,
        customerPhone: def.phone,
        note: { startsWith: DEMO_NOTE },
      },
      select: { id: true },
    });
    if (exists) continue;

    const isExpress = def.serviceTier === "ซักด่วน";
    const pkg = isExpress ? express : perUse;
    const pkgName = pkg?.name ?? (isExpress ? EXAMPLE_EXPRESS_NAME : EXAMPLE_PER_USE_NAME);

    await db.laundryOrder.create({
      data: {
        ownerUserId,
        trialSessionId,
        orderAt: def.orderAt,
        customerName: def.customerName,
        customerPhone: def.phone,
        pickupAddress: def.online
          ? `${def.customerName} — 123/4 ซอยสุขใจ แขวงลาดพร้าว\nพิกัด GPS: 13.816000, 100.560000`
          : "หน้าร้าน",
        dropoffAddress: def.online ? "123/4 ซอยสุขใจ แขวงลาดพร้าว" : "หน้าร้าน",
        serviceType: `${pkgName} (${def.serviceTier})`,
        packageId: pkg?.id ?? null,
        packageName: pkgName,
        weightKg: new Prisma.Decimal("0"),
        itemCount: 0,
        finalPrice: def.finalPrice,
        note: `${DEMO_NOTE} — ${def.online ? "คิวสั่งออนไลน์" : "ออเดอร์หน้าร้าน"}`,
        recordedByName: def.online ? LAUNDRY_RECORDED_BY_CUSTOMER_PICKUP_QR : DEMO_STAFF,
        status: def.status,
        distanceKm: def.online ? new Prisma.Decimal("3.5") : null,
        paymentMethod: def.paymentMethod ?? null,
        pickupPublicToken: def.online ? randomUUID() : null,
      },
    });
    created += 1;
  }
  return created;
}

async function ensureLaundryDemoCustomersDb(
  db: PrismaClient | Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  const bulk = await db.laundryPackage.findFirst({
    where: { ownerUserId, trialSessionId, name: { contains: EXAMPLE_BULK_NAME } },
    orderBy: { id: "asc" },
  });
  if (!bulk) return;

  const customerDefs = [
    { phone: "0892223344", name: "คุณพิมพ์", remaining: 87 },
    { phone: "0823456789", name: "คุณชัย", remaining: 12 },
  ] as const;

  for (const def of customerDefs) {
    let customer = await db.laundryCustomer.findUnique({
      where: {
        ownerUserId_phone_trialSessionId: { ownerUserId, phone: def.phone, trialSessionId },
      },
    });
    if (!customer) {
      customer = await db.laundryCustomer.create({
        data: {
          ownerUserId,
          trialSessionId,
          phone: def.phone,
          name: def.name,
        },
      });
    }

    const sub = await db.laundryCustomerSubscription.findFirst({
      where: {
        ownerUserId,
        trialSessionId,
        laundryCustomerId: customer.id,
        packageId: bulk.id,
      },
    });
    if (sub) continue;

    const status = def.remaining <= 0 ? "EXHAUSTED" : def.remaining < 20 ? "ACTIVE" : "ACTIVE";
    await db.laundryCustomerSubscription.create({
      data: {
        ownerUserId,
        trialSessionId,
        laundryCustomerId: customer.id,
        packageId: bulk.id,
        remainingSessions: def.remaining,
        status,
        paymentMethod: "CASH",
      },
    });
  }
}

async function ensureLaundryDemoFinanceDb(
  db: PrismaClient | Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  const revNames = ["ซักรายครั้ง", "แพ็กเหมา", "รับ–ส่ง"];
  const costNames = ["น้ำยาซัก", "ค่าไฟ", "ค่าขนส่ง"];

  for (const [i, name] of revNames.entries()) {
    const exists = await db.laundryRevenueCategory.findFirst({
      where: { ownerUserId, trialSessionId, name },
    });
    if (!exists) {
      await db.laundryRevenueCategory.create({
        data: { ownerUserId, trialSessionId, name, sortOrder: i },
      });
    }
  }

  for (const name of costNames) {
    const exists = await db.laundryCostCategory.findFirst({
      where: { ownerUserId, trialSessionId, name },
    });
    if (!exists) {
      await db.laundryCostCategory.create({ data: { ownerUserId, trialSessionId, name } });
    }
  }

  const revCat = await db.laundryRevenueCategory.findFirst({
    where: { ownerUserId, trialSessionId, name: "ซักรายครั้ง" },
  });
  const costCat = await db.laundryCostCategory.findFirst({
    where: { ownerUserId, trialSessionId, name: "น้ำยาซัก" },
  });

  const revExists = await db.laundryRevenueEntry.findFirst({
    where: { ownerUserId, trialSessionId, note: { startsWith: DEMO_NOTE } },
  });
  if (!revExists && revCat) {
    await db.laundryRevenueEntry.create({
      data: {
        ownerUserId,
        trialSessionId,
        categoryId: revCat.id,
        earnedAt: bangkokDemoAt(9, 0),
        amount: 650,
        itemLabel: "รายรับหน้าร้านเช้า",
        note: `${DEMO_NOTE} — รวมออเดอร์ walk-in`,
        paymentMethod: "CASH",
      },
    });
  }

  const costExists = await db.laundryCostEntry.findFirst({
    where: { ownerUserId, trialSessionId, note: { startsWith: DEMO_NOTE } },
  });
  if (!costExists && costCat) {
    await db.laundryCostEntry.create({
      data: {
        ownerUserId,
        trialSessionId,
        categoryId: costCat.id,
        spentAt: bangkokDemoAt(8, 30),
        amount: 420,
        itemLabel: "น้ำยาซัก + น้ำยาปรับผ้านุ่ม",
        note: `${DEMO_NOTE} — ซื้อสต็อกประจำสัปดาห์`,
      },
    });
  }
}

/** รันชุด demo ครบ — ใช้ใน transaction */
async function seedLaundryDemoBundle(db: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  await ensureLaundryDemoShopProfileDb(db, ownerUserId, trialSessionId);
  await db.laundryPackage.createMany({ data: examplePackageRows(ownerUserId, trialSessionId) });
  await ensureLaundryDemoOrdersDb(db, ownerUserId, trialSessionId);
  await ensureLaundryDemoCustomersDb(db, ownerUserId, trialSessionId);
  await ensureLaundryDemoFinanceDb(db, ownerUserId, trialSessionId);
}

/** แพ็กซักผ้าตัวอย่าง — ใช้ทั้งชุดทดลอง (trial id) และ prod demo */
export async function seedLaundryTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  const n = await tx.laundryPackage.count({ where: { ownerUserId, trialSessionId } });
  if (n === 0) {
    await seedLaundryDemoBundle(tx, ownerUserId, trialSessionId);
    return;
  }
  await ensureLaundryDemoShopProfileDb(tx, ownerUserId, trialSessionId);
  await ensureLaundryExamplePackages(tx, ownerUserId, trialSessionId);
  await ensureLaundryDemoOrdersDb(tx, ownerUserId, trialSessionId);
  await repairLaundryDemoPickupPublicTokensDb(tx, ownerUserId, trialSessionId);
  await ensureLaundryDemoCustomersDb(tx, ownerUserId, trialSessionId);
  await ensureLaundryDemoFinanceDb(tx, ownerUserId, trialSessionId);
}

/** เติมแพ็กตัวอย่างถ้าร้านมีแพ็กเก่าแต่ยังไม่มีชุดตัวอย่างใหม่ */
export async function ensureLaundryExamplePackages(
  db: PrismaClient | Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<number> {
  const rows = await db.laundryPackage.findMany({
    where: { ownerUserId, trialSessionId },
    select: { name: true, totalSessions: true },
  });
  const hasPerUse = rows.some((r) => r.name.includes(EXAMPLE_PER_USE_NAME));
  const hasBulk = rows.some((r) => r.name.includes(EXAMPLE_BULK_NAME));
  const hasExpress = rows.some((r) => r.name.includes(EXAMPLE_EXPRESS_NAME));
  let n = 0;
  const toCreate = examplePackageRows(ownerUserId, trialSessionId).filter((p) => {
    if (p.totalSessions === 1 && p.name.includes(EXAMPLE_EXPRESS_NAME) && hasExpress) return false;
    if (p.totalSessions === 1 && !p.name.includes(EXAMPLE_EXPRESS_NAME) && hasPerUse) return false;
    if (p.totalSessions > 1 && hasBulk) return false;
    return true;
  });
  if (toCreate.length) {
    const r = await db.laundryPackage.createMany({ data: toCreate });
    n += r.count;
  }
  return n;
}

/** @deprecated ใช้ ensureLaundryDemoOrdersDb แทน */
export async function ensureLaundryExamplePickupOrder(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
): Promise<boolean> {
  const n = await ensureLaundryDemoOrdersDb(db, ownerUserId, trialSessionId);
  return n > 0;
}

/** MQTT tenant profile — โค้ดไม่ชนกันทั้งระบบ */
export async function seedMqttProdDemoForOwner(db: PrismaClient, ownerUserId: string): Promise<void> {
  const existing = await db.mqttTenantProfile.findFirst({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE },
    select: { id: true },
  });
  if (existing) return;

  const tenantCode = `seed-${ownerUserId}`.slice(0, 64);
  await db.mqttTenantProfile.create({
    data: {
      ownerUserId,
      trialSessionId: TRIAL_PROD_SCOPE,
      tenantCode,
      displayName: "อุปกรณ์ตัวอย่าง (MQTT)",
      isActive: true,
    },
  });
}

/** ข้อมูลตัวอย่างรับฝากซักผ้า — idempotent ต่อ scope */
async function ensureLaundryDemoForScope(
  db: PrismaClient | Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  await ensureLaundryDemoShopProfileDb(db, ownerUserId, trialSessionId);
  await ensureLaundryExamplePackages(db, ownerUserId, trialSessionId);
  await repairLaundryBrokenSampleImagesDb(db, ownerUserId, trialSessionId);
  await ensureLaundryDemoOrdersDb(db, ownerUserId, trialSessionId);
  await repairLaundryDemoPickupPublicTokensDb(db, ownerUserId, trialSessionId);
  await ensureLaundryDemoCustomersDb(db, ownerUserId, trialSessionId);
  await ensureLaundryDemoFinanceDb(db, ownerUserId, trialSessionId);
}

/** ข้อมูลตัวอย่างรับฝากซักผ้า — prod + trial ที่ยัง active */
export async function seedLaundryProdDemoForOwner(db: PrismaClient, ownerUserId: string): Promise<void> {
  await ensureLaundryDemoForScope(db, ownerUserId, TRIAL_PROD_SCOPE);

  const mod = await db.appModule.findFirst({
    where: { slug: "laundry", isActive: true },
    select: { id: true },
  });
  if (!mod) return;

  const trials = await db.trialSession.findMany({
    where: {
      userId: ownerUserId,
      moduleId: mod.id,
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  for (const t of trials) {
    await ensureLaundryDemoForScope(db, ownerUserId, t.id);
  }
}

/** เติมตัวอย่างให้ทุกบัญชีที่ subscribe โมดูลซักผ้า */
export async function seedLaundryDemoForAllSubscribers(db: PrismaClient): Promise<number> {
  const mod = await db.appModule.findFirst({
    where: { slug: "laundry", isActive: true },
    select: { id: true },
  });
  if (!mod) return 0;

  const rows = (await db.$queryRawUnsafe(
    "SELECT DISTINCT user_id AS userId FROM user_module_subscriptions WHERE module_id = ?",
    mod.id,
  )) as Array<{ userId: string | bigint }>;

  let n = 0;
  for (const row of rows) {
    const userId = String(row.userId);
    await seedLaundryProdDemoForOwner(db, userId);
    n += 1;
  }
  return n;
}
