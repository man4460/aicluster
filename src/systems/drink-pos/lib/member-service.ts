import type { PrismaClient } from "@/generated/prisma/client";
import { parseLoyaltyPhoneQuery } from "@/lib/loyalty-stamp/member-qr";
import {
  ensureDrinkPosLoyaltySettings,
  formatDrinkPosLoyaltyEarnRule,
  listDrinkPosLoyaltyRewards,
  mapDrinkPosLoyaltyMember,
  type DrinkPosLoyaltyMemberDto,
  type DrinkPosLoyaltyRewardDto,
  type DrinkPosLoyaltySettingsDto,
} from "@/systems/drink-pos/lib/loyalty";

export type DrinkPosMemberDto = DrinkPosLoyaltyMemberDto & {
  /** @deprecated ใช้ points_balance */
  currentStamps?: number;
  /** @deprecated */
  stampsPerReward?: number;
  /** @deprecated */
  rewardTitle?: string;
  /** มีรายการแลกที่คะแนนพออย่างน้อย 1 รายการ */
  readyToRedeem?: boolean;
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
  opts?: { createIfMissing?: boolean },
): Promise<DrinkPosMemberDto | { error: string }> {
  const parsed = parseLoyaltyPhoneQuery(phoneRaw);
  if ("error" in parsed) return { error: parsed.error };

  const settings = await ensureDrinkPosLoyaltySettings(ownerUserId, trialSessionId);
  const createIfMissing = opts?.createIfMissing !== false;

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
      if (!createIfMissing) {
        return { error: "ยังไม่มีคะแนนบนเบอร์นี้" };
      }
      member = await db.drinkPosMember.create({
        data: { ownerUserId, trialSessionId, phone: parsed.phone },
      });
    }
    return enrichMemberDto(mapDrinkPosLoyaltyMember(member), settings);
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
  return enrichMemberDto(mapDrinkPosLoyaltyMember(matches[0]!), settings);
}

function enrichMemberDto(
  member: DrinkPosLoyaltyMemberDto,
  settings: DrinkPosLoyaltySettingsDto,
): DrinkPosMemberDto {
  return {
    ...member,
    currentStamps: member.points_balance,
    stampsPerReward: settings.baht_per_point,
    rewardTitle: formatDrinkPosLoyaltyEarnRule(settings.baht_per_point, settings.points_per_unit),
    readyToRedeem: member.points_balance > 0,
  };
}

export async function listActiveDrinkPosLoyaltyRewards(
  ownerUserId: string,
  trialSessionId: string,
): Promise<DrinkPosLoyaltyRewardDto[]> {
  return listDrinkPosLoyaltyRewards(ownerUserId, trialSessionId, { activeOnly: true });
}

/** @deprecated ใช้ applyDrinkPosLoyaltyEarnOnSale / redeemDrinkPosLoyaltyReward */
export async function applyDrinkPosSaleLoyalty(
  _db: PrismaClient,
  _ownerUserId: string,
  _trialSessionId: string,
  _memberId: string | null,
  _isRewardRedemption: boolean,
): Promise<void> {
  /* no-op — จุดสะสม/แลกย้ายไป lib/loyalty.ts */
}
