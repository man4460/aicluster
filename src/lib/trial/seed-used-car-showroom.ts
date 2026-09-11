import type { PrismaClient } from "@/generated/prisma/client";
import { bangkokDateKeyMinusDays } from "@/lib/barber/bangkok-day";
import {
  DEMO_MODULE_CONTACT,
  DEMO_MODULE_PAYMENT,
  DEMO_PAYMENT_SLIP_URL,
  trialDemoDisplayName,
} from "@/lib/trial/demo-module-settings";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { ensureUsedCarShowroomShop } from "@/systems/used-car-showroom/lib/ensure-shop";
import {
  USED_CAR_PORTAL_SAMPLE_BANNER,
  USED_CAR_PORTAL_SAMPLE_GALLERY,
  USED_CAR_SAMPLE_YOUTUBE,
  USED_CAR_SHOWROOM_SAMPLE_LOGO,
  usedCarVehicleSampleImageSet,
} from "@/systems/used-car-showroom/lib/portal-media";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;
type DbLike = PrismaClient | Tx;

const DEMO_NOTE = "[UCS_DEMO]";

/** ย้อนหลังกี่วัน + นัดล่วงหน้า — ให้กราฟ/ภาพรวมมีจุดข้อมูลทุกวัน */
const HISTORY_DAYS = 30;
const AHEAD_DAYS = 3;

const VEHICLES: ReadonlyArray<{
  brand: string;
  model: string;
  year: number;
  color: string;
  mileageKm: number;
  transmission: string;
  fuelType: string;
  bodyType: string;
  status: "PREP" | "FOR_SALE" | "RESERVED" | "SOLD" | "DELIVERED";
  purchaseCostBaht: number;
  askingPriceBaht: number;
  plate: string;
  /** ขายไปกี่วันก่อน (เฉพาะ SOLD/DELIVERED) */
  soldDaysAgo?: number;
}> = [
  { brand: "Toyota", model: "Fortuner 2.8 V", year: 2019, color: "ขาวมุก", mileageKm: 78500, transmission: "AUTO", fuelType: "DIESEL", bodyType: "SUV", status: "FOR_SALE", purchaseCostBaht: 890000, askingPriceBaht: 1050000, plate: "1กก 1234" },
  { brand: "Honda", model: "Civic RS", year: 2020, color: "แดง", mileageKm: 42000, transmission: "CVT", fuelType: "GASOLINE", bodyType: "SEDAN", status: "FOR_SALE", purchaseCostBaht: 620000, askingPriceBaht: 749000, plate: "2ขข 5566" },
  { brand: "Isuzu", model: "D-Max Hi-Lander", year: 2018, color: "เทา", mileageKm: 112000, transmission: "AUTO", fuelType: "DIESEL", bodyType: "PICKUP", status: "FOR_SALE", purchaseCostBaht: 480000, askingPriceBaht: 579000, plate: "3คง 7788" },
  { brand: "Mazda", model: "CX-5 2.0", year: 2021, color: "น้ำเงิน", mileageKm: 31000, transmission: "AUTO", fuelType: "GASOLINE", bodyType: "SUV", status: "FOR_SALE", purchaseCostBaht: 780000, askingPriceBaht: 899000, plate: "4จจ 9900" },
  { brand: "Mitsubishi", model: "Pajero Sport", year: 2017, color: "ดำ", mileageKm: 98000, transmission: "AUTO", fuelType: "DIESEL", bodyType: "SUV", status: "FOR_SALE", purchaseCostBaht: 650000, askingPriceBaht: 759000, plate: "5ฉฉ 1122" },
  { brand: "Nissan", model: "Almera VL", year: 2022, color: "เงิน", mileageKm: 18000, transmission: "CVT", fuelType: "GASOLINE", bodyType: "SEDAN", status: "FOR_SALE", purchaseCostBaht: 390000, askingPriceBaht: 459000, plate: "6ชช 3344" },
  { brand: "Toyota", model: "Hilux Revo", year: 2019, color: "ขาว", mileageKm: 87000, transmission: "MANUAL", fuelType: "DIESEL", bodyType: "PICKUP", status: "FOR_SALE", purchaseCostBaht: 520000, askingPriceBaht: 619000, plate: "7ซซ 5566" },
  { brand: "Honda", model: "CR-V EL", year: 2018, color: "น้ำตาล", mileageKm: 95000, transmission: "CVT", fuelType: "GASOLINE", bodyType: "SUV", status: "RESERVED", purchaseCostBaht: 700000, askingPriceBaht: 829000, plate: "8ฌฌ 7788" },
  { brand: "Ford", model: "Ranger Wildtrak", year: 2020, color: "ส้ม", mileageKm: 64000, transmission: "AUTO", fuelType: "DIESEL", bodyType: "PICKUP", status: "FOR_SALE", purchaseCostBaht: 680000, askingPriceBaht: 799000, plate: "9ญญ 9900" },
  { brand: "MG", model: "ZS EV", year: 2021, color: "ขาว", mileageKm: 28000, transmission: "AUTO", fuelType: "EV", bodyType: "SUV", status: "FOR_SALE", purchaseCostBaht: 550000, askingPriceBaht: 649000, plate: "10ดด 1234" },
  { brand: "Toyota", model: "Camry Hybrid", year: 2019, color: "ดำ", mileageKm: 72000, transmission: "CVT", fuelType: "HYBRID", bodyType: "SEDAN", status: "FOR_SALE", purchaseCostBaht: 720000, askingPriceBaht: 849000, plate: "11ตต 5678" },
  { brand: "Suzuki", model: "Swift GLX", year: 2020, color: "เหลือง", mileageKm: 35000, transmission: "AUTO", fuelType: "GASOLINE", bodyType: "OTHER", status: "FOR_SALE", purchaseCostBaht: 320000, askingPriceBaht: 389000, plate: "12ถถ 9012" },
  { brand: "Hyundai", model: "H-1 Elite", year: 2017, color: "เทา", mileageKm: 120000, transmission: "AUTO", fuelType: "DIESEL", bodyType: "VAN", status: "PREP", purchaseCostBaht: 580000, askingPriceBaht: 679000, plate: "13ทท 3456" },
  { brand: "Toyota", model: "Yaris Ativ", year: 2021, color: "แดง", mileageKm: 24000, transmission: "CVT", fuelType: "GASOLINE", bodyType: "SEDAN", status: "FOR_SALE", purchaseCostBaht: 360000, askingPriceBaht: 429000, plate: "14ธธ 7890" },
  { brand: "Honda", model: "City Hatchback", year: 2022, color: "น้ำเงิน", mileageKm: 15000, transmission: "CVT", fuelType: "GASOLINE", bodyType: "OTHER", status: "FOR_SALE", purchaseCostBaht: 430000, askingPriceBaht: 509000, plate: "15นน 1357" },
  { brand: "Toyota", model: "Alphard", year: 2016, color: "ดำ", mileageKm: 140000, transmission: "AUTO", fuelType: "GASOLINE", bodyType: "MPV", status: "FOR_SALE", purchaseCostBaht: 1100000, askingPriceBaht: 1290000, plate: "18ผผ 1470" },
  { brand: "BMW", model: "320d", year: 2017, color: "ขาว", mileageKm: 88000, transmission: "AUTO", fuelType: "DIESEL", bodyType: "SEDAN", status: "FOR_SALE", purchaseCostBaht: 850000, askingPriceBaht: 989000, plate: "19ฝฝ 2580" },
  { brand: "Mercedes-Benz", model: "C200", year: 2018, color: "เงิน", mileageKm: 76000, transmission: "AUTO", fuelType: "GASOLINE", bodyType: "SEDAN", status: "FOR_SALE", purchaseCostBaht: 920000, askingPriceBaht: 1090000, plate: "20พพ 3691" },
  /* ประวัติขายกระจายทุกวันในช่วง ~30 วัน */
  { brand: "Isuzu", model: "MU-X", year: 2018, color: "ขาว", mileageKm: 105000, transmission: "AUTO", fuelType: "DIESEL", bodyType: "SUV", status: "SOLD", purchaseCostBaht: 700000, askingPriceBaht: 820000, plate: "16บบ 2468", soldDaysAgo: 1 },
  { brand: "Mazda", model: "2 Sedan", year: 2019, color: "เทา", mileageKm: 55000, transmission: "AUTO", fuelType: "GASOLINE", bodyType: "SEDAN", status: "DELIVERED", purchaseCostBaht: 340000, askingPriceBaht: 399000, plate: "17ปป 3690", soldDaysAgo: 3 },
  { brand: "Toyota", model: "Vios", year: 2019, color: "ขาว", mileageKm: 68000, transmission: "AUTO", fuelType: "GASOLINE", bodyType: "SEDAN", status: "DELIVERED", purchaseCostBaht: 310000, askingPriceBaht: 369000, plate: "21ฟฟ 1122", soldDaysAgo: 5 },
  { brand: "Honda", model: "Jazz RS", year: 2018, color: "แดง", mileageKm: 79000, transmission: "CVT", fuelType: "GASOLINE", bodyType: "OTHER", status: "SOLD", purchaseCostBaht: 380000, askingPriceBaht: 449000, plate: "22ภภ 3344", soldDaysAgo: 7 },
  { brand: "Isuzu", model: "D-Max Cab", year: 2017, color: "เทา", mileageKm: 130000, transmission: "MANUAL", fuelType: "DIESEL", bodyType: "PICKUP", status: "DELIVERED", purchaseCostBaht: 420000, askingPriceBaht: 499000, plate: "23มม 5566", soldDaysAgo: 9 },
  { brand: "Nissan", model: "Navara", year: 2019, color: "ดำ", mileageKm: 91000, transmission: "AUTO", fuelType: "DIESEL", bodyType: "PICKUP", status: "SOLD", purchaseCostBaht: 510000, askingPriceBaht: 599000, plate: "24ยย 7788", soldDaysAgo: 11 },
  { brand: "Toyota", model: "Innova Crysta", year: 2018, color: "เงิน", mileageKm: 102000, transmission: "AUTO", fuelType: "DIESEL", bodyType: "MPV", status: "DELIVERED", purchaseCostBaht: 590000, askingPriceBaht: 689000, plate: "25รร 9900", soldDaysAgo: 14 },
  { brand: "Mitsubishi", model: "Triton", year: 2020, color: "ขาว", mileageKm: 54000, transmission: "AUTO", fuelType: "DIESEL", bodyType: "PICKUP", status: "SOLD", purchaseCostBaht: 560000, askingPriceBaht: 659000, plate: "26ลล 1357", soldDaysAgo: 17 },
  { brand: "Ford", model: "Everest", year: 2018, color: "น้ำตาล", mileageKm: 98000, transmission: "AUTO", fuelType: "DIESEL", bodyType: "SUV", status: "DELIVERED", purchaseCostBaht: 720000, askingPriceBaht: 849000, plate: "27วว 2468", soldDaysAgo: 20 },
  { brand: "Honda", model: "HR-V", year: 2019, color: "น้ำเงิน", mileageKm: 61000, transmission: "CVT", fuelType: "GASOLINE", bodyType: "SUV", status: "SOLD", purchaseCostBaht: 540000, askingPriceBaht: 629000, plate: "28ศศ 3690", soldDaysAgo: 23 },
  { brand: "Toyota", model: "Corolla Altis", year: 2017, color: "เทา", mileageKm: 115000, transmission: "CVT", fuelType: "GASOLINE", bodyType: "SEDAN", status: "DELIVERED", purchaseCostBaht: 360000, askingPriceBaht: 429000, plate: "29ษษ 4812", soldDaysAgo: 26 },
  { brand: "Mazda", model: "CX-3", year: 2020, color: "แดง", mileageKm: 41000, transmission: "AUTO", fuelType: "GASOLINE", bodyType: "SUV", status: "SOLD", purchaseCostBaht: 480000, askingPriceBaht: 559000, plate: "30สห 5924", soldDaysAgo: 28 },
];

const FIRST_NAMES = [
  "สมชาย", "วิภา", "อนุชา", "กมล", "ปรียา", "ธีรพงษ์", "นฤมล", "ชัยวัฒน์", "พิมพ์ใจ", "วรพล",
  "สุนิสา", "กิตติ", "อรทัย", "พงศกร", "มาลี", "ธนา", "ศิริพร", "จักรพงษ์", "เบญจมาศ", "อภิชาติ",
  "ปิยะ", "ณัฐพร", "วรรณา", "สุรชัย", "อรุณี", "เมธา", "กานต์", "รติ", "ชุติมา", "อดิศักดิ์",
];
const LAST_NAMES = [
  "ใจดี", "สุขสันต์", "ทองดี", "วงศ์สกุล", "รักษ์ดี", "พานิช", "บุญมี", "แสงทอง", "ตั้งตรง", "ศรีสุข",
  "เจริญสุข", "วัฒนา", "อรุณรุ่ง", "มั่นคง", "พงษ์ไพศาล", "กาญจนะ", "อินทรีย์", "สุวรรณ", "เพชรรัตน์", "นาคทอง",
  "ชัยมงคล", "ศิริวัฒน์", "บุญศรี", "ทองคำ", "รัตนะ", "พรหมมา", "แก้วมณี", "ลี้สกุล", "วิชัย", "สมบัติ",
];

const EXPENSE_TITLES = [
  "ค่าโฆษณา Facebook",
  "ค่าไฟโชว์รูม",
  "ค่าล้างขัดรถประจำวัน",
  "ค่าน้ำประปา",
  "ค่าอินเทอร์เน็ต",
  "ค่าน้ำมันรถส่งมอบ",
  "ค่าประกันโชว์รูม",
  "ค่าซ่อมเล็กงานเตรียมขาย",
  "ค่าถ่ายเอกสารลูกค้า",
  "ค่าขนมเลี้ยงลูกค้า",
];

const INCOME_EXTRA_TITLES = [
  "มัดจำจองออนไลน์",
  "ค่าธรรมเนียมโอนทะเบียน",
  "รายได้ค่าบริการหลังขาย",
  "ค่าคอมมิชชันไฟแนนซ์",
];

function phoneAt(i: number): string {
  return `08${String(10000000 + ((i * 137) % 90000000)).slice(0, 8)}`;
}

function ymdPlus(fromKey: string, days: number): string {
  if (days >= 0) {
    const t = new Date(`${fromKey}T12:00:00+07:00`);
    t.setTime(t.getTime() + days * 86400000);
    return t.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  }
  return bangkokDateKeyMinusDays(fromKey, -days);
}

function bangkokAt(ymd: string, hour: number, minute = 0): Date {
  const h = String(hour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  return new Date(`${ymd}T${h}:${m}:00+07:00`);
}

/** ล้างข้อมูลตัวอย่างโชว์รูม (คงร้าน + หมวดการเงินระบบ) */
export async function wipeUsedCarShowroomDemoData(
  db: DbLike,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  const where = { ownerUserId, trialSessionId };
  await db.usedCarLedgerEntry.deleteMany({ where });
  await db.usedCarFinanceCase.deleteMany({ where });
  await db.usedCarSale.deleteMany({ where });
  await db.usedCarReservation.deleteMany({ where });
  await db.usedCarAppointment.deleteMany({ where });
  await db.usedCarLead.deleteMany({ where });
  await db.usedCarCustomerDocument.deleteMany({ where });
  await db.usedCarCostLine.deleteMany({ where });
  await db.usedCarVehicleVideo.deleteMany({ where });
  await db.usedCarVehicleImage.deleteMany({ where });
  await db.usedCarVehicleDocument.deleteMany({ where });
  await db.usedCarPromotion.deleteMany({ where });
  await db.usedCarCustomer.deleteMany({ where });
  await db.usedCarVehicle.deleteMany({ where });
  await db.usedCarStaff.deleteMany({ where });
  await db.usedCarFinanceCompany.deleteMany({ where });
}

async function upsertDemoShop(
  db: DbLike,
  ownerUserId: string,
  trialSessionId: string,
  displayName: string,
) {
  const shop = await ensureUsedCarShowroomShop(db, ownerUserId, trialSessionId);
  const galleryJson = JSON.stringify([...USED_CAR_PORTAL_SAMPLE_GALLERY]);
  return db.usedCarShowroomShop.update({
    where: { id: shop.id },
    data: {
      displayName,
      tagline: "รถมือสองคัดสภาพ · ไฟแนนซ์ผ่านง่าย · นัดดูรถฟรี",
      logoUrl: USED_CAR_SHOWROOM_SAMPLE_LOGO,
      address: DEMO_MODULE_CONTACT.address,
      contactPhone: DEMO_MODULE_CONTACT.contactPhone,
      contactLine: DEMO_MODULE_CONTACT.lineId,
      facebookUrl: DEMO_MODULE_CONTACT.facebookUrl,
      mapUrl: DEMO_MODULE_CONTACT.mapUrl,
      openTimeHm: "09:00",
      closeTimeHm: "19:00",
      portalBannerUrl: USED_CAR_PORTAL_SAMPLE_BANNER,
      portalGalleryJson: galleryJson,
      portalEnabled: true,
      portalBookingPaymentMode: "DEPOSIT",
      depositAmountBaht: 5000,
      promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
      bankName: DEMO_MODULE_PAYMENT.bankName,
      bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
      bankAccountName: DEMO_MODULE_PAYMENT.bankAccountName,
      taxId: DEMO_MODULE_PAYMENT.taxId,
    },
  });
}

async function seedUsedCarActivity(
  db: DbLike,
  ownerUserId: string,
  trialSessionId: string,
  shopId: string,
): Promise<void> {
  const today = bangkokDateKey();
  const scope = { ownerUserId, trialSessionId, shopId };

  const staffRows = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      db.usedCarStaff.create({
        data: {
          ...scope,
          fullName: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`,
          phone: phoneAt(i + 50),
          role: i === 0 ? "MANAGER" : i < 3 ? "ADMIN" : "SALES",
          commissionPercent: 1 + (i % 3),
          bonusNote: i % 4 === 0 ? "โบนัสขายครบเป้า" : null,
          startedOn: bangkokDateKeyMinusDays(today, 400 - i * 12),
          isActive: i < 18,
          note: DEMO_NOTE,
        },
      }),
    ),
  );

  const companies = await Promise.all(
    [
      "กรุงศรี ออโต้",
      "ธนชาต ลิสซิ่ง",
      "ทิสโก้",
      "เกียรตินาคินภัทร",
      "อยุธยา แคปปิตอล",
      "ซีไอเอ็มบี ไทย",
      "ลีซ อิท",
      "เอเชียลิสซิ่ง",
      "เจพีมอร์แกน ไทย",
      "โตโยต้า ลีสซิ่ง",
      "ฮอนด้า ออโตโมบิล",
      "มิตซูบิชิ มอเตอร์ส ไฟแนนซ์",
      "มาสด้า ลีสซิ่ง",
      "อิซูซุ ลีสซิ่ง",
      "นิสสัน ลีสซิ่ง",
      "ฟอร์ด ลีสซิ่ง",
      "เอ็มจี ไฟแนนซ์",
      "บีเอ็มดับเบิลยู ไฟแนนเชียล",
      "เมอร์เซเดส-เบนซ์ ไฟแนนเชียล",
      "ยูโอบี ลีสซิ่ง",
    ].map((name, i) =>
      db.usedCarFinanceCompany.create({
        data: {
          ...scope,
          name,
          contactName: `คุณ${FIRST_NAMES[i % FIRST_NAMES.length]}`,
          contactPhone: phoneAt(i + 80),
          note: DEMO_NOTE,
          isActive: i < 18,
        },
      }),
    ),
  );

  const customers = await Promise.all(
    Array.from({ length: 30 }, (_, i) =>
      db.usedCarCustomer.create({
        data: {
          ...scope,
          fullName: `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i + 3) % LAST_NAMES.length]}`,
          phone: phoneAt(i),
          lineId: i % 2 === 0 ? `line.demo${i}` : null,
          email: i % 3 === 0 ? `customer${i}@demo.mawell.local` : null,
          address: i % 2 === 0 ? DEMO_MODULE_CONTACT.address : null,
          nationalId: i % 4 === 0 ? `1${String(1000000000000 + i).slice(0, 12)}` : null,
          taxId: i % 5 === 0 ? DEMO_MODULE_PAYMENT.taxId : null,
          taxName: i % 5 === 0 ? `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}` : null,
          note: DEMO_NOTE,
          createdAt: bangkokAt(bangkokDateKeyMinusDays(today, Math.min(HISTORY_DAYS - 1, i)), 9, 0),
        },
      }),
    ),
  );

  for (let i = 0; i < 12; i++) {
    await db.usedCarCustomerDocument.create({
      data: {
        ownerUserId,
        trialSessionId,
        customerId: customers[i]!.id,
        title: i % 2 === 0 ? "สำเนาบัตรประชาชน" : "สลิปโอนมัดจำ",
        fileUrl: DEMO_PAYMENT_SLIP_URL,
        createdAt: bangkokAt(bangkokDateKeyMinusDays(today, i % HISTORY_DAYS), 10, 15),
      },
    });
  }

  const vehicles: Array<{
    id: string;
    status: string;
    brand: string;
    model: string;
    askingPriceBaht: number;
    soldDaysAgo?: number;
  }> = [];

  for (let i = 0; i < VEHICLES.length; i++) {
    const v = VEHICLES[i]!;
    const images = usedCarVehicleSampleImageSet(i, 3);
    const soldAgo = v.soldDaysAgo ?? (v.status === "SOLD" || v.status === "DELIVERED" ? 10 + (i % 8) : undefined);
    const purchasedAgo = soldAgo != null ? soldAgo + 25 + (i % 20) : 60 - (i % 40);
    const purchasedAt = bangkokAt(bangkokDateKeyMinusDays(today, purchasedAgo), 12, 0);
    const soldAt =
      soldAgo != null ? bangkokAt(bangkokDateKeyMinusDays(today, soldAgo), 15, 30) : null;
    const row = await db.usedCarVehicle.create({
      data: {
        ...scope,
        status: v.status,
        brand: v.brand,
        model: v.model,
        year: v.year,
        color: v.color,
        mileageKm: v.mileageKm,
        transmission: v.transmission,
        fuelType: v.fuelType,
        bodyType: v.bodyType,
        plateNumber: v.plate,
        vin: `DEMO${String(100000000 + i)}TH`,
        hasRegistrationBook: i % 3 !== 0,
        purchaseCostBaht: v.purchaseCostBaht,
        askingPriceBaht: v.askingPriceBaht,
        coverImageUrl: images[0]!,
        description: `${v.brand} ${v.model} ปี ${v.year} · เลขไมล์ ${v.mileageKm.toLocaleString("th-TH")} กม. · สภาพดีพร้อมใช้งาน`,
        note: DEMO_NOTE,
        purchasedAt,
        soldAt,
        createdAt: purchasedAt,
      },
    });
    for (let j = 0; j < images.length; j++) {
      await db.usedCarVehicleImage.create({
        data: {
          ownerUserId,
          trialSessionId,
          vehicleId: row.id,
          imageUrl: images[j]!,
          isCover: j === 0,
          sortOrder: j,
        },
      });
    }
    if (i % 4 === 0) {
      await db.usedCarVehicleVideo.create({
        data: {
          ownerUserId,
          trialSessionId,
          vehicleId: row.id,
          youtubeUrl: USED_CAR_SAMPLE_YOUTUBE[i % USED_CAR_SAMPLE_YOUTUBE.length]!,
          title: `รีวิว ${v.brand} ${v.model}`,
          sortOrder: 0,
        },
      });
    }
    const costKinds = ["REPAIR", "WASH", "TAX", "OTHER"] as const;
    const costLabels = ["ทำสีกันชน", "ล้างขัดเคลือบ", "ต่อภาษีประจำปี", "เปลี่ยนยางอะไหล่"] as const;
    for (let c = 0; c < 3; c++) {
      const spentAgo = Math.min(
        HISTORY_DAYS - 1,
        (soldAgo != null ? soldAgo + 5 + c * 4 : 8 + c * 7 + (i % 5)) % HISTORY_DAYS,
      );
      await db.usedCarCostLine.create({
        data: {
          ownerUserId,
          trialSessionId,
          vehicleId: row.id,
          kind: costKinds[(i + c) % costKinds.length]!,
          label: costLabels[(i + c) % costLabels.length]!,
          amountBaht: 1200 + ((i + c) % 9) * 450,
          slipImageUrl: c === 0 ? DEMO_PAYMENT_SLIP_URL : null,
          spentAt: bangkokAt(bangkokDateKeyMinusDays(today, spentAgo), 11 + c, 0),
          note: DEMO_NOTE,
        },
      });
    }
    vehicles.push({
      id: row.id,
      status: row.status,
      brand: v.brand,
      model: v.model,
      askingPriceBaht: v.askingPriceBaht,
      soldDaysAgo: soldAgo,
    });
  }

  const stockVehicles = vehicles.filter((v) =>
    ["PREP", "FOR_SALE", "RESERVED"].includes(v.status),
  );
  const soldVehicles = vehicles
    .filter((v) => v.status === "SOLD" || v.status === "DELIVERED")
    .sort((a, b) => (a.soldDaysAgo ?? 99) - (b.soldDaysAgo ?? 99));

  const promoKinds = [
    { kind: "AMOUNT" as const, valueBaht: 10000, valuePercent: 0, giftLabel: null as string | null },
    { kind: "PERCENT" as const, valueBaht: 0, valuePercent: 3, giftLabel: null },
    { kind: "GIFT" as const, valueBaht: 0, valuePercent: 0, giftLabel: "ฟรีประกันชั้น 1 1 ปี" },
  ];
  for (let i = 0; i < 20; i++) {
    const pk = promoKinds[i % promoKinds.length]!;
    await db.usedCarPromotion.create({
      data: {
        ...scope,
        vehicleId: i % 3 === 0 ? stockVehicles[i % Math.max(1, stockVehicles.length)]!.id : null,
        title: `โปรตัวอย่าง ${i + 1}`,
        description: "โปรโมชันทดลองระบบ — ลดราคา / ของแถม ตามเงื่อนไขร้าน",
        kind: pk.kind,
        valueBaht: pk.valueBaht,
        valuePercent: pk.valuePercent,
        giftLabel: pk.giftLabel,
        startsOn: bangkokDateKeyMinusDays(today, HISTORY_DAYS - 1),
        endsOn: ymdPlus(today, 25 + (i % 10)),
        isActive: i < 16,
        createdAt: bangkokAt(bangkokDateKeyMinusDays(today, Math.min(HISTORY_DAYS - 1, i)), 8, 0),
      },
    });
  }

  const categories = await db.usedCarFinanceCategory.findMany({
    where: { shopId },
    select: { id: true, kind: true, systemKey: true },
  });
  const saleCat = categories.find((c) => c.systemKey === "SALE");
  const purchaseCat = categories.find((c) => c.systemKey === "PURCHASE");
  const commissionCat = categories.find((c) => c.systemKey === "COMMISSION");
  const otherExp = categories.find((c) => c.systemKey === "OTHER");
  const otherInc = categories.find((c) => c.systemKey === "OTHER_INCOME");

  const leadStatuses = ["NEW", "CONTACTED", "INTERESTED", "LOST", "CONVERTED"] as const;
  const leadSources = ["WEB", "WALK_IN", "PHONE", "LINE", "OTHER"] as const;
  const apptKinds = ["VIEW", "TEST_DRIVE"] as const;
  const pastApptStatuses = ["DONE", "DONE", "DONE", "NO_SHOW", "CANCELLED"] as const;
  const payMethods = ["CASH", "PROMPTPAY", "TRANSFER", "CREDIT_CARD"] as const;
  const resStatusesPast = ["PAID", "CONVERTED", "EXPIRED", "CANCELLED", "PENDING"] as const;
  const caseStatuses = ["SUBMITTED", "WAITING_DOCS", "APPROVED", "REJECTED", "SIGNED"] as const;

  const sales: Array<{ id: string; soldOn: string; vehicleId: string }> = [];
  const reservations: Array<{ id: string; status: string }> = [];

  /** ——— กิจกรรมทุกวันย้อนหลัง HISTORY_DAYS วัน ——— */
  for (let ago = HISTORY_DAYS - 1; ago >= 0; ago--) {
    const day = bangkokDateKeyMinusDays(today, ago);
    const isToday = ago === 0;
    const daySeq = HISTORY_DAYS - 1 - ago;
    const cust = customers[daySeq % customers.length]!;
    const staff = staffRows[daySeq % staffRows.length]!;
    const vehiclePick = stockVehicles[daySeq % Math.max(1, stockVehicles.length)] ?? vehicles[0]!;

    /* ลีดอย่างน้อย 1 ราย/วัน */
    await db.usedCarLead.create({
      data: {
        ...scope,
        customerId: cust.id,
        vehicleId: vehiclePick.id,
        staffId: staff.id,
        fullName: cust.fullName,
        phone: cust.phone,
        source: leadSources[daySeq % leadSources.length]!,
        status: isToday ? "NEW" : leadStatuses[daySeq % leadStatuses.length]!,
        note: `${DEMO_NOTE} ลีดวันที่ ${day}`,
        createdAt: bangkokAt(day, 9 + (daySeq % 4), 10),
      },
    });

    /* นัดดูรถ / ทดลองขับ 2–3 สล็อตทุกวัน */
    const apptCount = isToday ? 6 : 2 + (daySeq % 2);
    for (let a = 0; a < apptCount; a++) {
      const ac = customers[(daySeq + a) % customers.length]!;
      const av = stockVehicles[(daySeq + a) % Math.max(1, stockVehicles.length)] ?? vehicles[0]!;
      const hmHour = 9 + a + (isToday ? 0 : daySeq % 2);
      const status = isToday
        ? a < 5
          ? "SCHEDULED"
          : pastApptStatuses[a % pastApptStatuses.length]!
        : pastApptStatuses[(daySeq + a) % pastApptStatuses.length]!;
      await db.usedCarAppointment.create({
        data: {
          ...scope,
          vehicleId: av.id,
          customerId: ac.id,
          staffId: staffRows[(daySeq + a) % staffRows.length]!.id,
          kind: apptKinds[(daySeq + a) % 2]!,
          customerName: ac.fullName,
          customerPhone: ac.phone,
          appointmentOn: day,
          appointmentHm: `${String(Math.min(18, hmHour)).padStart(2, "0")}:${a % 2 === 0 ? "00" : "30"}`,
          status,
          note: DEMO_NOTE,
          createdAt: bangkokAt(day, Math.max(8, hmHour - 1), 0),
        },
      });
    }

    /* จองมัดจำ — ส่วนใหญ่มีทุกวัน (วันนี้ค้าง PENDING/PAID) */
    const resStatus = isToday
      ? aResStatusForToday(daySeq)
      : resStatusesPast[daySeq % resStatusesPast.length]!;
    const resVehicle =
      isToday && vehiclePick.status === "RESERVED"
        ? vehiclePick
        : stockVehicles[(daySeq + 2) % Math.max(1, stockVehicles.length)] ?? vehiclePick;
    const reservation = await db.usedCarReservation.create({
      data: {
        ...scope,
        vehicleId: resVehicle.id,
        customerId: cust.id,
        staffId: staff.id,
        source: daySeq % 3 === 0 ? "WEB" : "STAFF",
        customerName: cust.fullName,
        customerPhone: cust.phone,
        depositBaht: 5000 + (daySeq % 5) * 1000,
        paymentMethod: payMethods[daySeq % payMethods.length]!,
        slipImageUrl:
          resStatus === "PAID" || resStatus === "CONVERTED" ? DEMO_PAYMENT_SLIP_URL : null,
        status: resStatus,
        expiresOn: ymdPlus(day, 3 + (daySeq % 4)),
        note: DEMO_NOTE,
        createdAt: bangkokAt(day, 13, 20),
      },
    });
    reservations.push(reservation);

    /* ขายรถ — จับคู่รถที่ soldDaysAgo ตรงวันนี้ */
    const saleVehicle = soldVehicles.find((v) => v.soldDaysAgo === ago);
    let saleId: string | null = null;
    if (saleVehicle) {
      const saleCust = customers[(daySeq + 5) % customers.length]!;
      const sale = await db.usedCarSale.create({
        data: {
          ...scope,
          vehicleId: saleVehicle.id,
          customerId: saleCust.id,
          reservationId:
            reservation.status === "CONVERTED" ? reservation.id : null,
          staffId: staffRows[daySeq % staffRows.length]!.id,
          salePriceBaht: saleVehicle.askingPriceBaht - (daySeq % 5) * 5000,
          discountBaht: (daySeq % 4) * 2000,
          taxInvoiceEnabled: daySeq % 5 === 0,
          paymentMethod: payMethods[daySeq % payMethods.length]!,
          slipImageUrl: DEMO_PAYMENT_SLIP_URL,
          soldOn: day,
          note: DEMO_NOTE,
          createdAt: bangkokAt(day, 16, 0),
        },
      });
      sales.push({ id: sale.id, soldOn: day, vehicleId: saleVehicle.id });
      saleId = sale.id;

      await db.usedCarFinanceCase.create({
        data: {
          ...scope,
          vehicleId: saleVehicle.id,
          saleId: sale.id,
          customerId: saleCust.id,
          companyId: companies[daySeq % companies.length]!.id,
          financedAmountBaht: Math.round(saleVehicle.askingPriceBaht * 0.7),
          status: caseStatuses[daySeq % caseStatuses.length]!,
          commissionBaht: 5000 + (daySeq % 6) * 1000,
          commissionPaid: daySeq % 3 === 0,
          insuranceCompany: daySeq % 2 === 0 ? "วิริยะประกันภัย" : "เมืองไทยประกันภัย",
          signOn: daySeq % 4 === 0 ? day : null,
          note: DEMO_NOTE,
          createdAt: bangkokAt(day, 16, 30),
        },
      });
    }

    /* สมุดรายวัน — รายรับ + รายจ่าย ทุกวัน */
    const incomeTitle = saleId
      ? `ขายรถ ${saleVehicle!.brand} ${saleVehicle!.model}`
      : INCOME_EXTRA_TITLES[daySeq % INCOME_EXTRA_TITLES.length]!;
    const incomeAmount = saleId
      ? (saleVehicle!.askingPriceBaht - (daySeq % 5) * 5000)
      : 5000 + (daySeq % 7) * 1500;
    await db.usedCarLedgerEntry.create({
      data: {
        ...scope,
        categoryId: saleId ? saleCat?.id ?? otherInc?.id ?? null : otherInc?.id ?? saleCat?.id ?? null,
        vehicleId: saleId ? saleVehicle!.id : vehiclePick.id,
        saleId,
        kind: "INCOME",
        title: incomeTitle,
        amountBaht: incomeAmount,
        entryOn: day,
        paymentMethod: payMethods[daySeq % payMethods.length]!,
        slipImageUrl: daySeq % 2 === 0 || saleId ? DEMO_PAYMENT_SLIP_URL : null,
        note: DEMO_NOTE,
        createdAt: bangkokAt(day, 17, 0),
      },
    });

    const expCat =
      daySeq % 3 === 0 ? commissionCat : daySeq % 3 === 1 ? purchaseCat : otherExp;
    await db.usedCarLedgerEntry.create({
      data: {
        ...scope,
        categoryId: expCat?.id ?? null,
        vehicleId: vehiclePick.id,
        kind: "EXPENSE",
        title: EXPENSE_TITLES[daySeq % EXPENSE_TITLES.length]!,
        amountBaht: 800 + (daySeq % 11) * 350,
        entryOn: day,
        paymentMethod: payMethods[(daySeq + 1) % payMethods.length]!,
        slipImageUrl: daySeq % 3 === 0 ? DEMO_PAYMENT_SLIP_URL : null,
        note: DEMO_NOTE,
        createdAt: bangkokAt(day, 11, 45),
      },
    });

    /* วันหยุดสุดสัปดาห์ — รายจ่ายเสริมเล็กน้อย */
    const dow = new Date(`${day}T12:00:00+07:00`).getDay();
    if (dow === 0 || dow === 6) {
      await db.usedCarLedgerEntry.create({
        data: {
          ...scope,
          categoryId: otherExp?.id ?? null,
          vehicleId: null,
          kind: "EXPENSE",
          title: dow === 0 ? "ค่าล่วงเวลาพนักงานวันอาทิตย์" : "ค่าจัดกิจกรรมโปรโมทเสาร์",
          amountBaht: 1500 + (daySeq % 5) * 200,
          entryOn: day,
          paymentMethod: "CASH",
          slipImageUrl: null,
          note: DEMO_NOTE,
          createdAt: bangkokAt(day, 18, 0),
        },
      });
    }
  }

  /** นัดล่วงหน้า AHEAD_DAYS วัน */
  for (let ahead = 1; ahead <= AHEAD_DAYS; ahead++) {
    const day = ymdPlus(today, ahead);
    const slots = ahead === 1 ? 4 : 2;
    for (let a = 0; a < slots; a++) {
      const ac = customers[(ahead * 3 + a) % customers.length]!;
      const av = stockVehicles[(ahead + a) % Math.max(1, stockVehicles.length)] ?? vehicles[0]!;
      await db.usedCarAppointment.create({
        data: {
          ...scope,
          vehicleId: av.id,
          customerId: ac.id,
          staffId: staffRows[(ahead + a) % staffRows.length]!.id,
          kind: apptKinds[a % 2]!,
          customerName: ac.fullName,
          customerPhone: ac.phone,
          appointmentOn: day,
          appointmentHm: `${String(10 + a).padStart(2, "0")}:${a % 2 === 0 ? "00" : "30"}`,
          status: "SCHEDULED",
          note: DEMO_NOTE,
          createdAt: bangkokAt(today, 12 + a, 0),
        },
      });
    }
  }

  /* เคสไฟแนนซ์เพิ่มสำหรับรถในสต็อกที่สนใจ (รอเอกสาร) */
  for (let i = 0; i < 8; i++) {
    const v = stockVehicles[i % Math.max(1, stockVehicles.length)]!;
    const c = customers[(i + 7) % customers.length]!;
    await db.usedCarFinanceCase.create({
      data: {
        ...scope,
        vehicleId: v.id,
        saleId: null,
        customerId: c.id,
        companyId: companies[i % companies.length]!.id,
        financedAmountBaht: 250000 + i * 30000,
        status: i < 4 ? "SUBMITTED" : "WAITING_DOCS",
        commissionBaht: 4000 + i * 500,
        commissionPaid: false,
        insuranceCompany: i % 2 === 0 ? "วิริยะประกันภัย" : "เมืองไทยประกันภัย",
        signOn: null,
        note: DEMO_NOTE,
        createdAt: bangkokAt(bangkokDateKeyMinusDays(today, i + 1), 14, 0),
      },
    });
  }
}

function aResStatusForToday(daySeq: number): "PENDING" | "PAID" {
  return daySeq % 2 === 0 ? "PENDING" : "PAID";
}

/**
 * ข้อมูลตัวอย่างเมื่อเริ่มทดลองโมดูลโชว์รูม
 */
export async function seedUsedCarShowroomTrialData(
  tx: Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  if (!trialSessionId || trialSessionId === TRIAL_PROD_SCOPE) return;
  await wipeUsedCarShowroomDemoData(tx, ownerUserId, trialSessionId);
  const shop = await upsertDemoShop(
    tx,
    ownerUserId,
    trialSessionId,
    trialDemoDisplayName("โชว์รูมรถมือสองมาเวล"),
  );
  await seedUsedCarActivity(tx, ownerUserId, trialSessionId, shop.id);
}

/**
 * ข้อมูลตัวอย่าง production scope (user demo)
 */
export async function seedUsedCarShowroomProdDemoForOwner(
  prisma: PrismaClient,
  ownerUserId: string,
  opts?: { refresh?: boolean },
): Promise<void> {
  const trialSessionId = TRIAL_PROD_SCOPE;
  const refresh = opts?.refresh !== false;
  if (!refresh) {
    const n = await prisma.usedCarVehicle.count({ where: { ownerUserId, trialSessionId } });
    if (n >= 15) return;
  }
  await wipeUsedCarShowroomDemoData(prisma, ownerUserId, trialSessionId);
  const shop = await upsertDemoShop(prisma, ownerUserId, trialSessionId, "โชว์รูมรถมือสองมาเวล (ตัวอย่าง)");
  await seedUsedCarActivity(prisma, ownerUserId, trialSessionId, shop.id);
}
