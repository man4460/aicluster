import type { PrismaClient } from "@/generated/prisma/client";
import { ensureHotelResortProfile } from "@/systems/hotel-resort/lib/ensure-profile";

const ROOM_TYPES = [
  { name: "Standard", basePriceBaht: 1200, maxGuests: 2, sortOrder: 0 },
  { name: "Deluxe", basePriceBaht: 2200, maxGuests: 3, sortOrder: 1 },
  { name: "Villa", basePriceBaht: 4500, maxGuests: 4, sortOrder: 2 },
] as const;

const ROOMS: ReadonlyArray<{ type: 0 | 1 | 2; roomNumber: string; floor: number; status: "VACANT" | "OCCUPIED" | "RESERVED" }> = [
  { type: 0, roomNumber: "101", floor: 1, status: "OCCUPIED" },
  { type: 0, roomNumber: "102", floor: 1, status: "VACANT" },
  { type: 0, roomNumber: "103", floor: 1, status: "RESERVED" },
  { type: 1, roomNumber: "201", floor: 2, status: "OCCUPIED" },
  { type: 1, roomNumber: "202", floor: 2, status: "VACANT" },
  { type: 1, roomNumber: "203", floor: 2, status: "VACANT" },
  { type: 2, roomNumber: "V01", floor: 1, status: "VACANT" },
  { type: 2, roomNumber: "V02", floor: 1, status: "RESERVED" },
];

export async function seedHotelResortProdDemoForOwner(prisma: PrismaClient, ownerUserId: string) {
  const trialSessionId = "prod";

  await prisma.hotelResortCostEntry.deleteMany({ where: { ownerUserId } });
  await prisma.hotelResortBooking.deleteMany({ where: { ownerUserId } });
  await prisma.hotelResortGuest.deleteMany({ where: { ownerUserId } });
  await prisma.hotelResortRoom.deleteMany({ where: { ownerUserId } });
  await prisma.hotelResortRoomType.deleteMany({ where: { ownerUserId } });
  await prisma.hotelResortProfile.deleteMany({ where: { ownerUserId, trialSessionId } });

  await ensureHotelResortProfile(prisma, ownerUserId, trialSessionId, "รีสอร์ทมาเวล ดีโม");

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
          roomTypeId: types[r.type]!.id,
          roomNumber: r.roomNumber,
          floor: r.floor,
          status: r.status,
          sortOrder: i,
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
      guestName: "คุณวิไล ทองดี",
      guestPhone: "0823456789",
      checkInAt: dayAfter,
      checkOutAt: new Date(dayAfter.getTime() + 2 * 86400000),
      status: "RESERVED",
      isWalkIn: false,
      totalBaht: 9000,
      amountPaidBaht: 3000,
      paymentStatus: "PARTIAL",
      note: "จองผ่านเว็บ",
    },
  });

  await prisma.hotelResortCostEntry.createMany({
    data: [
      { ownerUserId, label: "ค่าแม่บ้าน", amountBaht: 8500, spentAt: yesterday },
      { ownerUserId, label: "ค่าไฟฟ้า-น้ำประปา", amountBaht: 12000, spentAt: now },
      { ownerUserId, label: "อาหารเช้า (วัตถุดิบ)", amountBaht: 4500, spentAt: now },
    ],
  });
}
