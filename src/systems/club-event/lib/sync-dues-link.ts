import type { PrismaClient } from "@/generated/prisma/client";
import { CLUB_EVENT_DUES_PERIOD_LABELS, type ClubEventDuesPeriodKey } from "@/systems/club-event/lib/dues";

type SyncArgs = {
  prisma: PrismaClient;
  profileId: string;
  ownerUserId: string;
  trialSessionId: string;
  duesEnabled: boolean;
  duesAmountBaht: number;
  duesPeriod: ClubEventDuesPeriodKey;
  existingDuesLinkId?: string | null;
};

/** สร้าง/อัปเดต/ปิดลิงก์ชำระค่าบำรุงสาธารณะจากตั้งค่าชมรม */
export async function syncClubEventDuesPublicLink(args: SyncArgs): Promise<string | null> {
  const {
    prisma,
    profileId,
    ownerUserId,
    trialSessionId,
    duesEnabled,
    duesAmountBaht,
    duesPeriod,
    existingDuesLinkId,
  } = args;

  const periodLabel = CLUB_EVENT_DUES_PERIOD_LABELS[duesPeriod] ?? "รายปี";
  const title = `จ่ายค่าบำรุง${periodLabel}`;
  const configJson = JSON.stringify({
    amountBaht: Math.max(0, Math.round(duesAmountBaht)),
    description: `ค่าบำรุงสมาชิก (${periodLabel})`,
    fields: [{ key: "note", label: "หมายเหตุการโอน", type: "text", required: false }],
    isClubDuesLink: true,
  });

  if (!duesEnabled || duesAmountBaht <= 0) {
    if (existingDuesLinkId) {
      await prisma.clubEventDynamicLink.updateMany({
        where: { id: existingDuesLinkId, profileId },
        data: { isActive: false },
      });
    }
    return null;
  }

  if (existingDuesLinkId) {
    const updated = await prisma.clubEventDynamicLink.updateMany({
      where: { id: existingDuesLinkId, profileId },
      data: {
        type: "PAYMENT",
        title,
        configJson,
        isActive: true,
      },
    });
    if (updated.count > 0) return existingDuesLinkId;
  }

  const created = await prisma.clubEventDynamicLink.create({
    data: {
      ownerUserId,
      trialSessionId,
      profileId,
      type: "PAYMENT",
      title,
      configJson,
      isActive: true,
    },
    select: { id: true },
  });
  return created.id;
}
