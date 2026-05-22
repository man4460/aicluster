import type { PrismaClient } from "@/generated/prisma/client";
import { parseLoyaltyPhoneQuery } from "@/lib/loyalty-stamp/member-qr";

export type DrinkPosMemberDto = {
  id: string;
  phone: string;
  customerName: string | null;
  currentStamps: number;
  stampsPerReward: number;
  rewardTitle: string;
  readyToRedeem: boolean;
};

export async function ensureDrinkPosShopProfile(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
) {
  const existing = await db.drinkPosShopProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
  if (existing) return existing;
  return db.drinkPosShopProfile.create({
    data: { ownerUserId, trialSessionId, stampsPerReward: 10, rewardTitle: "เครื่องดื่มฟรี 1 แก้ว" },
  });
}

export async function findDrinkPosMemberByPhoneQuery(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  phoneRaw: string,
): Promise<DrinkPosMemberDto | { error: string }> {
  const parsed = parseLoyaltyPhoneQuery(phoneRaw);
  if ("error" in parsed) return { error: parsed.error };

  const profile = await ensureDrinkPosShopProfile(db, ownerUserId, trialSessionId);
  const cap = Math.max(1, Math.min(profile.stampsPerReward, 30));

  if (parsed.kind === "full") {
    let member = await db.drinkPosMember.findUnique({
      where: {
        ownerUserId_trialSessionId_phone: {
          ownerUserId,
          trialSessionId,
          phone: parsed.phone,
        },
      },
    });
    if (!member) {
      member = await db.drinkPosMember.create({
        data: { ownerUserId, trialSessionId, phone: parsed.phone },
      });
    }
    return mapMember(member, profile);
  }

  const matches = await db.drinkPosMember.findMany({
    where: { ownerUserId, trialSessionId, phone: { endsWith: parsed.suffix } },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });
  if (matches.length === 0) {
    return { error: "ไม่พบสมาชิก — กรอกเบอร์ 10 หลักเพื่อลงทะเบียน" };
  }
  if (matches.length > 1) {
    return { error: `พบ ${matches.length} สมาชิก — กรอกเบอร์ครบ 10 หลัก` };
  }
  return mapMember(matches[0]!, profile);
}

function mapMember(
  member: { id: string; phone: string; customerName: string | null; currentStamps: number },
  profile: { stampsPerReward: number; rewardTitle: string },
): DrinkPosMemberDto {
  const stampsPerReward = Math.max(1, Math.min(profile.stampsPerReward, 30));
  const currentStamps = Math.min(member.currentStamps, stampsPerReward);
  return {
    id: member.id,
    phone: member.phone,
    customerName: member.customerName,
    currentStamps,
    stampsPerReward,
    rewardTitle: profile.rewardTitle,
    readyToRedeem: currentStamps >= stampsPerReward,
  };
}

export async function applyDrinkPosSaleLoyalty(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  memberId: string | null,
  isRewardRedemption: boolean,
): Promise<void> {
  if (!memberId) return;
  const profile = await ensureDrinkPosShopProfile(db, ownerUserId, trialSessionId);
  const cap = Math.max(1, Math.min(profile.stampsPerReward, 30));
  const member = await db.drinkPosMember.findFirst({
    where: { id: memberId, ownerUserId, trialSessionId },
  });
  if (!member) return;

  if (isRewardRedemption) {
    if (member.currentStamps < cap) return;
    await db.drinkPosMember.update({
      where: { id: member.id },
      data: { currentStamps: 0, totalRedemptions: { increment: 1 } },
    });
    return;
  }

  if (member.currentStamps >= cap) return;
  await db.drinkPosMember.update({
    where: { id: member.id },
    data: { currentStamps: { increment: 1 } },
  });
}
