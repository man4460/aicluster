import { prisma } from "@/lib/prisma";

export async function ensureCommunityCoopSettings(ownerUserId: string, trialSessionId: string) {
  const existing = await prisma.communityCoopSettings.findUnique({
    where: {
      ownerUserId_trialSessionId: { ownerUserId, trialSessionId },
    },
  });
  if (existing) return existing;
  return prisma.communityCoopSettings.create({
    data: {
      ownerUserId,
      trialSessionId,
      displayName: "สหกรณ์ชุมชน",
    },
  });
}
