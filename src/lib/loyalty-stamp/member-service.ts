import type { PrismaClient } from "@/generated/prisma/client";
import {
  generateLoyaltyMemberQrToken,
  loyaltyMemberQrPayload,
  parseLoyaltyPhoneQuery,
} from "@/lib/loyalty-stamp/member-qr";
import { buildStampSlots } from "@/lib/loyalty-stamp/stamp-logic";

export type LoyaltyMemberDto = {
  id: number;
  phone: string;
  customerName: string | null;
  currentStamps: number;
  stampsPerReward: number;
  rewardTitle: string;
  rewardDescription: string | null;
  stampEmoji: string;
  readyToRedeem: boolean;
  slots: boolean[];
  totalRedemptions: number;
  qrPayload: string;
};

async function loadLoyaltyShopProfile(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  profileId: number,
) {
  return db.loyaltyStampShopProfile.findFirst({
    where: { id: profileId, ownerUserId, trialSessionId },
  });
}

/** ค้นหาสมาชิกด้วยเบอร์เต็ม (9–10 หลัก) หรือ 4 หลักท้าย — ไม่สร้างรายการใหม่ */
export async function findLoyaltyMemberByPhoneQuery(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  profileId: number,
  phoneRaw: string,
): Promise<LoyaltyMemberDto | { error: string }> {
  const parsed = parseLoyaltyPhoneQuery(phoneRaw);
  if ("error" in parsed) return { error: parsed.error };

  const profile = await loadLoyaltyShopProfile(db, ownerUserId, trialSessionId, profileId);
  if (!profile) return { error: "ไม่พบร้าน" };

  if (parsed.kind === "full") {
    const member = await db.loyaltyStampMember.findUnique({
      where: {
        ownerUserId_trialSessionId_phone: {
          ownerUserId,
          trialSessionId,
          phone: parsed.phone,
        },
      },
    });
    if (!member) return { error: "ไม่พบสมาชิก" };
    return mapMemberDto(member, profile);
  }

  const matches = await db.loyaltyStampMember.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      phone: { endsWith: parsed.suffix },
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });
  if (matches.length === 0) {
    return { error: "ไม่พบสมาชิกจาก 4 หลักท้าย — ลองกรอกเบอร์ครบ 10 หลัก" };
  }
  if (matches.length > 1) {
    return {
      error: `พบ ${matches.length} สมาชิก — กรอกเบอร์ให้ครบ 10 หลัก`,
    };
  }
  return mapMemberDto(matches[0]!, profile);
}

export async function findOrCreateLoyaltyMember(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  profileId: number,
  phoneRaw: string,
  customerName?: string | null,
): Promise<LoyaltyMemberDto | { error: string }> {
  const parsed = parseLoyaltyPhoneQuery(phoneRaw);
  if ("error" in parsed) return { error: parsed.error };
  if (parsed.kind === "suffix4") {
    return {
      error: "ต้องกรอกเบอร์ครบ 9–10 หลักเพื่อเปิดการ์ดครั้งแรก",
    };
  }

  const profile = await loadLoyaltyShopProfile(db, ownerUserId, trialSessionId, profileId);
  if (!profile) return { error: "ไม่พบร้าน" };

  const phone = parsed.phone;
  let member = await db.loyaltyStampMember.findUnique({
    where: {
      ownerUserId_trialSessionId_phone: {
        ownerUserId,
        trialSessionId,
        phone,
      },
    },
  });

  if (!member) {
    member = await db.loyaltyStampMember.create({
      data: {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        phone,
        customerName:
          customerName != null && customerName.trim()
            ? customerName.trim().slice(0, 120)
            : null,
        qrToken: generateLoyaltyMemberQrToken(),
      },
    });
  } else if (customerName?.trim() && !member.customerName) {
    member = await db.loyaltyStampMember.update({
      where: { id: member.id },
      data: { customerName: customerName.trim().slice(0, 120) },
    });
  }

  return mapMemberDto(member, profile);
}

/** ค้นหาเบอร์เต็มหรือ 4 หลักท้าย — ถ้าเบอร์เต็มและไม่พบจะสร้างสมาชิกใหม่ (หน้าร้าน) */
export async function findOrCreateLoyaltyMemberByPhoneQuery(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  profileId: number,
  phoneRaw: string,
  customerName?: string | null,
): Promise<LoyaltyMemberDto | { error: string }> {
  const parsed = parseLoyaltyPhoneQuery(phoneRaw);
  if ("error" in parsed) return { error: parsed.error };
  if (parsed.kind === "suffix4") {
    return findLoyaltyMemberByPhoneQuery(db, ownerUserId, trialSessionId, profileId, phoneRaw);
  }
  return findOrCreateLoyaltyMember(
    db,
    ownerUserId,
    trialSessionId,
    profileId,
    phoneRaw,
    customerName,
  );
}

export function mapMemberDto(
  member: {
    id: number;
    phone: string;
    customerName: string | null;
    currentStamps: number;
    totalRedemptions: number;
    qrToken: string;
  },
  profile: {
    stampsPerReward: number;
    rewardTitle: string;
    rewardDescription: string | null;
    stampEmoji: string;
  },
): LoyaltyMemberDto {
  const card = buildStampSlots(member.currentStamps, profile.stampsPerReward);
  return {
    id: member.id,
    phone: member.phone,
    customerName: member.customerName,
    currentStamps: card.currentStamps,
    stampsPerReward: card.stampsPerReward,
    rewardTitle: profile.rewardTitle,
    rewardDescription: profile.rewardDescription,
    stampEmoji: profile.stampEmoji,
    readyToRedeem: card.readyToRedeem,
    slots: card.slots,
    totalRedemptions: member.totalRedemptions,
    qrPayload: loyaltyMemberQrPayload(member.id, member.qrToken),
  };
}

export async function addStampToMember(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  memberId: number,
): Promise<{ ok: true; member: LoyaltyMemberDto } | { ok: false; error: string }> {
  const member = await db.loyaltyStampMember.findFirst({
    where: { id: memberId, ownerUserId, trialSessionId },
    include: { profile: true },
  });
  if (!member) return { ok: false, error: "ไม่พบสมาชิก" };

  const cap = Math.max(1, Math.min(member.profile.stampsPerReward, 30));
  if (member.currentStamps >= cap) {
    return { ok: false, error: "ครบแต้มแล้ว — กดแลกของรางวัลก่อนเพิ่มแต้มใหม่" };
  }

  const balance = member.currentStamps + 1;
  const updated = await db.$transaction(async (tx) => {
    const row = await tx.loyaltyStampMember.update({
      where: { id: member.id },
      data: { currentStamps: balance },
    });
    await tx.loyaltyStampEvent.create({
      data: {
        ownerUserId,
        trialSessionId,
        memberId: member.id,
        eventType: "STAMP_ADD",
        stampsDelta: 1,
        balanceAfter: balance,
      },
    });
    return row;
  });

  return { ok: true, member: mapMemberDto(updated, member.profile) };
}

export async function redeemMemberReward(
  db: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
  memberId: number,
): Promise<{ ok: true; member: LoyaltyMemberDto } | { ok: false; error: string }> {
  const member = await db.loyaltyStampMember.findFirst({
    where: { id: memberId, ownerUserId, trialSessionId },
    include: { profile: true },
  });
  if (!member) return { ok: false, error: "ไม่พบสมาชิก" };

  const cap = Math.max(1, Math.min(member.profile.stampsPerReward, 30));
  if (member.currentStamps < cap) {
    return { ok: false, error: `ยังสะสมไม่ครบ ${cap} แต้ม` };
  }

  const updated = await db.$transaction(async (tx) => {
    const row = await tx.loyaltyStampMember.update({
      where: { id: member.id },
      data: {
        currentStamps: 0,
        totalRedemptions: { increment: 1 },
      },
    });
    await tx.loyaltyStampEvent.create({
      data: {
        ownerUserId,
        trialSessionId,
        memberId: member.id,
        eventType: "REDEEM",
        stampsDelta: -cap,
        balanceAfter: 0,
        note: member.profile.rewardTitle,
      },
    });
    return row;
  });

  return { ok: true, member: mapMemberDto(updated, member.profile) };
}
