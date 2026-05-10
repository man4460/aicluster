import { prisma } from "@/lib/prisma";

export async function ensureSchoolBankSettings(ownerUserId: string, trialSessionId: string) {
  const existing = await prisma.schoolBankSettings.findUnique({
    where: {
      ownerUserId_trialSessionId: { ownerUserId, trialSessionId },
    },
  });
  if (existing) return existing;
  return prisma.schoolBankSettings.create({
    data: {
      ownerUserId,
      trialSessionId,
      displayName: "ธนาคารโรงเรียน",
    },
  });
}
