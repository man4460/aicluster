import { prisma } from "@/lib/prisma";

export async function ensureLoyaltyStampProfile(ownerUserId: string, trialSessionId: string) {
  const existing = await prisma.loyaltyStampShopProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
  if (existing) return existing;

  return prisma.loyaltyStampShopProfile.create({
    data: {
      ownerUserId,
      trialSessionId,
      displayName: "ร้านของฉัน",
      tagline: "สะสมแต้มดิจิทัล — ไม่ต้องพกบัตรกระดาษ",
      publicCardEnabled: true,
      stampsPerReward: 10,
      rewardTitle: "รับของรางวัลฟรี 1 ครั้ง",
      rewardDescription: "เมื่อสะสมครบตามการ์ด แสดงการ์ดให้พนักงานกดแลก",
      stampEmoji: "☕",
    },
  });
}
