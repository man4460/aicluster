import type { PrismaClient } from "@/generated/prisma/client";

const DEFAULT_BUILDING_NAME = "อาคารหลัก";

/** สร้างอาคารหลักถ้ายังไม่มี — คืนอาคารแรก (เรียง sortOrder) */
export async function ensureHotelResortDefaultBuilding(prisma: PrismaClient, ownerUserId: string) {
  const existing = await prisma.hotelResortBuilding.findFirst({
    where: { ownerUserId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (existing) return existing;

  return prisma.hotelResortBuilding.create({
    data: {
      ownerUserId,
      name: DEFAULT_BUILDING_NAME,
      code: "MAIN",
      sortOrder: 0,
    },
  });
}

export { DEFAULT_BUILDING_NAME };
