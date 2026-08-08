import type { PrismaClient } from "@/generated/prisma/client";
import {
  HOTEL_RESORT_DEFAULT_AMENITIES,
  HOTEL_RESORT_DEFAULT_BED_TYPES,
} from "@/systems/hotel-resort/lib/room-amenities";

/** สร้างแคตตาล็อกเริ่มต้นถ้ายังว่าง */
export async function ensureHotelResortRoomCatalog(prisma: PrismaClient, ownerUserId: string) {
  const [bedCount, amenityCount] = await Promise.all([
    prisma.hotelResortBedTypeOption.count({ where: { ownerUserId } }),
    prisma.hotelResortAmenityOption.count({ where: { ownerUserId } }),
  ]);

  if (bedCount === 0) {
    await prisma.hotelResortBedTypeOption.createMany({
      data: HOTEL_RESORT_DEFAULT_BED_TYPES.map((name, i) => ({
        ownerUserId,
        name,
        sortOrder: i,
      })),
    });
  }

  if (amenityCount === 0) {
    await prisma.hotelResortAmenityOption.createMany({
      data: HOTEL_RESORT_DEFAULT_AMENITIES.map((a, i) => ({
        ownerUserId,
        key: a.key,
        label: a.label,
        sortOrder: i,
      })),
    });
  }
}
