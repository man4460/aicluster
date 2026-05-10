import { prisma } from "@/lib/prisma";

export async function ensureDefaultWaitQueueSite(ownerUserId: string, trialSessionId: string) {
  const existing = await prisma.waitQueueSite.findFirst({
    where: { ownerUserId, trialSessionId },
  });
  if (existing) return existing;
  return prisma.waitQueueSite.create({
    data: {
      ownerUserId,
      trialSessionId,
      name: "คิวหน้าร้าน",
      callMessage: "ถึงคิวแล้ว เชิญเข้าร้าน",
    },
  });
}
