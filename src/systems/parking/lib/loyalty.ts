import { prisma } from "@/lib/prisma";
import {
  calcParkingPointsEarned,
  normalizeParkingMemberPhone,
  type ParkingLoyaltySettingsDto,
} from "./loyalty-rule";

export function parkingLoyaltySettingsFromSite(site: {
  loyaltyEnabled: boolean;
  loyaltyBahtPerPoint: number;
  loyaltyPointsPerUnit: number;
}): ParkingLoyaltySettingsDto {
  return {
    enabled: site.loyaltyEnabled,
    baht_per_point: site.loyaltyBahtPerPoint,
    points_per_unit: site.loyaltyPointsPerUnit,
  };
}

export async function ensureParkingLoyaltyMember(opts: {
  ownerUserId: string;
  trialSessionId: string;
  phone: string;
  customerName?: string | null;
}) {
  const phone = normalizeParkingMemberPhone(opts.phone);
  if (phone.length < 9 || phone.length > 10) return null;
  return prisma.parkingLoyaltyMember.upsert({
    where: {
      ownerUserId_trialSessionId_phone: {
        ownerUserId: opts.ownerUserId,
        trialSessionId: opts.trialSessionId,
        phone,
      },
    },
    create: {
      ownerUserId: opts.ownerUserId,
      trialSessionId: opts.trialSessionId,
      phone,
      customerName: opts.customerName?.trim().slice(0, 160) ?? "",
    },
    update: opts.customerName?.trim() ? { customerName: opts.customerName.trim().slice(0, 160) } : {},
  });
}

/** ให้คะแนนครั้งเดียวต่อ session เมื่อมียอดรับชำระ */
export async function applyParkingLoyaltyEarnOnPaid(opts: {
  ownerUserId: string;
  trialSessionId: string;
  sessionId: number;
  amountPaidBaht: number;
  memberPhone: string;
  customerName?: string | null;
}) {
  const phone = normalizeParkingMemberPhone(opts.memberPhone);
  if (opts.amountPaidBaht <= 0 || phone.length < 9 || phone.length > 10) return 0;
  const session = await prisma.parkingSession.findFirst({
    where: {
      id: opts.sessionId,
      spot: { site: { ownerUserId: opts.ownerUserId, trialSessionId: opts.trialSessionId } },
    },
    include: { spot: { include: { site: true } } },
  });
  if (!session || session.pointsEarned > 0 || !session.spot.site.loyaltyEnabled) return session?.pointsEarned ?? 0;
  const points = calcParkingPointsEarned(
    opts.amountPaidBaht,
    session.spot.site.loyaltyBahtPerPoint,
    session.spot.site.loyaltyPointsPerUnit,
  );
  if (points <= 0) {
    await prisma.parkingSession.update({ where: { id: session.id }, data: { memberPhone: phone } });
    return 0;
  }
  const member = await ensureParkingLoyaltyMember({
    ownerUserId: opts.ownerUserId,
    trialSessionId: opts.trialSessionId,
    phone,
    customerName: opts.customerName,
  });
  if (!member) return 0;

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.parkingSession.updateMany({
      where: { id: session.id, pointsEarned: 0 },
      data: { pointsEarned: points, memberPhone: phone },
    });
    if (claimed.count === 0) {
      const current = await tx.parkingSession.findUnique({ where: { id: session.id }, select: { pointsEarned: true } });
      return current?.pointsEarned ?? 0;
    }
    const updated = await tx.parkingLoyaltyMember.update({
      where: { id: member.id },
      data: { pointsBalance: { increment: points }, totalEarned: { increment: points } },
    });
    await tx.parkingLoyaltyLedger.create({
      data: {
        ownerUserId: opts.ownerUserId,
        trialSessionId: opts.trialSessionId,
        memberId: member.id,
        kind: "EARN",
        pointsDelta: points,
        balanceAfter: updated.pointsBalance,
        sessionId: session.id,
        note: `สะสมจากค่าจอด #${session.id} ยอด ฿${opts.amountPaidBaht.toLocaleString("th-TH")}`,
      },
    });
    return points;
  });
}
