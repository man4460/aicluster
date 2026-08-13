import type { PrismaClient } from "@prisma/client";

export async function ensureBuildingPosShopProfile(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
) {
  return db.buildingPosShopProfile.upsert({
    where: {
      ownerUserId_trialSessionId: { ownerUserId, trialSessionId },
    },
    create: {
      ownerUserId,
      trialSessionId,
      portalGalleryJson: "[]",
    },
    update: {},
  });
}
