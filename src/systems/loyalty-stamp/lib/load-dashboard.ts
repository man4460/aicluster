import { prisma } from "@/lib/prisma";
import { bangkokDayRangeFromDateKey } from "@/lib/massage/booking-datetime";

export function bangkokTodayDateKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

export type LoyaltyStampDashboardDto = {
  dateKey: string;
  profile: {
    displayName: string | null;
    tagline: string | null;
    stampsPerReward: number;
    rewardTitle: string;
    rewardDescription: string | null;
    stampEmoji: string;
    publicCardEnabled: boolean;
  };
  stats: {
    members: number;
    stampsToday: number;
    redemptionsToday: number;
    readyToRedeem: number;
  };
  recentMembers: {
    id: number;
    phone: string;
    customerName: string | null;
    currentStamps: number;
    stampsPerReward: number;
    readyToRedeem: boolean;
  }[];
};

export async function loadLoyaltyStampDashboard(
  ownerUserId: string,
  trialSessionId: string,
  dateKey = bangkokTodayDateKey(),
): Promise<LoyaltyStampDashboardDto | null> {
  const range = bangkokDayRangeFromDateKey(dateKey);
  if (!range) return null;

  const profile = await prisma.loyaltyStampShopProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
  if (!profile) return null;

  const cap = Math.max(1, Math.min(profile.stampsPerReward, 30));

  const [memberCount, stampsToday, redemptionsToday, readyCount, recent] = await Promise.all([
    prisma.loyaltyStampMember.count({ where: { ownerUserId, trialSessionId } }),
    prisma.loyaltyStampEvent.count({
      where: {
        ownerUserId,
        trialSessionId,
        eventType: "STAMP_ADD",
        createdAt: { gte: range.start, lt: range.end },
      },
    }),
    prisma.loyaltyStampEvent.count({
      where: {
        ownerUserId,
        trialSessionId,
        eventType: "REDEEM",
        createdAt: { gte: range.start, lt: range.end },
      },
    }),
    prisma.loyaltyStampMember.count({
      where: { ownerUserId, trialSessionId, currentStamps: { gte: cap } },
    }),
    prisma.loyaltyStampMember.findMany({
      where: { ownerUserId, trialSessionId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        phone: true,
        customerName: true,
        currentStamps: true,
      },
    }),
  ]);

  return {
    dateKey,
    profile: {
      displayName: profile.displayName,
      tagline: profile.tagline,
      stampsPerReward: cap,
      rewardTitle: profile.rewardTitle,
      rewardDescription: profile.rewardDescription,
      stampEmoji: profile.stampEmoji,
      publicCardEnabled: profile.publicCardEnabled,
    },
    stats: {
      members: memberCount,
      stampsToday,
      redemptionsToday,
      readyToRedeem: readyCount,
    },
    recentMembers: recent.map((m) => ({
      id: m.id,
      phone: m.phone,
      customerName: m.customerName,
      currentStamps: m.currentStamps,
      stampsPerReward: cap,
      readyToRedeem: m.currentStamps >= cap,
    })),
  };
}
