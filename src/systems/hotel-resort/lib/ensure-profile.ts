import type { PrismaClient } from "@/generated/prisma/client";

export async function ensureHotelResortProfile(
  prisma: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  propertyName?: string,
) {
  return prisma.hotelResortProfile.upsert({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    create: {
      ownerUserId,
      trialSessionId,
      propertyName: propertyName?.trim() || "โรงแรม",
    },
    update: {},
  });
}
