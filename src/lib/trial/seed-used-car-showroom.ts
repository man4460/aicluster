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
  { brand: "Isuzu", model: "MU-X", year: 2018, color: "ขาว", mileageKm: 105000, transmission: "AUTO", fuelType: "DIESEL", bodyType: "SUV", status: "SOLD", purchaseCostBaht: 700000, askingPriceBaht: 820000, plate: "16บบ 2468" },
  { brand: "Mazda", model: "2 Sedan", year: 2019, color: "เทา", mileageKm: 55000, transmission: "AUTO", fuelType: "GASOLINE", bodyType: "SEDAN", status: "DELIVERED", purchaseCostBaht: 340000, askingPriceBaht: 399000, plate: "17ปป 3690" },
  { brand: "Toyota", model: "Alphard", year: 2016, color: "ดำ", mileageKm: 140000, transmission: "AUTO", fuelType: "GASOLINE", bodyType: "MPV", status: "FOR_SALE", purchaseCostBaht: 1100000, askingPriceBaht: 1290000, plate: "18ผผ 1470" },
  { brand: "BMW", model: "320d", year: 2017, color: "ขาว", mileageKm: 88000, transmission: "AUTO", fuelType: "DIESEL", bodyType: "SEDAN", status: "FOR_SALE", purchaseCostBaht: 850000, askingPriceBaht: 989000, plate: "19ฝฝ 2580" },
  { brand: "Mercedes-Benz", model: "C200", year: 2018, color: "เงิน", mileageKm: 76000, transmission: "AUTO", fuelType: "GASOLINE", bodyType: "SEDAN", status: "FOR_SALE", purchaseCostBaht: 920000, askingPriceBaht: 1090000, plate: "20พพ 3691" },
];

const FIRST_NAMES = [
  "สมชาย", "วิภา", "อนุชา", "กมล", "ปรียา", "ธีรพงษ์", "นฤมล", "ชัยวัฒน์", "พิมพ์ใจ", "วรพล",
  "สุนิสา", "กิตติ", "อรทัย", "พงศกร", "มาลี", "ธนา", "ศิริพร", "จักรพงษ์", "เบญจมาศ", "อภิชาติ",
];
const LAST_NAMES = [
  "ใจดี", "สุขสันต์", "ทองดี", "วงศ์สกุล", "รักษ์ดี", "พานิช", "บุญมี", "แสงทอง", "ตั้งตรง", "ศรีสุข",
  "เจริญสุข", "วัฒนา", "อรุณรุ่ง", "มั่นคง", "พงษ์ไพศาล", "กาญจนะ", "อินทรีย์", "สุวรรณ", "เพชรรัตน์", "นาคทอง",
];

function phoneAt(i: number): string {
  return `08${String(10000000 + i * 137).slice(0, 8)}`;
}

function ymdPlus(fromKey: string, days: number): string {
  if (days >= 0) {
    const t = new Date(`${fromKey}T12:00:00+07:00`);
    t.setTime(t.getTime() + days * 86400000);
    return t.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  }
  return bangkokDateKeyMinusDays(fromKey, -days);
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
          fullName: `${FIRST_NAMES[i]} ${LAST_NAMES[i]}`,
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
    Array.from({ length: 20 }, (_, i) =>
      db.usedCarCustomer.create({
        data: {
          ...scope,
          fullName: `${FIRST_NAMES[i]} ${LAST_NAMES[(i + 3) % LAST_NAMES.length]}`,
          phone: phoneAt(i),
          lineId: i % 2 === 0 ? `line.demo${i}` : null,
          email: i % 3 === 0 ? `customer${i}@demo.mawell.local` : null,
          address: i % 2 === 0 ? DEMO_MODULE_CONTACT.address : null,
          nationalId: i % 4 === 0 ? `1${String(1000000000000 + i).slice(0, 12)}` : null,
          taxId: i % 5 === 0 ? DEMO_MODULE_PAYMENT.taxId : null,
          taxName: i % 5 === 0 ? `${FIRST_NAMES[i]} ${LAST_NAMES[i]}` : null,
          note: DEMO_NOTE,
        },
      }),
    ),
  );

  for (let i = 0; i < 8; i++) {
    await db.usedCarCustomerDocument.create({
      data: {
        ownerUserId,
        trialSessionId,
        customerId: customers[i]!.id,
        title: i % 2 === 0 ? "สำเนาบัตรประชาชน" : "สลิปโอนมัดจำ",
        fileUrl: DEMO_PAYMENT_SLIP_URL,
      },
    });
  }

  const vehicles = [];
  for (let i = 0; i < VEHICLES.length; i++) {
    const v = VEHICLES[i]!;
    const images = usedCarVehicleSampleImageSet(i, 3);
    const purchasedAt = new Date(`${bangkokDateKeyMinusDays(today, 60 - (i % 40))}T12:00:00+07:00`);
    const sold =
      v.status === "SOLD" || v.status === "DELIVERED"
        ? new Date(`${bangkokDateKeyMinusDays(today, 10 + (i % 8))}T12:00:00+07:00`)
        : null;
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
        soldAt: sold,
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
    for (let c = 0; c < 2; c++) {
      await db.usedCarCostLine.create({
        data: {
          ownerUserId,
          trialSessionId,
          vehicleId: row.id,
          kind: costKinds[(i + c) % costKinds.length]!,
          label: c === 0 ? "ทำสีกันชน" : "ล้างขัดเคลือบ",
          amountBaht: 1500 + ((i + c) % 7) * 500,
          slipImageUrl: c === 0 ? DEMO_PAYMENT_SLIP_URL : null,
          spentAt: new Date(`${bangkokDateKeyMinusDays(today, 20 - c)}T12:00:00+07:00`),
          note: DEMO_NOTE,
        },
      });
    }
    vehicles.push(row);
  }

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
        vehicleId: i % 3 === 0 ? vehicles[i % vehicles.length]!.id : null,
        title: `โปรตัวอย่าง ${i + 1}`,
        description: "โปรโมชันทดลองระบบ — ลดราคา / ของแถม ตามเงื่อนไขร้าน",
        kind: pk.kind,
        valueBaht: pk.valueBaht,
        valuePercent: pk.valuePercent,
        giftLabel: pk.giftLabel,
        startsOn: bangkokDateKeyMinusDays(today, 5),
        endsOn: ymdPlus(today, 25 + (i % 10)),
        isActive: i < 16,
      },
    });
  }

  const leadStatuses = ["NEW", "CONTACTED", "INTERESTED", "LOST", "CONVERTED"] as const;
  const leadSources = ["WEB", "WALK_IN", "PHONE", "LINE", "OTHER"] as const;
  for (let i = 0; i < 20; i++) {
    await db.usedCarLead.create({
      data: {
        ...scope,
        customerId: customers[i]!.id,
        vehicleId: vehicles[i % vehicles.length]!.id,
        staffId: staffRows[i % staffRows.length]!.id,
        fullName: customers[i]!.fullName,
        phone: customers[i]!.phone,
        source: leadSources[i % leadSources.length]!,
        status: leadStatuses[i % leadStatuses.length]!,
        note: DEMO_NOTE,
      },
    });
  }

  const apptKinds = ["VIEW", "TEST_DRIVE"] as const;
  const apptStatuses = ["SCHEDULED", "DONE", "CANCELLED", "NO_SHOW"] as const;
  for (let i = 0; i < 20; i++) {
    /** นัดวันนี้ ~8 รายการ (เวลาเรียง) — ที่เหลือกระจายวันใกล้เคียง */
    const onToday = i < 8;
    const appointmentOn = onToday ? today : ymdPlus(today, (i % 7) - 2);
    const status = onToday
      ? i < 6
        ? "SCHEDULED"
        : apptStatuses[i % apptStatuses.length]!
      : apptStatuses[i % apptStatuses.length]!;
    await db.usedCarAppointment.create({
      data: {
        ...scope,
        vehicleId: vehicles[i % vehicles.length]!.id,
        customerId: customers[i]!.id,
        staffId: staffRows[i % staffRows.length]!.id,
        kind: apptKinds[i % 2]!,
        customerName: customers[i]!.fullName,
        customerPhone: customers[i]!.phone,
        appointmentOn,
        appointmentHm: `${String(9 + (i % 8)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
        status,
        note: DEMO_NOTE,
      },
    });
  }

  const resStatuses = ["PENDING", "PAID", "EXPIRED", "CANCELLED", "CONVERTED"] as const;
  const payMethods = ["CASH", "PROMPTPAY", "TRANSFER", "CREDIT_CARD"] as const;
  const reservations = [];
  for (let i = 0; i < 20; i++) {
    const status = resStatuses[i % resStatuses.length]!;
    const r = await db.usedCarReservation.create({
      data: {
        ...scope,
        vehicleId: vehicles[i % vehicles.length]!.id,
        customerId: customers[i]!.id,
        staffId: staffRows[i % staffRows.length]!.id,
        source: i % 3 === 0 ? "WEB" : "STAFF",
        customerName: customers[i]!.fullName,
        customerPhone: customers[i]!.phone,
        depositBaht: 5000 + (i % 5) * 1000,
        paymentMethod: payMethods[i % payMethods.length]!,
        slipImageUrl: status === "PAID" || status === "CONVERTED" ? DEMO_PAYMENT_SLIP_URL : null,
        status,
        expiresOn: ymdPlus(today, 3 + (i % 5)),
        note: DEMO_NOTE,
      },
    });
    reservations.push(r);
  }

  const soldVehicles = vehicles.filter((v) => v.status === "SOLD" || v.status === "DELIVERED");
  const sales = [];
  for (let i = 0; i < 20; i++) {
    const vehicle = soldVehicles[i % Math.max(1, soldVehicles.length)] ?? vehicles[i % vehicles.length]!;
    const sale = await db.usedCarSale.create({
      data: {
        ...scope,
        vehicleId: vehicle.id,
        customerId: customers[i]!.id,
        reservationId: i < reservations.length && reservations[i]!.status === "CONVERTED" ? reservations[i]!.id : null,
        staffId: staffRows[i % staffRows.length]!.id,
        salePriceBaht: vehicle.askingPriceBaht - (i % 5) * 5000,
        discountBaht: (i % 4) * 2000,
        taxInvoiceEnabled: i % 5 === 0,
        paymentMethod: payMethods[i % payMethods.length]!,
        slipImageUrl: DEMO_PAYMENT_SLIP_URL,
        soldOn: bangkokDateKeyMinusDays(today, 2 + (i % 25)),
        note: DEMO_NOTE,
      },
    });
    sales.push(sale);
  }

  const caseStatuses = ["SUBMITTED", "WAITING_DOCS", "APPROVED", "REJECTED", "SIGNED"] as const;
  for (let i = 0; i < 20; i++) {
    await db.usedCarFinanceCase.create({
      data: {
        ...scope,
        vehicleId: vehicles[i % vehicles.length]!.id,
        saleId: sales[i % sales.length]!.id,
        customerId: customers[i]!.id,
        companyId: companies[i % companies.length]!.id,
        financedAmountBaht: 300000 + i * 25000,
        status: caseStatuses[i % caseStatuses.length]!,
        commissionBaht: 5000 + (i % 6) * 1000,
        commissionPaid: i % 3 === 0,
        insuranceCompany: i % 2 === 0 ? "วิริยะประกันภัย" : "เมืองไทยประกันภัย",
        signOn: i % 4 === 0 ? bangkokDateKeyMinusDays(today, i % 10) : null,
        note: DEMO_NOTE,
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

  for (let i = 0; i < 20; i++) {
    const income = i % 2 === 0;
    const cat = income
      ? i % 4 === 0
        ? otherInc
        : saleCat
      : i % 3 === 0
        ? commissionCat
        : i % 3 === 1
          ? purchaseCat
          : otherExp;
    await db.usedCarLedgerEntry.create({
      data: {
        ...scope,
        categoryId: cat?.id ?? null,
        vehicleId: vehicles[i % vehicles.length]!.id,
        saleId: income && saleCat ? sales[i % sales.length]!.id : null,
        kind: income ? "INCOME" : "EXPENSE",
        title: income ? `รายรับตัวอย่าง ${i + 1}` : `รายจ่ายตัวอย่าง ${i + 1}`,
        amountBaht: income ? 20000 + i * 3500 : 3000 + i * 800,
        entryOn: bangkokDateKeyMinusDays(today, i % 28),
        paymentMethod: payMethods[i % payMethods.length]!,
        slipImageUrl: i % 2 === 0 ? DEMO_PAYMENT_SLIP_URL : null,
        note: DEMO_NOTE,
      },
    });
  }
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
