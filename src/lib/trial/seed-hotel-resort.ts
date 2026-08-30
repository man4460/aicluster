import type { PrismaClient } from "@/generated/prisma/client";
import { bangkokDateKeyMinusDays } from "@/lib/barber/bangkok-day";
import {
  DEMO_MODULE_CONTACT,
  DEMO_MODULE_LOGO_URL,
  DEMO_MODULE_PAYMENT,
  trialDemoDisplayName,
} from "@/lib/trial/demo-module-settings";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { ensureHotelResortRoomCatalog } from "@/systems/hotel-resort/lib/ensure-catalog";
import { ensureHotelResortIncomeCategories } from "@/systems/hotel-resort/lib/ensure-income-categories";
import { serializeHotelResortAmenities } from "@/systems/hotel-resort/lib/room-amenities";
import { hotelResortSampleRoomImageUrls } from "@/systems/hotel-resort/lib/room-images";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;
type DbLike = PrismaClient | Tx;

const ROOM_TYPES = [
  { name: "Standard", basePriceBaht: 1200, maxGuests: 2, sortOrder: 0 },
  { name: "Deluxe", basePriceBaht: 2200, maxGuests: 3, sortOrder: 1 },
  { name: "Villa", basePriceBaht: 4500, maxGuests: 4, sortOrder: 2 },
] as const;

const BUILDINGS = [
  { name: "อาคาร A", code: "A", sortOrder: 0 },
  { name: "อาคาร B", code: "B", sortOrder: 1 },
  { name: "โซนวิลล่า", code: "V", sortOrder: 2 },
] as const;

const ROOMS: ReadonlyArray<{
  building: 0 | 1 | 2;
  type: 0 | 1 | 2;
  roomNumber: string;
  floor: number;
  status: "VACANT" | "OCCUPIED" | "RESERVED";
  bedType: string;
  roomSizeSqm: number;
  viewType: string;
  amenities: string[];
}> = [
  {
    building: 0,
    type: 0,
    roomNumber: "101",
    floor: 1,
    status: "OCCUPIED",
    bedType: "เตียงคู่ (ควีน)",
    roomSizeSqm: 28,
    viewType: "สวน",
    amenities: ["WIFI", "TV", "AIRCON", "HOT_WATER", "FRIDGE", "TOWELS"],
  },
  {
    building: 0,
    type: 0,
    roomNumber: "102",
    floor: 1,
    status: "VACANT",
    bedType: "ทวิน (2 เตียงเดี่ยว)",
    roomSizeSqm: 28,
    viewType: "สวน",
    amenities: ["WIFI", "TV", "AIRCON", "HOT_WATER", "SHOWER"],
  },
  {
    building: 0,
    type: 0,
    roomNumber: "103",
    floor: 1,
    status: "RESERVED",
    bedType: "เตียงคิงไซส์",
    roomSizeSqm: 30,
    viewType: "เมือง",
    amenities: ["WIFI", "TV", "AIRCON", "HOT_WATER", "DESK", "SAFE"],
  },
  {
    building: 1,
    type: 1,
    roomNumber: "201",
    floor: 2,
    status: "OCCUPIED",
    bedType: "เตียงคิงไซส์",
    roomSizeSqm: 36,
    viewType: "สระ",
    amenities: ["WIFI", "TV", "AIRCON", "HOT_WATER", "FRIDGE", "BALCONY", "MINIBAR", "HAIRDRYER"],
  },
  {
    building: 1,
    type: 1,
    roomNumber: "202",
    floor: 2,
    status: "VACANT",
    bedType: "เตียงคิงไซส์",
    roomSizeSqm: 36,
    viewType: "สระ",
    amenities: ["WIFI", "TV", "AIRCON", "HOT_WATER", "FRIDGE", "BALCONY", "KETTLE"],
  },
  {
    building: 1,
    type: 1,
    roomNumber: "203",
    floor: 2,
    status: "VACANT",
    bedType: "ทวิน (2 เตียงเดี่ยว)",
    roomSizeSqm: 34,
    viewType: "เมือง",
    amenities: ["WIFI", "TV", "AIRCON", "HOT_WATER", "FRIDGE", "DESK", "WARDROBE"],
  },
  {
    building: 2,
    type: 2,
    roomNumber: "V01",
    floor: 1,
    status: "VACANT",
    bedType: "เตียงคิงไซส์",
    roomSizeSqm: 55,
    viewType: "ทะเล",
    amenities: ["WIFI", "TV", "AIRCON", "HOT_WATER", "FRIDGE", "MINIBAR", "BATHTUB", "BALCONY", "SAFE", "SLIPPERS"],
  },
  {
    building: 2,
    type: 2,
    roomNumber: "V02",
    floor: 1,
    status: "RESERVED",
    bedType: "3 เตียง",
    roomSizeSqm: 60,
    viewType: "ทะเล",
    amenities: ["WIFI", "TV", "AIRCON", "HOT_WATER", "FRIDGE", "MINIBAR", "BATHTUB", "BALCONY", "KETTLE", "TOWELS"],
  },
];

const DEMO_COST_NOTE = "seed:hotel-resort-demo-v1";

function bangkokNoon(ymd: string, hour = 14): Date {
  const hh = String(Math.max(0, Math.min(23, hour))).padStart(2, "0");
  return new Date(`${ymd}T${hh}:00:00+07:00`);
}

async function upsertRichHotelProfile(
  db: DbLike,
  ownerUserId: string,
  trialSessionId: string,
  propertyName: string,
) {
  await db.hotelResortProfile.upsert({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    create: {
      ownerUserId,
      trialSessionId,
      propertyName,
      managerName: "คุณสมชาย ผู้จัดการ",
      tagline: "พักผ่อนใกล้ธรรมชาติ — จองออนไลน์ได้",
      logoUrl: DEMO_MODULE_LOGO_URL,
      contactPhone: DEMO_MODULE_CONTACT.contactPhone,
      address: DEMO_MODULE_CONTACT.address,
      lineId: DEMO_MODULE_CONTACT.lineId,
      facebookUrl: DEMO_MODULE_CONTACT.facebookUrl,
      mapUrl: DEMO_MODULE_CONTACT.mapUrl,
      checkInTime: "14:00",
      checkOutTime: "12:00",
      portalBookingPaymentMode: "DEPOSIT",
      depositAmountBaht: 500,
      promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
      promptPayQrImageUrl: DEMO_MODULE_PAYMENT.promptPayQrImageUrl,
      bankName: DEMO_MODULE_PAYMENT.bankName,
      bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
      bankAccountName: DEMO_MODULE_PAYMENT.bankAccountName,
      taxId: DEMO_MODULE_PAYMENT.taxId,
    },
    update: {
      propertyName,
      managerName: "คุณสมชาย ผู้จัดการ",
      tagline: "พักผ่อนใกล้ธรรมชาติ — จองออนไลน์ได้",
      contactPhone: DEMO_MODULE_CONTACT.contactPhone,
      address: DEMO_MODULE_CONTACT.address,
      lineId: DEMO_MODULE_CONTACT.lineId,
      facebookUrl: DEMO_MODULE_CONTACT.facebookUrl,
      mapUrl: DEMO_MODULE_CONTACT.mapUrl,
      checkInTime: "14:00",
      checkOutTime: "12:00",
      portalBookingPaymentMode: "DEPOSIT",
      depositAmountBaht: 500,
      promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
      bankName: DEMO_MODULE_PAYMENT.bankName,
      bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
      bankAccountName: DEMO_MODULE_PAYMENT.bankAccountName,
      taxId: DEMO_MODULE_PAYMENT.taxId,
    },
  });
}

async function ensureRoomsCatalog(db: DbLike, ownerUserId: string) {
  await ensureHotelResortRoomCatalog(db as PrismaClient, ownerUserId);

  let buildings = await db.hotelResortBuilding.findMany({
    where: { ownerUserId },
    orderBy: { sortOrder: "asc" },
  });
  if (buildings.length < BUILDINGS.length) {
    await db.hotelResortRoom.deleteMany({ where: { ownerUserId } });
    await db.hotelResortRoomType.deleteMany({ where: { ownerUserId } });
    await db.hotelResortBuilding.deleteMany({ where: { ownerUserId } });
    buildings = await Promise.all(
      BUILDINGS.map((b) =>
        db.hotelResortBuilding.create({
          data: { ownerUserId, ...b },
        }),
      ),
    );
  }

  let types = await db.hotelResortRoomType.findMany({
    where: { ownerUserId },
    orderBy: { sortOrder: "asc" },
  });
  if (types.length < ROOM_TYPES.length) {
    await db.hotelResortRoom.deleteMany({ where: { ownerUserId } });
    await db.hotelResortRoomType.deleteMany({ where: { ownerUserId } });
    types = await Promise.all(
      ROOM_TYPES.map((t) =>
        db.hotelResortRoomType.create({
          data: { ownerUserId, ...t },
        }),
      ),
    );
  }

  let rooms = await db.hotelResortRoom.findMany({
    where: { ownerUserId },
    orderBy: { sortOrder: "asc" },
  });
  if (rooms.length < ROOMS.length) {
    await db.hotelResortRoom.deleteMany({ where: { ownerUserId } });
    rooms = await Promise.all(
      ROOMS.map((r, i) =>
        db.hotelResortRoom.create({
          data: {
            ownerUserId,
            buildingId: buildings[r.building]!.id,
            roomTypeId: types[r.type]!.id,
            roomNumber: r.roomNumber,
            floor: r.floor,
            status: r.status,
            sortOrder: i,
            bedType: r.bedType,
            roomSizeSqm: r.roomSizeSqm,
            viewType: r.viewType,
            amenitiesJson: serializeHotelResortAmenities(r.amenities),
            imageUrlsJson: hotelResortSampleRoomImageUrls(i, 3),
          },
        }),
      ),
    );
  }

  return { buildings, types, rooms };
}

async function wipeHotelOperational(
  db: DbLike,
  ownerUserId: string,
  trialSessionId: string,
  opts: { wipeRooms: boolean },
) {
  await db.hotelResortBooking.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.hotelResortGuest.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.hotelResortReview.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.hotelResortStaffLink.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.hotelResortCostEntry.deleteMany({ where: { ownerUserId, note: DEMO_COST_NOTE } });
  await db.hotelResortIncomeEntry.deleteMany({ where: { ownerUserId, note: DEMO_COST_NOTE } });

  if (opts.wipeRooms) {
    await db.hotelResortCostEntry.deleteMany({ where: { ownerUserId } });
    await db.hotelResortIncomeEntry.deleteMany({ where: { ownerUserId } });
    await db.hotelResortBooking.deleteMany({ where: { ownerUserId } });
    await db.hotelResortGuest.deleteMany({ where: { ownerUserId } });
    await db.hotelResortReview.deleteMany({ where: { ownerUserId } });
    await db.hotelResortRoom.deleteMany({ where: { ownerUserId } });
    await db.hotelResortRoomType.deleteMany({ where: { ownerUserId } });
    await db.hotelResortAmenityOption.deleteMany({ where: { ownerUserId } });
    await db.hotelResortBedTypeOption.deleteMany({ where: { ownerUserId } });
    await db.hotelResortBuilding.deleteMany({ where: { ownerUserId } });
    await db.hotelResortProfile.deleteMany({ where: { ownerUserId, trialSessionId } });
  }
}

async function seedHotelActivity(
  db: DbLike,
  ownerUserId: string,
  trialSessionId: string,
  rooms: { id: string }[],
  types: { id: string }[],
) {
  const today = bangkokDateKey();
  const y1 = bangkokDateKeyMinusDays(today, 1);
  const y2 = bangkokDateKeyMinusDays(today, 2);
  const t1 = bangkokDateKeyMinusDays(today, -1);
  const t2 = bangkokDateKeyMinusDays(today, -2);
  const t3 = bangkokDateKeyMinusDays(today, -3);

  const guest1 = await db.hotelResortGuest.create({
    data: {
      ownerUserId,
      trialSessionId,
      fullName: "คุณสมชาย ใจดี",
      phone: "0812345678",
      nationalId: "1234567890123",
      nationality: "ไทย",
      address: DEMO_MODULE_CONTACT.address,
    },
  });
  const guest2 = await db.hotelResortGuest.create({
    data: {
      ownerUserId,
      trialSessionId,
      fullName: "Sarah Miller",
      phone: "0898765432",
      nationality: "USA",
    },
  });
  const guest3 = await db.hotelResortGuest.create({
    data: {
      ownerUserId,
      trialSessionId,
      fullName: "คุณนภา สุขใจ",
      phone: "0821112233",
      nationality: "ไทย",
    },
  });

  await db.hotelResortBooking.createMany({
    data: [
      {
        ownerUserId,
        trialSessionId,
        guestId: guest1.id,
        roomId: rooms[0]!.id,
        roomTypeId: types[0]!.id,
        guestName: guest1.fullName,
        guestPhone: guest1.phone,
        checkInAt: bangkokNoon(y1, 14),
        checkOutAt: bangkokNoon(t1, 12),
        status: "CHECKED_IN",
        isWalkIn: false,
        totalBaht: 2400,
        amountPaidBaht: 1200,
        paymentStatus: "PARTIAL",
        paymentMethod: "PROMPTPAY",
      },
      {
        ownerUserId,
        trialSessionId,
        guestId: guest2.id,
        roomId: rooms[3]!.id,
        roomTypeId: types[1]!.id,
        guestName: guest2.fullName,
        guestPhone: guest2.phone,
        checkInAt: bangkokNoon(today, 15),
        checkOutAt: bangkokNoon(t2, 12),
        status: "CHECKED_IN",
        isWalkIn: true,
        totalBaht: 4400,
        amountPaidBaht: 4400,
        paymentStatus: "PAID",
        paymentMethod: "CASH",
      },
      {
        ownerUserId,
        trialSessionId,
        guestId: guest1.id,
        roomId: rooms[2]!.id,
        roomTypeId: types[0]!.id,
        guestName: guest1.fullName,
        guestPhone: guest1.phone,
        checkInAt: bangkokNoon(t1, 14),
        checkOutAt: bangkokNoon(t2, 12),
        status: "RESERVED",
        isWalkIn: false,
        totalBaht: 1200,
        amountPaidBaht: 500,
        paymentStatus: "PARTIAL",
        paymentMethod: "TRANSFER",
      },
      {
        ownerUserId,
        trialSessionId,
        guestId: guest3.id,
        roomId: rooms[7]!.id,
        roomTypeId: types[2]!.id,
        guestName: guest3.fullName,
        guestPhone: guest3.phone,
        checkInAt: bangkokNoon(t2, 14),
        checkOutAt: bangkokNoon(t3, 12),
        status: "RESERVED",
        isWalkIn: false,
        totalBaht: 9000,
        amountPaidBaht: 2000,
        paymentStatus: "PARTIAL",
        paymentMethod: "PROMPTPAY",
      },
      {
        ownerUserId,
        trialSessionId,
        roomId: rooms[1]!.id,
        roomTypeId: types[0]!.id,
        guestName: "คุณวิชัย เดินทาง",
        guestPhone: "0865556677",
        checkInAt: bangkokNoon(y2, 14),
        checkOutAt: bangkokNoon(today, 12),
        status: "CHECKED_OUT",
        isWalkIn: false,
        totalBaht: 2400,
        amountPaidBaht: 2400,
        paymentStatus: "PAID",
        paymentMethod: "TRANSFER",
      },
    ],
  });

  await db.hotelResortRoom.update({
    where: { id: rooms[0]!.id },
    data: { status: "OCCUPIED" },
  });
  await db.hotelResortRoom.update({
    where: { id: rooms[3]!.id },
    data: { status: "OCCUPIED" },
  });
  await db.hotelResortRoom.update({
    where: { id: rooms[2]!.id },
    data: { status: "RESERVED" },
  });
  await db.hotelResortRoom.update({
    where: { id: rooms[7]!.id },
    data: { status: "RESERVED" },
  });
  await db.hotelResortRoom.update({
    where: { id: rooms[1]!.id },
    data: { status: "VACANT" },
  });

  const reviewCount = await db.hotelResortReview.count({ where: { ownerUserId, trialSessionId } });
  if (reviewCount === 0) {
    await db.hotelResortReview.createMany({
      data: [
        {
          ownerUserId,
          trialSessionId,
          guestName: "คุณสมชาย",
          rating: 5,
          comment: "ห้องสะอาด พนักงานยิ้มแย้ม จองออนไลน์สะดวกมาก",
          isPublished: true,
          sortOrder: 0,
        },
        {
          ownerUserId,
          trialSessionId,
          guestName: "Sarah",
          rating: 5,
          comment: "Beautiful pool view and fast check-in.",
          isPublished: true,
          sortOrder: 1,
        },
        {
          ownerUserId,
          trialSessionId,
          guestName: "ครอบครัวสุขใจ",
          rating: 4,
          comment: "วิลล่ากว้างดี เหมาะพักครอบครัว — อาหารเช้าอร่อย",
          isPublished: true,
          sortOrder: 2,
        },
      ],
    });
  }

  let utilCat = await db.hotelResortCostCategory.findFirst({
    where: { ownerUserId, name: "สาธารณูปโภค" },
  });
  if (!utilCat) {
    utilCat = await db.hotelResortCostCategory.create({
      data: { ownerUserId, name: "สาธารณูปโภค", sortOrder: 0 },
    });
  }
  let supplyCat = await db.hotelResortCostCategory.findFirst({
    where: { ownerUserId, name: "วัสดุสิ้นเปลือง" },
  });
  if (!supplyCat) {
    supplyCat = await db.hotelResortCostCategory.create({
      data: { ownerUserId, name: "วัสดุสิ้นเปลือง", sortOrder: 1 },
    });
  }

  await db.hotelResortCostEntry.deleteMany({
    where: { ownerUserId, note: DEMO_COST_NOTE },
  });
  await db.hotelResortCostEntry.createMany({
    data: [
      {
        ownerUserId,
        categoryId: utilCat.id,
        label: "ค่าไฟฟ้า",
        amountBaht: 4200,
        spentAt: bangkokNoon(y2, 10),
        note: DEMO_COST_NOTE,
      },
      {
        ownerUserId,
        categoryId: utilCat.id,
        label: "ค่าน้ำประปา",
        amountBaht: 980,
        spentAt: bangkokNoon(y1, 10),
        note: DEMO_COST_NOTE,
      },
      {
        ownerUserId,
        categoryId: supplyCat.id,
        label: "ผ้าเช็ดตัว / สบู่",
        amountBaht: 1500,
        spentAt: bangkokNoon(today, 9),
        note: DEMO_COST_NOTE,
      },
    ],
  });

  await ensureHotelResortIncomeCategories(ownerUserId);
  const customIncome = await db.hotelResortIncomeCategory.findFirst({
    where: { ownerUserId, kind: "CUSTOM", name: "มินิบาร์ / บริการเสริม" },
  });
  const incomeCat =
    customIncome ??
    (await db.hotelResortIncomeCategory.create({
      data: {
        ownerUserId,
        name: "มินิบาร์ / บริการเสริม",
        kind: "CUSTOM",
        sortOrder: 10,
      },
    }));

  await db.hotelResortIncomeEntry.deleteMany({
    where: { ownerUserId, note: DEMO_COST_NOTE },
  });
  await db.hotelResortIncomeEntry.createMany({
    data: [
      {
        ownerUserId,
        categoryId: incomeCat.id,
        label: "มินิบาร์ห้อง 201",
        amountBaht: 350,
        earnedAt: bangkokNoon(today, 18),
        note: DEMO_COST_NOTE,
      },
      {
        ownerUserId,
        categoryId: incomeCat.id,
        label: "ค่าซักรีด",
        amountBaht: 220,
        earnedAt: bangkokNoon(y1, 16),
        note: DEMO_COST_NOTE,
      },
    ],
  });
}

/**
 * ข้อมูลตัวอย่างโรงแรม (production scope) — รีเฟรชรายวันตามปฏิทินไทย
 */
export async function seedHotelResortProdDemoForOwner(
  prisma: PrismaClient,
  ownerUserId: string,
  opts?: { refreshDaily?: boolean },
) {
  const trialSessionId = TRIAL_PROD_SCOPE;
  const refresh = opts?.refreshDaily !== false;

  if (!refresh) {
    const n = await prisma.hotelResortBooking.count({ where: { ownerUserId, trialSessionId } });
    if (n > 0) return;
  }

  await wipeHotelOperational(prisma, ownerUserId, trialSessionId, { wipeRooms: true });
  await upsertRichHotelProfile(prisma, ownerUserId, trialSessionId, "รีสอร์ทมาเวล ดีโม");
  const { rooms, types } = await ensureRoomsCatalog(prisma, ownerUserId);
  await seedHotelActivity(prisma, ownerUserId, trialSessionId, rooms, types);
}

/**
 * ข้อมูลตัวอย่างเมื่อเริ่มทดลองโมดูลโรงแรม — ผูก trialSessionId
 */
export async function seedHotelResortTrialData(
  tx: Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  if (!trialSessionId || trialSessionId === TRIAL_PROD_SCOPE) return;

  await wipeHotelOperational(tx, ownerUserId, trialSessionId, { wipeRooms: false });
  await upsertRichHotelProfile(
    tx,
    ownerUserId,
    trialSessionId,
    trialDemoDisplayName("รีสอร์ทมาเวล"),
  );
  const { rooms, types } = await ensureRoomsCatalog(tx, ownerUserId);
  await seedHotelActivity(tx, ownerUserId, trialSessionId, rooms, types);
}
