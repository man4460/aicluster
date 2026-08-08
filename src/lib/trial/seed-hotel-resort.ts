import type { PrismaClient } from "@/generated/prisma/client";
import { ensureHotelResortProfile } from "@/systems/hotel-resort/lib/ensure-profile";
import { ensureHotelResortRoomCatalog } from "@/systems/hotel-resort/lib/ensure-catalog";
import { serializeHotelResortAmenities } from "@/systems/hotel-resort/lib/room-amenities";
import { hotelResortSampleRoomImageUrls } from "@/systems/hotel-resort/lib/room-images";

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

export async function seedHotelResortProdDemoForOwner(prisma: PrismaClient, ownerUserId: string) {
  const trialSessionId = "prod";

  await prisma.hotelResortCostEntry.deleteMany({ where: { ownerUserId } });
  await prisma.hotelResortBooking.deleteMany({ where: { ownerUserId } });
  await prisma.hotelResortGuest.deleteMany({ where: { ownerUserId } });
  await prisma.hotelResortRoom.deleteMany({ where: { ownerUserId } });
  await prisma.hotelResortRoomType.deleteMany({ where: { ownerUserId } });
  await prisma.hotelResortAmenityOption.deleteMany({ where: { ownerUserId } });
  await prisma.hotelResortBedTypeOption.deleteMany({ where: { ownerUserId } });
  await prisma.hotelResortBuilding.deleteMany({ where: { ownerUserId } });
  await prisma.hotelResortStaffLink.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.hotelResortProfile.deleteMany({ where: { ownerUserId, trialSessionId } });

  await ensureHotelResortProfile(prisma, ownerUserId, trialSessionId, "รีสอร์ทมาเวล ดีโม");
  await ensureHotelResortRoomCatalog(prisma, ownerUserId);

  const buildings = await Promise.all(
    BUILDINGS.map((b) =>
      prisma.hotelResortBuilding.create({
        data: { ownerUserId, ...b },
      }),
    ),
  );

  const types = await Promise.all(
    ROOM_TYPES.map((t) =>
      prisma.hotelResortRoomType.create({
        data: { ownerUserId, ...t },
      }),
    ),
  );

  const rooms = await Promise.all(
    ROOMS.map((r, i) =>
      prisma.hotelResortRoom.create({
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

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  const dayAfter = new Date(now.getTime() + 2 * 86400000);
  const yesterday = new Date(now.getTime() - 86400000);

  const guest1 = await prisma.hotelResortGuest.create({
    data: {
      ownerUserId,
      trialSessionId,
      fullName: "คุณสมชาย ใจดี",
      phone: "0812345678",
      nationalId: "1234567890123",
      nationality: "ไทย",
    },
  });

  const guest2 = await prisma.hotelResortGuest.create({
    data: {
      ownerUserId,
      trialSessionId,
      fullName: "Sarah Miller",
      phone: "0898765432",
      nationality: "USA",
    },
  });

  await prisma.hotelResortBooking.create({
    data: {
      ownerUserId,
      trialSessionId,
      guestId: guest1.id,
      roomId: rooms[0]!.id,
      roomTypeId: types[0]!.id,
      guestName: guest1.fullName,
      guestPhone: guest1.phone,
      checkInAt: yesterday,
      checkOutAt: tomorrow,
      status: "CHECKED_IN",
      isWalkIn: false,
      totalBaht: 2400,
      amountPaidBaht: 1200,
      paymentStatus: "PARTIAL",
    },
  });

  await prisma.hotelResortBooking.create({
    data: {
      ownerUserId,
      trialSessionId,
      guestId: guest2.id,
      roomId: rooms[3]!.id,
      roomTypeId: types[1]!.id,
      guestName: guest2.fullName,
      guestPhone: guest2.phone,
      checkInAt: now,
      checkOutAt: dayAfter,
      status: "CHECKED_IN",
      isWalkIn: true,
      totalBaht: 4400,
      amountPaidBaht: 4400,
      paymentStatus: "PAID",
    },
  });

  await prisma.hotelResortBooking.create({
    data: {
      ownerUserId,
      trialSessionId,
      guestId: guest1.id,
      roomId: rooms[2]!.id,
      roomTypeId: types[0]!.id,
      guestName: guest1.fullName,
      guestPhone: guest1.phone,
      checkInAt: tomorrow,
      checkOutAt: dayAfter,
      status: "RESERVED",
      isWalkIn: false,
      totalBaht: 1200,
      amountPaidBaht: 0,
      paymentStatus: "UNPAID",
    },
  });

  await prisma.hotelResortBooking.create({
    data: {
      ownerUserId,
      trialSessionId,
      roomId: rooms[7]!.id,
      roomTypeId: types[2]!.id,
      guestName: "ครอบครัวสุขใจ",
      guestPhone: "0821112233",
      checkInAt: dayAfter,
      checkOutAt: new Date(dayAfter.getTime() + 2 * 86400000),
      status: "RESERVED",
      isWalkIn: false,
      totalBaht: 9000,
      amountPaidBaht: 2000,
      paymentStatus: "PARTIAL",
    },
  });
}
