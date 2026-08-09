import { prisma } from "@/lib/prisma";
import { normalizeMemberPhone } from "@/lib/loyalty-stamp/member-qr";
import { formatBookingDate } from "@/systems/football-turf/lib/mappers";
import {
  calcFootballTurfPointsEarned,
  clampBahtPerPoint,
  clampPointsCost,
  clampPointsPerUnit,
  type FootballTurfCustomerUsageStats,
  type FootballTurfLoyaltyMemberDto,
  type FootballTurfLoyaltyRewardDto,
  type FootballTurfLoyaltySettingsDto,
} from "@/systems/football-turf/lib/loyalty-rule";

export {
  calcFootballTurfPointsEarned,
  clampBahtPerPoint,
  clampPointsCost,
  clampPointsPerUnit,
  formatFootballTurfLoyaltyEarnRule,
  type FootballTurfCustomerUsageStats,
  type FootballTurfLoyaltyMemberDto,
  type FootballTurfLoyaltyRewardDto,
  type FootballTurfLoyaltySettingsDto,
} from "@/systems/football-turf/lib/loyalty-rule";

export async function ensureFootballTurfLoyaltySettings(
  ownerUserId: string,
  trialSessionId: string,
): Promise<FootballTurfLoyaltySettingsDto> {
  const row = await prisma.footballTurfLoyaltySettings.upsert({
    where: {
      ownerUserId_trialSessionId: { ownerUserId, trialSessionId },
    },
    create: {
      ownerUserId,
      trialSessionId,
      enabled: false,
      bahtPerPoint: 100,
      pointsPerUnit: 1,
    },
    update: {},
  });
  return {
    enabled: row.enabled,
    baht_per_point: row.bahtPerPoint,
    points_per_unit: row.pointsPerUnit,
  };
}

export function mapLoyaltyReward(r: {
  id: number;
  title: string;
  pointsCost: number;
  sortOrder: number;
  isActive: boolean;
  imageUrl?: string | null;
}): FootballTurfLoyaltyRewardDto {
  return {
    id: r.id,
    title: r.title,
    points_cost: r.pointsCost,
    sort_order: r.sortOrder,
    is_active: r.isActive,
    image_url: typeof r.imageUrl === "string" ? r.imageUrl.trim() : "",
  };
}

export async function listFootballTurfLoyaltyRewards(
  ownerUserId: string,
  trialSessionId: string,
  opts?: { activeOnly?: boolean },
): Promise<FootballTurfLoyaltyRewardDto[]> {
  const rows = await prisma.footballTurfLoyaltyReward.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      ...(opts?.activeOnly ? { isActive: true } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return rows.map(mapLoyaltyReward);
}

export function mapLoyaltyMember(r: {
  id: number;
  phone: string;
  customerName: string;
  pointsBalance: number;
  totalEarned: number;
  totalRedeemed: number;
}): FootballTurfLoyaltyMemberDto {
  return {
    id: r.id,
    phone: r.phone,
    customer_name: r.customerName,
    points_balance: r.pointsBalance,
    total_earned: r.totalEarned,
    total_redeemed: r.totalRedeemed,
  };
}

export async function findOrCreateFootballTurfLoyaltyMember(
  ownerUserId: string,
  trialSessionId: string,
  phoneRaw: string,
  customerName = "",
) {
  const phone = normalizeMemberPhone(phoneRaw);
  if (phone.length < 9) {
    return { ok: false as const, error: "เบอร์สมาชิกไม่ถูกต้อง" };
  }
  const existing = await prisma.footballTurfLoyaltyMember.findUnique({
    where: {
      ownerUserId_trialSessionId_phone: { ownerUserId, trialSessionId, phone },
    },
  });
  if (existing) {
    if (customerName.trim() && !existing.customerName.trim()) {
      const updated = await prisma.footballTurfLoyaltyMember.update({
        where: { id: existing.id },
        data: { customerName: customerName.trim().slice(0, 160) },
      });
      return { ok: true as const, member: updated };
    }
    return { ok: true as const, member: existing };
  }
  const created = await prisma.footballTurfLoyaltyMember.create({
    data: {
      ownerUserId,
      trialSessionId,
      phone,
      customerName: customerName.trim().slice(0, 160),
    },
  });
  return { ok: true as const, member: created };
}

export async function applyFootballTurfLoyaltyEarnOnBookingPaid(opts: {
  ownerUserId: string;
  trialSessionId: string;
  bookingId: number;
  totalAmount: number;
  memberPhone: string;
  customerName?: string;
  previousPointsEarned: number;
}): Promise<{ pointsEarned: number }> {
  if (opts.previousPointsEarned > 0) {
    return { pointsEarned: opts.previousPointsEarned };
  }
  const settings = await ensureFootballTurfLoyaltySettings(opts.ownerUserId, opts.trialSessionId);
  if (!settings.enabled) return { pointsEarned: 0 };
  const phone = normalizeMemberPhone(opts.memberPhone);
  if (phone.length < 9) return { pointsEarned: 0 };
  const points = calcFootballTurfPointsEarned(
    opts.totalAmount,
    settings.baht_per_point,
    settings.points_per_unit,
  );
  if (points <= 0) return { pointsEarned: 0 };

  const memberRes = await findOrCreateFootballTurfLoyaltyMember(
    opts.ownerUserId,
    opts.trialSessionId,
    phone,
    opts.customerName ?? "",
  );
  if (!memberRes.ok) return { pointsEarned: 0 };

  await prisma.$transaction(async (tx) => {
    const member = await tx.footballTurfLoyaltyMember.update({
      where: { id: memberRes.member.id },
      data: {
        pointsBalance: { increment: points },
        totalEarned: { increment: points },
      },
    });
    await tx.footballTurfLoyaltyLedger.create({
      data: {
        ownerUserId: opts.ownerUserId,
        trialSessionId: opts.trialSessionId,
        memberId: member.id,
        kind: "EARN",
        pointsDelta: points,
        balanceAfter: member.pointsBalance,
        bookingId: opts.bookingId,
        note: `สะสมจากจอง #${opts.bookingId} ยอด ฿${opts.totalAmount.toLocaleString("th-TH")}`,
      },
    });
    await tx.footballTurfBooking.update({
      where: { id: opts.bookingId },
      data: { pointsEarned: points },
    });
  });

  return { pointsEarned: points };
}

export async function applyFootballTurfLoyaltyEarnOnPromotionSalePaid(opts: {
  ownerUserId: string;
  trialSessionId: string;
  promotionSaleId: number;
  totalAmount: number;
  memberPhone: string;
  customerName?: string;
  previousPointsEarned: number;
}): Promise<{ pointsEarned: number }> {
  if (opts.previousPointsEarned > 0) {
    return { pointsEarned: opts.previousPointsEarned };
  }
  const settings = await ensureFootballTurfLoyaltySettings(opts.ownerUserId, opts.trialSessionId);
  if (!settings.enabled) return { pointsEarned: 0 };
  const phone = normalizeMemberPhone(opts.memberPhone);
  if (phone.length < 9) return { pointsEarned: 0 };
  const points = calcFootballTurfPointsEarned(
    opts.totalAmount,
    settings.baht_per_point,
    settings.points_per_unit,
  );
  if (points <= 0) return { pointsEarned: 0 };

  const memberRes = await findOrCreateFootballTurfLoyaltyMember(
    opts.ownerUserId,
    opts.trialSessionId,
    phone,
    opts.customerName ?? "",
  );
  if (!memberRes.ok) return { pointsEarned: 0 };

  await prisma.$transaction(async (tx) => {
    const member = await tx.footballTurfLoyaltyMember.update({
      where: { id: memberRes.member.id },
      data: {
        pointsBalance: { increment: points },
        totalEarned: { increment: points },
      },
    });
    await tx.footballTurfLoyaltyLedger.create({
      data: {
        ownerUserId: opts.ownerUserId,
        trialSessionId: opts.trialSessionId,
        memberId: member.id,
        kind: "EARN",
        pointsDelta: points,
        balanceAfter: member.pointsBalance,
        promotionSaleId: opts.promotionSaleId,
        note: `สะสมจากขายโปร #${opts.promotionSaleId} ยอด ฿${opts.totalAmount.toLocaleString("th-TH")}`,
      },
    });
    await tx.footballTurfPromotionSale.update({
      where: { id: opts.promotionSaleId },
      data: { pointsEarned: points },
    });
  });

  return { pointsEarned: points };
}

export async function redeemFootballTurfLoyaltyReward(opts: {
  ownerUserId: string;
  trialSessionId: string;
  phoneRaw: string;
  rewardId: number;
  customerName?: string;
}): Promise<
  | { ok: true; member: FootballTurfLoyaltyMemberDto; reward: FootballTurfLoyaltyRewardDto; pointsSpent: number }
  | { ok: false; error: string }
> {
  const settings = await ensureFootballTurfLoyaltySettings(opts.ownerUserId, opts.trialSessionId);
  if (!settings.enabled) {
    return { ok: false, error: "ยังไม่เปิดระบบสะสมคะแนน" };
  }
  const memberRes = await findOrCreateFootballTurfLoyaltyMember(
    opts.ownerUserId,
    opts.trialSessionId,
    opts.phoneRaw,
    opts.customerName ?? "",
  );
  if (!memberRes.ok) return { ok: false, error: memberRes.error };

  const reward = await prisma.footballTurfLoyaltyReward.findFirst({
    where: {
      id: opts.rewardId,
      ownerUserId: opts.ownerUserId,
      trialSessionId: opts.trialSessionId,
      isActive: true,
    },
  });
  if (!reward) return { ok: false, error: "ไม่พบรายการแลกคะแนน" };
  if (memberRes.member.pointsBalance < reward.pointsCost) {
    return {
      ok: false,
      error: `คะแนนไม่พอ (มี ${memberRes.member.pointsBalance} ต้องการ ${reward.pointsCost})`,
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    const member = await tx.footballTurfLoyaltyMember.update({
      where: { id: memberRes.member.id },
      data: {
        pointsBalance: { decrement: reward.pointsCost },
        totalRedeemed: { increment: reward.pointsCost },
      },
    });
    await tx.footballTurfLoyaltyLedger.create({
      data: {
        ownerUserId: opts.ownerUserId,
        trialSessionId: opts.trialSessionId,
        memberId: member.id,
        kind: "REDEEM",
        pointsDelta: -reward.pointsCost,
        balanceAfter: member.pointsBalance,
        rewardId: reward.id,
        note: `แลก ${reward.title}`,
      },
    });
    return { member, reward };
  });

  return {
    ok: true,
    member: mapLoyaltyMember(result.member),
    reward: mapLoyaltyReward(result.reward),
    pointsSpent: reward.pointsCost,
  };
}

export async function getFootballTurfCustomerUsageStats(
  ownerUserId: string,
  trialSessionId: string,
  phoneRaw: string,
): Promise<FootballTurfCustomerUsageStats | null> {
  const phone = normalizeMemberPhone(phoneRaw);
  if (phone.length < 9) return null;

  const customer = await prisma.footballTurfCustomer.findFirst({
    where: {
      ownerUserId,
      trialSessionId,
      OR: [{ phone }, { phone: { contains: phone.slice(-9) } }],
    },
  });

  const member = await prisma.footballTurfLoyaltyMember.findUnique({
    where: {
      ownerUserId_trialSessionId_phone: { ownerUserId, trialSessionId, phone },
    },
  });

  const bookings = await prisma.footballTurfBooking.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      customerPhone: { contains: phone.slice(-9) },
    },
    include: { court: { select: { name: true } } },
    orderBy: [{ bookingDate: "desc" }, { startTime: "desc" }],
  });

  const promoSales = await prisma.footballTurfPromotionSale.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      customerPhone: { contains: phone.slice(-9) },
    },
  });

  const ledger =
    member != null
      ? await prisma.footballTurfLoyaltyLedger.findMany({
          where: { memberId: member.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : [];

  const matchedBookings = bookings.filter(
    (b) => normalizeMemberPhone(b.customerPhone) === phone || b.customerPhone.includes(phone),
  );
  const matchedPromos = promoSales.filter(
    (p) => normalizeMemberPhone(p.customerPhone) === phone || p.customerPhone.includes(phone),
  );

  const name =
    customer?.name?.trim() ||
    member?.customerName?.trim() ||
    matchedBookings[0]?.customerName ||
    "";
  const teamName =
    customer?.teamName?.trim() || matchedBookings[0]?.teamName || matchedPromos[0]?.teamName || "";

  return {
    phone,
    name,
    teamName,
    note: customer?.note ?? "",
    isActive: customer?.isActive ?? true,
    pointsBalance: member?.pointsBalance ?? 0,
    totalEarned: member?.totalEarned ?? 0,
    totalRedeemed: member?.totalRedeemed ?? 0,
    bookingCount: matchedBookings.length,
    completedCount: matchedBookings.filter((b) => b.status === "COMPLETED").length,
    cancelledCount: matchedBookings.filter((b) => b.status === "CANCELLED").length,
    totalPaidBaht: matchedBookings
      .filter((b) => b.status !== "CANCELLED")
      .reduce((s, b) => s + Math.max(0, b.amountPaidBaht || 0), 0),
    promotionSaleCount: matchedPromos.length,
    promotionPaidBaht: matchedPromos
      .filter((p) => p.paymentStatus === "PAID")
      .reduce((s, p) => s + Math.max(0, p.price), 0),
    lastBookingAt: matchedBookings[0]
      ? `${formatBookingDate(matchedBookings[0].bookingDate)} ${matchedBookings[0].startTime}`
      : null,
    recentBookings: matchedBookings.slice(0, 12).map((b) => ({
      id: b.id,
      courtName: b.court.name,
      bookingDate: formatBookingDate(b.bookingDate),
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      paymentStatus: b.paymentStatus,
      finalPrice: b.finalPrice,
      amountPaidBaht: b.amountPaidBaht ?? 0,
    })),
    recentLedger: ledger.map((l) => ({
      id: l.id,
      kind: l.kind,
      pointsDelta: l.pointsDelta,
      balanceAfter: l.balanceAfter,
      note: l.note,
      createdAt: l.createdAt.toISOString(),
    })),
  };
}
