import type { PrismaClient } from "@/generated/prisma/client";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { ensureLoyaltyStampProfile } from "@/systems/loyalty-stamp/lib/ensure-profile";
import { findOrCreateLoyaltyMember } from "@/lib/loyalty-stamp/member-service";

const DEMO_NOTE = "seed:loyalty-stamp-demo-v1";

export async function seedLoyaltyStampProdDemoForOwner(
  prisma: PrismaClient,
  ownerUserId: string,
): Promise<void> {
  const trialSessionId = TRIAL_PROD_SCOPE;
  const existing = await prisma.loyaltyStampMember.count({
    where: { ownerUserId, trialSessionId, phone: { startsWith: "089" } },
  });
  if (existing >= 2) return;

  const profile = await ensureLoyaltyStampProfile(ownerUserId, trialSessionId);
  await prisma.loyaltyStampShopProfile.update({
    where: { id: profile.id },
    data: {
      displayName: "ร้านเดโม่ · สะสมแต้ม",
      tagline: "กาแฟ/เครป — สะสม 10 แต้ม แลกเครื่องดื่มฟรี",
      stampsPerReward: 10,
      rewardTitle: "เครื่องดื่มฟรี 1 แก้ว",
      rewardDescription: "เลือกเมนูใดก็ได้ในร้าน (ไม่เกิน 80 บาท)",
      stampEmoji: "☕",
      publicCardEnabled: true,
    },
  });

  const samples = [
    { phone: "0891111001", name: "คุณมิ้น", stamps: 3 },
    { phone: "0891111002", name: "คุณบอล", stamps: 9 },
    { phone: "0891111003", name: "คุณแพร", stamps: 10 },
  ];

  for (const s of samples) {
    const created = await findOrCreateLoyaltyMember(
      prisma,
      ownerUserId,
      trialSessionId,
      profile.id,
      s.phone,
      s.name,
    );
    if ("error" in created) continue;
    if (s.stamps > 0) {
      await prisma.loyaltyStampMember.update({
        where: { id: created.id },
        data: { currentStamps: Math.min(s.stamps, profile.stampsPerReward) },
      });
      await prisma.loyaltyStampEvent.create({
        data: {
          ownerUserId,
          trialSessionId,
          memberId: created.id,
          eventType: "STAMP_ADD",
          stampsDelta: s.stamps,
          balanceAfter: Math.min(s.stamps, profile.stampsPerReward),
          note: DEMO_NOTE,
        },
      });
    }
  }
}
