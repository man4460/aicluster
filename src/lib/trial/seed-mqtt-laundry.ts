import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { DEMO_LAUNDRY_SLIP_URL, DEMO_MODULE_PAYMENT } from "@/lib/trial/demo-module-settings";
import { ensureDemoPaymentSlipFiles } from "@/lib/trial/demo-payment-slip";
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
const EXAMPLE_BULK_50_NAME = "แพ็กเหมา 50 ชิ้น";
const EXAMPLE_EXPRESS_NAME = "ซักด่วน 24 ชม.";
const EXAMPLE_BEDDING_NAME = "ซักผ้าปูที่นอน";
const EXAMPLE_DRYCLEAN_NAME = "ซักแห้งเสื้อสูท";
const DEMO_NOTE = "ตัวอย่างระบบ";
const DEMO_STAFF = "พนักงานตัวอย่าง";

const PACKAGE_NAME_MARKERS = [
  EXAMPLE_PER_USE_NAME,
  EXAMPLE_BULK_NAME,
  EXAMPLE_BULK_50_NAME,
  EXAMPLE_EXPRESS_NAME,
  EXAMPLE_BEDDING_NAME,
  EXAMPLE_DRYCLEAN_NAME,
] as const;

function demoSuffix(trialSessionId: string) {
  return trialSessionId === TRIAL_PROD_SCOPE ? "(ตัวอย่าง)" : "(ทดลอง)";
}

/** วันเวลาไทย — daysAgo=0 คือวันนี้ */
function bangkokOffsetDays(daysAgo: number, hours: number, minutes: number): Date {
  const key = bangkokDateKey();
  const base = new Date(`${key}T12:00:00+07:00`);
  base.setTime(base.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const ymd = bangkokDateKey(base);
  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  return new Date(`${ymd}T${h}:${m}:00+07:00`);
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
      description: "เลือกขนาดตะกร้าเล็ก / กลาง / ใหญ่ — รับผ้าหน้าร้าน POS หรือสั่งรับถึงบ้าน",
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
      name: `${EXAMPLE_BULK_50_NAME} ${suffix}`,
      pricingModel: "PER_ITEM",
      basePrice: 550,
      totalSessions: 50,
      durationHours: new Prisma.Decimal("72"),
      description: "แพ็กเริ่มต้น 50 ครั้ง ราคา 550 บาท — เหมาะลูกค้าประจำรายเดือน",
      imageUrl: LAUNDRY_PACKAGE_SAMPLE_IMAGES[3],
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
      description: "ซัก–อบ–รีดภายใน 24 ชม. — เหมาะงานด่วน นัดรับคืนวันถัดไป",
      imageUrl: LAUNDRY_PACKAGE_SAMPLE_IMAGES[2],
      isActive: true,
    },
    {
      ownerUserId,
      trialSessionId,
      name: `${EXAMPLE_BEDDING_NAME} ${suffix}`,
      pricingModel: "FLAT",
      basePrice: 250,
      totalSessions: 1,
      durationHours: new Prisma.Decimal("72"),
      description: "ผ้าปูที่นอน · ปลอกหมอน · ผ้าห่ม — คิดตามชุด (ไม่รวมม่านหนา)",
      basketTiers: [
        { label: "ชุดเดี่ยว", price: 250 },
        { label: "ชุดคู่", price: 350 },
        { label: "ผ้าห่มหนา", price: 180 },
      ],
      imageUrl: LAUNDRY_PACKAGE_SAMPLE_IMAGES[4],
      isActive: true,
    },
    {
      ownerUserId,
      trialSessionId,
      name: `${EXAMPLE_DRYCLEAN_NAME} ${suffix}`,
      pricingModel: "FLAT",
      basePrice: 200,
      totalSessions: 1,
      durationHours: new Prisma.Decimal("96"),
      description: "ซักแห้งเสื้อสูท / เสื้อโค้ท — ส่งต่อร้านพันธมิตร คืนภายใน 3–4 วัน",
      basketTiers: [
        { label: "เสื้อสูท 1 ตัว", price: 200 },
        { label: "กางเกงสูท", price: 120 },
        { label: "ชุดสูทเต็ม", price: 320 },
      ],
      imageUrl: LAUNDRY_PACKAGE_SAMPLE_IMAGES[5],
      isActive: true,
    },
  ];
}

type DemoOrderDef = {
  /** คีย์ idempotent ใน note — อย่าเปลี่ยนหลังปล่อย seed */
  demoKey: string;
  phone: string;
  customerName: string;
  status: LaundryOrderStatus;
  finalPrice: number;
  serviceTier: string;
  packageMarker: string;
  online: boolean;
  daysAgo: number;
  hour: number;
  minute: number;
  paymentMethod?: string;
  itemCount?: number;
  weightKg?: number;
  addressLine?: string;
  lat?: number;
  lng?: number;
  distanceKm?: number;
};

function demoOrderDefs(): DemoOrderDef[] {
  return [
    // —— วันนี้: คิวออนไลน์รอรับ ——
    {
      demoKey: "ord-online-pending",
      phone: "0812345678",
      customerName: "คุณมานี พรหมมา",
      status: "PENDING_PICKUP",
      finalPrice: 120,
      serviceTier: "ตะกร้ากลาง",
      packageMarker: EXAMPLE_PER_USE_NAME,
      online: true,
      daysAgo: 0,
      hour: 11,
      minute: 45,
      addressLine: "123/4 ซอยสุขใจ แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพฯ 10230",
      lat: 13.816,
      lng: 100.56,
      distanceKm: 3.5,
    },
    {
      demoKey: "ord-online-express",
      phone: "0811111004",
      customerName: "คุณปิติ แสงทอง",
      status: "PENDING_PICKUP",
      finalPrice: 150,
      serviceTier: "ซักด่วน",
      packageMarker: EXAMPLE_EXPRESS_NAME,
      online: true,
      daysAgo: 0,
      hour: 12,
      minute: 10,
      addressLine: "55/9 คอนโดวิวเลค ชั้น 12 แขวงคลองตัน เขตคลองเตย",
      lat: 13.732,
      lng: 100.571,
      distanceKm: 1.2,
    },
    // —— วันนี้: สายงานหน้าร้านหลายสถานะ ——
    {
      demoKey: "ord-walkin-picked",
      phone: "0811111001",
      customerName: "คุณสมชาย ใจดี",
      status: "PICKED_UP",
      finalPrice: 80,
      serviceTier: "ตะกร้าเล็ก",
      packageMarker: EXAMPLE_PER_USE_NAME,
      online: false,
      daysAgo: 0,
      hour: 9,
      minute: 15,
      paymentMethod: "CASH",
      itemCount: 8,
      weightKg: 2.5,
    },
    {
      demoKey: "ord-walkin-sorting",
      phone: "0867778899",
      customerName: "คุณรัตนา มีสุข",
      status: "SORTING",
      finalPrice: 180,
      serviceTier: "ตะกร้าใหญ่",
      packageMarker: EXAMPLE_PER_USE_NAME,
      online: false,
      daysAgo: 0,
      hour: 9,
      minute: 40,
      paymentMethod: "PROMPTPAY",
      itemCount: 22,
      weightKg: 6.2,
    },
    {
      demoKey: "ord-walkin-washing",
      phone: "0811111002",
      customerName: "คุณวิไล สุขสันต์",
      status: "WASHING",
      finalPrice: 120,
      serviceTier: "ตะกร้ากลาง",
      packageMarker: EXAMPLE_PER_USE_NAME,
      online: false,
      daysAgo: 0,
      hour: 10,
      minute: 30,
      paymentMethod: "PROMPTPAY",
      itemCount: 14,
      weightKg: 4.1,
    },
    {
      demoKey: "ord-walkin-drying",
      phone: "0811111006",
      customerName: "คุณอรอุมา จันทร์เพ็ญ",
      status: "DRYING",
      finalPrice: 80,
      serviceTier: "ตะกร้าเล็ก",
      packageMarker: EXAMPLE_PER_USE_NAME,
      online: false,
      daysAgo: 0,
      hour: 13,
      minute: 20,
      paymentMethod: "CASH",
      itemCount: 6,
      weightKg: 1.8,
    },
    {
      demoKey: "ord-walkin-ironing",
      phone: "0811111003",
      customerName: "คุณนภา วัฒนา",
      status: "IRONING",
      finalPrice: 180,
      serviceTier: "ตะกร้าใหญ่",
      packageMarker: EXAMPLE_PER_USE_NAME,
      online: false,
      daysAgo: 0,
      hour: 11,
      minute: 0,
      paymentMethod: "CASH",
      itemCount: 20,
      weightKg: 5.5,
    },
    {
      demoKey: "ord-walkin-ready",
      phone: "0811111005",
      customerName: "คุณกานต์ธีร์ รุ่งเรือง",
      status: "READY_TO_DELIVER",
      finalPrice: 120,
      serviceTier: "ตะกร้ากลาง",
      packageMarker: EXAMPLE_PER_USE_NAME,
      online: false,
      daysAgo: 0,
      hour: 8,
      minute: 0,
      paymentMethod: "CASH",
      itemCount: 12,
      weightKg: 3.4,
    },
    {
      demoKey: "ord-online-delivering",
      phone: "0895556677",
      customerName: "คุณเบญจมาศ ศรีสุข",
      status: "DELIVERING",
      finalPrice: 250,
      serviceTier: "ชุดคู่",
      packageMarker: EXAMPLE_BEDDING_NAME,
      online: true,
      daysAgo: 0,
      hour: 7,
      minute: 30,
      paymentMethod: "TRANSFER",
      addressLine: "88/2 หมู่บ้านสวนสน ซอย 5 แขวงบางจาก เขตพระโขนง",
      lat: 13.69,
      lng: 100.605,
      distanceKm: 5.8,
      itemCount: 4,
      weightKg: 8.0,
    },
    {
      demoKey: "ord-walkin-completed-today",
      phone: "0823334455",
      customerName: "คุณธนพล อรุณ",
      status: "COMPLETED",
      finalPrice: 80,
      serviceTier: "ตะกร้าเล็ก",
      packageMarker: EXAMPLE_PER_USE_NAME,
      online: false,
      daysAgo: 0,
      hour: 7,
      minute: 50,
      paymentMethod: "CASH",
      itemCount: 7,
      weightKg: 2.0,
    },
    // —— เมื่อวาน / ย้อนหลัง ——
    {
      demoKey: "ord-yest-completed",
      phone: "0834445566",
      customerName: "คุณสุชาดา แก้วมณี",
      status: "COMPLETED",
      finalPrice: 180,
      serviceTier: "ตะกร้าใหญ่",
      packageMarker: EXAMPLE_PER_USE_NAME,
      online: false,
      daysAgo: 1,
      hour: 16,
      minute: 20,
      paymentMethod: "PROMPTPAY",
      itemCount: 18,
      weightKg: 5.0,
    },
    {
      demoKey: "ord-yest-express-done",
      phone: "0845556677",
      customerName: "คุณอิทธิพล มั่นคง",
      status: "COMPLETED",
      finalPrice: 150,
      serviceTier: "ซักด่วน",
      packageMarker: EXAMPLE_EXPRESS_NAME,
      online: false,
      daysAgo: 1,
      hour: 10,
      minute: 5,
      paymentMethod: "CASH",
      itemCount: 10,
      weightKg: 3.0,
    },
    {
      demoKey: "ord-2d-online-done",
      phone: "0856667788",
      customerName: "คุณพัชรินทร์ ลิขิต",
      status: "COMPLETED",
      finalPrice: 165,
      serviceTier: "ตะกร้ากลาง + ค่ารับส่ง",
      packageMarker: EXAMPLE_PER_USE_NAME,
      online: true,
      daysAgo: 2,
      hour: 14,
      minute: 0,
      paymentMethod: "PROMPTPAY",
      addressLine: "12 ซอยรามคำแหง 24 แขวงหัวหมาก เขตบางกะปิ",
      lat: 13.752,
      lng: 100.628,
      distanceKm: 4.2,
      itemCount: 11,
      weightKg: 3.8,
    },
    {
      demoKey: "ord-3d-dryclean",
      phone: "0878889900",
      customerName: "คุณวรวุฒิ อัศวิน",
      status: "IRONING",
      finalPrice: 320,
      serviceTier: "ชุดสูทเต็ม",
      packageMarker: EXAMPLE_DRYCLEAN_NAME,
      online: false,
      daysAgo: 3,
      hour: 11,
      minute: 30,
      paymentMethod: "TRANSFER",
      itemCount: 2,
      weightKg: 1.2,
    },
    {
      demoKey: "ord-4d-cancelled",
      phone: "0889990011",
      customerName: "คุณกิติยา เปลี่ยนใจ",
      status: "CANCELLED",
      finalPrice: 120,
      serviceTier: "ตะกร้ากลาง",
      packageMarker: EXAMPLE_PER_USE_NAME,
      online: true,
      daysAgo: 4,
      hour: 9,
      minute: 0,
      addressLine: "9/11 อาคารพาณิชย์ ถ.พระราม 9 แขวงบางกะปิ",
      lat: 13.745,
      lng: 100.62,
      distanceKm: 2.1,
    },
    {
      demoKey: "ord-5d-bedding-done",
      phone: "0890001122",
      customerName: "คุณเมธาวี สุขใจ",
      status: "COMPLETED",
      finalPrice: 350,
      serviceTier: "ชุดคู่",
      packageMarker: EXAMPLE_BEDDING_NAME,
      online: false,
      daysAgo: 5,
      hour: 15,
      minute: 45,
      paymentMethod: "CASH",
      itemCount: 6,
      weightKg: 9.5,
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
  const label = isProd ? "FreshFold Laundry (ตัวอย่าง)" : "FreshFold Laundry (ทดลอง)";
  const data = {
    displayName: label,
    tagline: "ซักรีด · รับ–ส่งถึงบ้าน · แพ็กเหมา — บริการครบวงจรใกล้บ้านคุณ",
    logoUrl: LAUNDRY_PORTAL_SAMPLE_LOGO,
    contactPhone: "0890003344",
    contactLine: "@freshfold-laundry",
    facebookUrl: "https://www.facebook.com/mawell.demo.laundry",
    mapUrl: "https://maps.google.com/?q=13.7307,100.5696",
    address: "88/12 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110",
    taxId: DEMO_MODULE_PAYMENT.taxId,
    shopLat: new Prisma.Decimal("13.7307000"),
    shopLng: new Prisma.Decimal("100.5696000"),
    pickupFeePerKmBaht: 15,
    openTime: "08:00",
    closeTime: "21:00",
    portalBannerUrl: LAUNDRY_PORTAL_SAMPLE_BANNER,
    portalGalleryJson: laundrySerializePortalGallery([...LAUNDRY_PORTAL_SAMPLE_GALLERY]),
    portalBookingPaymentMode: "DEPOSIT",
    depositAmountBaht: 50,
    promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
    bankName: DEMO_MODULE_PAYMENT.bankName,
    bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
    bankAccountName: "หจก.เฟรชโฟลด์ ซักรีด",
    payAmountPresets: "80,100,120,150,180,250,350",
    slipPaperSize: "SLIP_58",
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

async function findPackageByMarker(
  db: PrismaClient | Tx,
  ownerUserId: string,
  trialSessionId: string,
  marker: string,
) {
  return db.laundryPackage.findFirst({
    where: { ownerUserId, trialSessionId, name: { contains: marker } },
    orderBy: { id: "asc" },
  });
}

async function ensureLaundryDemoOrdersDb(
  db: PrismaClient | Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<number> {
  let created = 0;
  for (const def of demoOrderDefs()) {
    const noteTag = `${DEMO_NOTE} · ${def.demoKey}`;
    const exists = await db.laundryOrder.findFirst({
      where: {
        ownerUserId,
        trialSessionId,
        note: { contains: def.demoKey },
      },
      select: { id: true },
    });
    if (exists) continue;

    // รองรับ seed รุ่นเก่าที่จับคู่ด้วยเบอร์ + DEMO_NOTE
    const legacy = await db.laundryOrder.findFirst({
      where: {
        ownerUserId,
        trialSessionId,
        customerPhone: def.phone,
        note: { startsWith: DEMO_NOTE },
      },
      select: { id: true },
    });
    if (legacy) {
      await db.laundryOrder.update({
        where: { id: legacy.id },
        data: {
          note: `${noteTag} — ${def.online ? "คิวสั่งออนไลน์" : "ออเดอร์หน้าร้าน"}`,
          status: def.status,
          finalPrice: def.finalPrice,
          orderAt: bangkokOffsetDays(def.daysAgo, def.hour, def.minute),
          itemCount: def.itemCount ?? 0,
          weightKg: new Prisma.Decimal(String(def.weightKg ?? 0)),
          paymentMethod: def.paymentMethod ?? null,
          receiptImageUrl:
            def.paymentMethod === "PROMPTPAY" || def.paymentMethod === "TRANSFER"
              ? DEMO_LAUNDRY_SLIP_URL
              : null,
        },
      });
      continue;
    }

    const pkg = await findPackageByMarker(db, ownerUserId, trialSessionId, def.packageMarker);
    const pkgName = pkg?.name ?? def.packageMarker;
    const addr = def.addressLine ?? "123/4 ซอยสุขใจ แขวงลาดพร้าว";

    await db.laundryOrder.create({
      data: {
        ownerUserId,
        trialSessionId,
        orderAt: bangkokOffsetDays(def.daysAgo, def.hour, def.minute),
        customerName: def.customerName,
        customerPhone: def.phone,
        pickupAddress: def.online
          ? `${def.customerName} — ${addr}\nพิกัด GPS: ${def.lat ?? 13.816}, ${def.lng ?? 100.56}`
          : "หน้าร้าน",
        dropoffAddress: def.online ? addr : "หน้าร้าน",
        serviceType: `${pkgName} (${def.serviceTier})`,
        packageId: pkg?.id ?? null,
        packageName: pkgName,
        weightKg: new Prisma.Decimal(String(def.weightKg ?? 0)),
        itemCount: def.itemCount ?? 0,
        finalPrice: def.finalPrice,
        note: `${noteTag} — ${def.online ? "คิวสั่งออนไลน์" : "ออเดอร์หน้าร้าน"}`,
        recordedByName: def.online ? LAUNDRY_RECORDED_BY_CUSTOMER_PICKUP_QR : DEMO_STAFF,
        status: def.status,
        distanceKm:
          def.online && def.distanceKm != null ? new Prisma.Decimal(String(def.distanceKm)) : null,
        pickupLat: def.online && def.lat != null ? new Prisma.Decimal(String(def.lat)) : null,
        pickupLng: def.online && def.lng != null ? new Prisma.Decimal(String(def.lng)) : null,
        paymentMethod: def.paymentMethod ?? null,
        receiptImageUrl:
          def.paymentMethod === "PROMPTPAY" || def.paymentMethod === "TRANSFER"
            ? DEMO_LAUNDRY_SLIP_URL
            : null,
        pickupPublicToken: def.online ? randomUUID() : null,
      },
    });
    created += 1;
  }
  return created;
}

type DemoCustomerDef = {
  phone: string;
  name: string;
  packageMarker: string;
  remaining: number;
  status: "ACTIVE" | "EXHAUSTED" | "CANCELLED";
  paymentMethod: string;
  taxInvoice?: boolean;
  billingName?: string;
  taxId?: string;
  taxAddress?: string;
};

function demoCustomerDefs(): DemoCustomerDef[] {
  return [
    {
      phone: "0892223344",
      name: "คุณพิมพ์ ใจงาม",
      packageMarker: EXAMPLE_BULK_NAME,
      remaining: 87,
      status: "ACTIVE",
      paymentMethod: "CASH",
    },
    {
      phone: "0823456789",
      name: "คุณชัยวัฒน์ รุ่งเรือง",
      packageMarker: EXAMPLE_BULK_NAME,
      remaining: 12,
      status: "ACTIVE",
      paymentMethod: "PROMPTPAY",
    },
    {
      phone: "0812345678",
      name: "คุณมานี พรหมมา",
      packageMarker: EXAMPLE_BULK_50_NAME,
      remaining: 38,
      status: "ACTIVE",
      paymentMethod: "TRANSFER",
      taxInvoice: true,
      billingName: "บริษัท มานีกรุ๊ป จำกัด",
      taxId: "0105555123456",
      taxAddress: "123/4 ซอยสุขใจ แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพฯ 10230",
    },
    {
      phone: "0901112233",
      name: "คุณศิริพร แสงจันทร์",
      packageMarker: EXAMPLE_BULK_50_NAME,
      remaining: 3,
      status: "ACTIVE",
      paymentMethod: "CASH",
    },
    {
      phone: "0912223344",
      name: "คุณณัฐวุฒิ หมดสิทธิ์",
      packageMarker: EXAMPLE_BULK_50_NAME,
      remaining: 0,
      status: "EXHAUSTED",
      paymentMethod: "PROMPTPAY",
    },
    {
      phone: "0923334455",
      name: "คุณอารียา ยกเลิกแพ็ก",
      packageMarker: EXAMPLE_BULK_NAME,
      remaining: 45,
      status: "CANCELLED",
      paymentMethod: "CASH",
    },
  ];
}

async function ensureLaundryDemoCustomersDb(
  db: PrismaClient | Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  for (const def of demoCustomerDefs()) {
    const pkg = await findPackageByMarker(db, ownerUserId, trialSessionId, def.packageMarker);
    if (!pkg) continue;

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
          taxInvoiceEnabled: def.taxInvoice ?? false,
          billingName: def.billingName ?? "",
          taxId: def.taxId ?? "",
          taxAddress: def.taxAddress ?? "",
        },
      });
    } else if (def.taxInvoice && !customer.taxInvoiceEnabled) {
      customer = await db.laundryCustomer.update({
        where: { id: customer.id },
        data: {
          name: def.name,
          taxInvoiceEnabled: true,
          billingName: def.billingName ?? "",
          taxId: def.taxId ?? "",
          taxAddress: def.taxAddress ?? "",
        },
      });
    }

    const sub = await db.laundryCustomerSubscription.findFirst({
      where: {
        ownerUserId,
        trialSessionId,
        laundryCustomerId: customer.id,
        packageId: pkg.id,
      },
    });
    if (sub) continue;

    await db.laundryCustomerSubscription.create({
      data: {
        ownerUserId,
        trialSessionId,
        laundryCustomerId: customer.id,
        packageId: pkg.id,
        remainingSessions: def.remaining,
        status: def.status,
        paymentMethod: def.paymentMethod,
        saleReceiptImageUrl: DEMO_LAUNDRY_SLIP_URL,
      },
    });
  }
}

async function ensureLaundryDemoServiceLogsDb(
  db: PrismaClient | Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  const defs = [
    {
      logKey: "log-sale-print",
      phone: "0892223344",
      visitType: "PACKAGE_SALE" as const,
      amount: 1000,
      daysAgo: 14,
      hour: 10,
      note: "ขายแพ็กเกจ · แพ็กเหมา 100 ชิ้น",
      paymentMethod: "CASH",
    },
    {
      logKey: "log-sale-manee",
      phone: "0812345678",
      visitType: "PACKAGE_SALE" as const,
      amount: 550,
      daysAgo: 7,
      hour: 11,
      note: "ขายแพ็กเกจ · แพ็กเหมา 50 ชิ้น",
      paymentMethod: "TRANSFER",
    },
    {
      logKey: "log-use-print-1",
      phone: "0892223344",
      visitType: "PACKAGE_USE" as const,
      amount: null as number | null,
      daysAgo: 3,
      hour: 9,
      note: "หักแพ็กเกจ · แพ็กเหมา 100 ชิ้น",
      paymentMethod: null as string | null,
    },
    {
      logKey: "log-use-print-2",
      phone: "0892223344",
      visitType: "PACKAGE_USE" as const,
      amount: null,
      daysAgo: 1,
      hour: 14,
      note: "หักแพ็กเกจ · แพ็กเหมา 100 ชิ้น",
      paymentMethod: null,
    },
    {
      logKey: "log-use-chai",
      phone: "0823456789",
      visitType: "PACKAGE_USE" as const,
      amount: null,
      daysAgo: 2,
      hour: 16,
      note: "หักแพ็กเกจ · แพ็กเหมา 100 ชิ้น",
      paymentMethod: null,
    },
    {
      logKey: "log-cash-walkin",
      phone: "0811111001",
      visitType: "CASH_WALK_IN" as const,
      amount: 80,
      daysAgo: 0,
      hour: 9,
      note: "ซักรายครั้ง · ตะกร้าเล็ก",
      paymentMethod: "CASH",
    },
  ];

  for (const def of defs) {
    const noteTag = `${DEMO_NOTE} · ${def.logKey}`;
    const exists = await db.laundryServiceLog.findFirst({
      where: { ownerUserId, trialSessionId, note: { contains: def.logKey } },
      select: { id: true },
    });
    if (exists) continue;

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
          name: def.phone === "0811111001" ? "คุณสมชาย ใจดี" : undefined,
        },
      });
    }

    const sub = await db.laundryCustomerSubscription.findFirst({
      where: { ownerUserId, trialSessionId, laundryCustomerId: customer.id },
      orderBy: { id: "asc" },
    });

    await db.laundryServiceLog.create({
      data: {
        ownerUserId,
        trialSessionId,
        laundryCustomerId: customer.id,
        subscriptionId: def.visitType === "CASH_WALK_IN" ? null : (sub?.id ?? null),
        visitType: def.visitType,
        amountBaht: def.amount != null ? new Prisma.Decimal(String(def.amount)) : null,
        receiptImageUrl:
          def.paymentMethod === "PROMPTPAY" || def.paymentMethod === "TRANSFER"
            ? DEMO_LAUNDRY_SLIP_URL
            : def.visitType === "PACKAGE_SALE"
              ? DEMO_LAUNDRY_SLIP_URL
              : null,
        paymentMethod: def.paymentMethod,
        note: `${noteTag} — ${def.note}`,
        createdAt: bangkokOffsetDays(def.daysAgo, def.hour, 15),
      },
    });
  }
}

async function ensureLaundryDemoFinanceDb(
  db: PrismaClient | Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  const revNames = ["ซักรายครั้ง", "แพ็กเหมา", "รับ–ส่ง", "ซักแห้ง / พิเศษ"];
  const costNames = ["น้ำยาซัก", "ค่าไฟ", "ค่าขนส่ง", "ค่าซ่อมเครื่อง", "วัสดุแพ็ก"];

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

  const revByName = async (name: string) =>
    db.laundryRevenueCategory.findFirst({ where: { ownerUserId, trialSessionId, name } });
  const costByName = async (name: string) =>
    db.laundryCostCategory.findFirst({ where: { ownerUserId, trialSessionId, name } });

  const revEntries = [
    {
      key: "rev-walkin-morning",
      cat: "ซักรายครั้ง",
      daysAgo: 0,
      hour: 9,
      amount: 650,
      label: "รายรับหน้าร้านเช้า",
      note: "รวมออเดอร์ walk-in",
      payment: "CASH",
    },
    {
      key: "rev-online-pickup",
      cat: "รับ–ส่ง",
      daysAgo: 0,
      hour: 12,
      amount: 105,
      label: "ค่ารับผ้าออนไลน์",
      note: "ค่าขนส่งตามระยะ",
      payment: "PROMPTPAY",
    },
    {
      key: "rev-package-sale",
      cat: "แพ็กเหมา",
      daysAgo: 1,
      hour: 11,
      amount: 1000,
      label: "ขายแพ็กเหมา 100 ชิ้น",
      note: "สมาชิกคุณพิมพ์",
      payment: "CASH",
    },
    {
      key: "rev-express",
      cat: "ซักรายครั้ง",
      daysAgo: 1,
      hour: 16,
      amount: 450,
      label: "ซักด่วนรอบเย็น",
      note: "3 ออเดอร์",
      payment: "PROMPTPAY",
    },
    {
      key: "rev-bedding",
      cat: "ซักแห้ง / พิเศษ",
      daysAgo: 5,
      hour: 15,
      amount: 350,
      label: "ซักผ้าปูที่นอนชุดคู่",
      note: "ลูกค้าประจำ",
      payment: "CASH",
    },
    {
      key: "rev-weekend",
      cat: "ซักรายครั้ง",
      daysAgo: 3,
      hour: 18,
      amount: 980,
      label: "รายรับช่วงเย็น",
      note: "คิวแน่นวันธรรมดา",
      payment: "CASH",
    },
  ] as const;

  for (const e of revEntries) {
    const exists = await db.laundryRevenueEntry.findFirst({
      where: { ownerUserId, trialSessionId, note: { contains: e.key } },
    });
    if (exists) continue;
    const cat = await revByName(e.cat);
    if (!cat) continue;
    await db.laundryRevenueEntry.create({
      data: {
        ownerUserId,
        trialSessionId,
        categoryId: cat.id,
        earnedAt: bangkokOffsetDays(e.daysAgo, e.hour, 0),
        amount: e.amount,
        itemLabel: e.label,
        note: `${DEMO_NOTE} · ${e.key} — ${e.note}`,
        paymentMethod: e.payment,
        slipPhotoUrl: e.payment === "PROMPTPAY" ? DEMO_LAUNDRY_SLIP_URL : "",
      },
    });
  }

  const costEntries = [
    {
      key: "cost-detergent",
      cat: "น้ำยาซัก",
      daysAgo: 0,
      hour: 8,
      amount: 420,
      label: "น้ำยาซัก + น้ำยาปรับผ้านุ่ม",
      note: "ซื้อสต็อกประจำสัปดาห์",
    },
    {
      key: "cost-electric",
      cat: "ค่าไฟ",
      daysAgo: 2,
      hour: 10,
      amount: 1850,
      label: "ค่าไฟรอบบิลกลางเดือน",
      note: "เครื่องอบใช้หนัก",
    },
    {
      key: "cost-delivery",
      cat: "ค่าขนส่ง",
      daysAgo: 1,
      hour: 17,
      amount: 280,
      label: "ค่าน้ำมันรับ–ส่งผ้า",
      note: "รอบเย็น 6 จุด",
    },
    {
      key: "cost-repair",
      cat: "ค่าซ่อมเครื่อง",
      daysAgo: 6,
      hour: 14,
      amount: 1200,
      label: "เปลี่ยนสายพานเครื่องอบ",
      note: "ช่างประจำ",
    },
    {
      key: "cost-bags",
      cat: "วัสดุแพ็ก",
      daysAgo: 4,
      hour: 9,
      amount: 350,
      label: "ถุงผ้า + ป้ายชื่อลูกค้า",
      note: "สั่ง 200 ใบ",
    },
  ] as const;

  for (const e of costEntries) {
    const exists = await db.laundryCostEntry.findFirst({
      where: { ownerUserId, trialSessionId, note: { contains: e.key } },
    });
    if (exists) continue;
    const cat = await costByName(e.cat);
    if (!cat) continue;
    await db.laundryCostEntry.create({
      data: {
        ownerUserId,
        trialSessionId,
        categoryId: cat.id,
        spentAt: bangkokOffsetDays(e.daysAgo, e.hour, 30),
        amount: e.amount,
        itemLabel: e.label,
        note: `${DEMO_NOTE} · ${e.key} — ${e.note}`,
        slipPhotoUrl: DEMO_LAUNDRY_SLIP_URL,
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
  await ensureLaundryDemoServiceLogsDb(db, ownerUserId, trialSessionId);
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
  await ensureLaundryDemoServiceLogsDb(tx, ownerUserId, trialSessionId);
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
    select: { name: true },
  });
  const missing = PACKAGE_NAME_MARKERS.filter((m) => !rows.some((r) => r.name.includes(m)));
  if (!missing.length) return 0;
  const toCreate = examplePackageRows(ownerUserId, trialSessionId).filter((p) =>
    missing.some((m) => p.name.includes(m)),
  );
  if (!toCreate.length) return 0;
  const r = await db.laundryPackage.createMany({ data: toCreate });
  return r.count;
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
  await ensureLaundryDemoServiceLogsDb(db, ownerUserId, trialSessionId);
  await ensureLaundryDemoFinanceDb(db, ownerUserId, trialSessionId);
}

/** ข้อมูลตัวอย่างรับฝากซักผ้า — prod + trial ที่ยัง active */
export async function seedLaundryProdDemoForOwner(db: PrismaClient, ownerUserId: string): Promise<void> {
  await ensureDemoPaymentSlipFiles();
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
