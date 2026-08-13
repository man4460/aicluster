import { prisma } from "@/lib/prisma";
import { drinkPosPublicImageUrl } from "@/lib/drink-pos/drink-stock-images";
import { normalizeMemberPhone } from "@/lib/loyalty-stamp/member-qr";
import {
  calcDrinkPosPointsEarned,
  clampBahtPerPoint,
  clampPointsCost,
  clampPointsPerUnit,
  type DrinkPosLoyaltyMemberDto,
  type DrinkPosLoyaltyRewardDto,
  type DrinkPosLoyaltySettingsDto,
} from "@/systems/drink-pos/lib/loyalty-rule";

export {
  calcDrinkPosPointsEarned,
  clampBahtPerPoint,
  clampPointsCost,
  clampPointsPerUnit,
  formatDrinkPosLoyaltyEarnRule,
  type DrinkPosLoyaltyMemberDto,
  type DrinkPosLoyaltyRewardDto,
  type DrinkPosLoyaltySettingsDto,
} from "@/systems/drink-pos/lib/loyalty-rule";

export async function ensureDrinkPosLoyaltySettings(
  ownerUserId: string,
  trialSessionId: string,
): Promise<DrinkPosLoyaltySettingsDto> {
  const row = await prisma.drinkPosLoyaltySettings.upsert({
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

export function mapDrinkPosLoyaltyReward(r: {
  id: number;
  title: string;
  productId: string | null;
  pointsCost: number;
  sortOrder: number;
  isActive: boolean;
  imageUrl?: string | null;
}): DrinkPosLoyaltyRewardDto {
  return {
    id: r.id,
    title: r.title,
    product_id: r.productId,
    points_cost: r.pointsCost,
    sort_order: r.sortOrder,
    is_active: r.isActive,
    image_url: drinkPosPublicImageUrl(r.imageUrl) ?? "",
  };
}

/** รูปแสดง: รูปกำหนดเองก่อน · ไม่มีค่อยใช้รูปสินค้าที่ผูก */
function resolveDrinkPosLoyaltyRewardImageUrl(
  customImageUrl: string | null | undefined,
  productId: string | null | undefined,
  productImageById: Map<string, string>,
): string {
  const custom = drinkPosPublicImageUrl(customImageUrl) ?? "";
  if (custom) return custom;
  if (productId) return drinkPosPublicImageUrl(productImageById.get(productId)) ?? "";
  return "";
}

/** รายการแลก + รูป (กำหนดเอง หรือจากสินค้าที่ผูก) */
export async function listDrinkPosLoyaltyRewards(
  ownerUserId: string,
  trialSessionId: string,
  opts?: { activeOnly?: boolean },
): Promise<DrinkPosLoyaltyRewardDto[]> {
  const rows = await prisma.drinkPosLoyaltyReward.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      ...(opts?.activeOnly ? { isActive: true } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  const productIds = [
    ...new Set(
      rows.map((r) => r.productId).filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  const products =
    productIds.length > 0 ?
      await prisma.drinkPosProduct.findMany({
        where: { ownerUserId, id: { in: productIds } },
        select: { id: true, imageUrl: true },
      })
    : [];
  const imgById = new Map(products.map((p) => [p.id, (p.imageUrl ?? "").trim()]));
  return rows.map((r) =>
    mapDrinkPosLoyaltyReward({
      ...r,
      imageUrl: resolveDrinkPosLoyaltyRewardImageUrl(r.imageUrl, r.productId, imgById),
    }),
  );
}

export async function enrichDrinkPosLoyaltyRewardImage(
  ownerUserId: string,
  reward: {
    id: number;
    title: string;
    productId: string | null;
    pointsCost: number;
    sortOrder: number;
    isActive: boolean;
    imageUrl?: string | null;
  },
): Promise<DrinkPosLoyaltyRewardDto> {
  const custom = typeof reward.imageUrl === "string" ? reward.imageUrl.trim() : "";
  if (custom) {
    return mapDrinkPosLoyaltyReward({ ...reward, imageUrl: custom });
  }
  let imageUrl = "";
  if (reward.productId) {
    const p = await prisma.drinkPosProduct.findFirst({
      where: { id: reward.productId, ownerUserId },
      select: { imageUrl: true },
    });
    imageUrl = (p?.imageUrl ?? "").trim();
  }
  return mapDrinkPosLoyaltyReward({ ...reward, imageUrl });
}

export function mapDrinkPosLoyaltyMember(r: {
  id: string;
  phone: string;
  customerName: string | null;
  pointsBalance: number;
  totalEarned: number;
  totalRedeemed: number;
}): DrinkPosLoyaltyMemberDto {
  return {
    id: r.id,
    phone: r.phone,
    customer_name: r.customerName,
    points_balance: r.pointsBalance,
    total_earned: r.totalEarned,
    total_redeemed: r.totalRedeemed,
  };
}

export async function findOrCreateDrinkPosLoyaltyMember(
  ownerUserId: string,
  trialSessionId: string,
  phoneRaw: string,
  customerName = "",
) {
  const phone = normalizeMemberPhone(phoneRaw);
  if (phone.length < 9) {
    return { ok: false as const, error: "เบอร์สมาชิกไม่ถูกต้อง" };
  }
  const existing = await prisma.drinkPosMember.findUnique({
    where: {
      ownerUserId_trialSessionId_phone: { ownerUserId, trialSessionId, phone },
    },
  });
  if (existing) {
    if (customerName.trim() && !existing.customerName?.trim()) {
      const updated = await prisma.drinkPosMember.update({
        where: { id: existing.id },
        data: { customerName: customerName.trim().slice(0, 120) },
      });
      return { ok: true as const, member: updated };
    }
    return { ok: true as const, member: existing };
  }
  const created = await prisma.drinkPosMember.create({
    data: {
      ownerUserId,
      trialSessionId,
      phone,
      customerName: customerName.trim().slice(0, 120) || null,
    },
  });
  return { ok: true as const, member: created };
}

/** ให้คะแนนเมื่อสร้างบิลขาย (ยอดบาท) — ครั้งเดียวต่อ sale */
export async function applyDrinkPosLoyaltyEarnOnSale(opts: {
  ownerUserId: string;
  trialSessionId: string;
  saleId: string;
  totalAmount: number;
  memberPhone: string;
  customerName?: string;
  previousPointsEarned: number;
}): Promise<{ pointsEarned: number; memberPhone: string }> {
  if (opts.previousPointsEarned > 0) {
    return { pointsEarned: opts.previousPointsEarned, memberPhone: opts.memberPhone };
  }
  const settings = await ensureDrinkPosLoyaltySettings(opts.ownerUserId, opts.trialSessionId);
  if (!settings.enabled) {
    return { pointsEarned: 0, memberPhone: opts.memberPhone };
  }
  const phone = normalizeMemberPhone(opts.memberPhone);
  if (phone.length < 9) {
    return { pointsEarned: 0, memberPhone: "" };
  }
  const points = calcDrinkPosPointsEarned(
    opts.totalAmount,
    settings.baht_per_point,
    settings.points_per_unit,
  );
  if (points <= 0) {
    return { pointsEarned: 0, memberPhone: phone };
  }

  const memberRes = await findOrCreateDrinkPosLoyaltyMember(
    opts.ownerUserId,
    opts.trialSessionId,
    phone,
    opts.customerName ?? "",
  );
  if (!memberRes.ok) {
    return { pointsEarned: 0, memberPhone: phone };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const member = await tx.drinkPosMember.update({
      where: { id: memberRes.member.id },
      data: {
        pointsBalance: { increment: points },
        totalEarned: { increment: points },
      },
    });
    await tx.drinkPosLoyaltyLedger.create({
      data: {
        ownerUserId: opts.ownerUserId,
        trialSessionId: opts.trialSessionId,
        memberId: member.id,
        kind: "EARN",
        pointsDelta: points,
        balanceAfter: member.pointsBalance,
        saleId: opts.saleId,
        note: `สะสมจากบิล ฿${opts.totalAmount.toLocaleString("th-TH")}`,
      },
    });
    await tx.drinkPosSale.update({
      where: { id: opts.saleId },
      data: {
        memberPhone: phone,
        memberId: member.id,
        pointsEarned: points,
      },
    });
    return member;
  });

  return { pointsEarned: points, memberPhone: updated.phone };
}

export async function redeemDrinkPosLoyaltyReward(opts: {
  ownerUserId: string;
  trialSessionId: string;
  phoneRaw: string;
  rewardId: number;
  saleId?: string | null;
  customerName?: string;
  /** สร้างบิลฟรีเข้าคิวทำเครื่องดื่ม */
  createSale?: boolean;
}): Promise<
  | {
      ok: true;
      member: DrinkPosLoyaltyMemberDto;
      reward: DrinkPosLoyaltyRewardDto;
      pointsSpent: number;
      saleId: string | null;
    }
  | { ok: false; error: string }
> {
  const settings = await ensureDrinkPosLoyaltySettings(opts.ownerUserId, opts.trialSessionId);
  if (!settings.enabled) {
    return { ok: false, error: "ยังไม่เปิดระบบสะสมคะแนน" };
  }
  const memberRes = await findOrCreateDrinkPosLoyaltyMember(
    opts.ownerUserId,
    opts.trialSessionId,
    opts.phoneRaw,
    opts.customerName ?? "",
  );
  if (!memberRes.ok) return { ok: false, error: memberRes.error };

  const reward = await prisma.drinkPosLoyaltyReward.findFirst({
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

  let productLine: {
    productId: string | null;
    productName: string;
    sizeLabel: string | null;
    unitPriceBaht: number;
    quantity: number;
    lineTotalBaht: number;
  } = {
    productId: null,
    productName: reward.title,
    sizeLabel: null,
    unitPriceBaht: 0,
    quantity: 1,
    lineTotalBaht: 0,
  };

  if (reward.productId) {
    const product = await prisma.drinkPosProduct.findFirst({
      where: {
        id: reward.productId,
        ownerUserId: opts.ownerUserId,
        isActive: true,
      },
      select: { id: true, name: true },
    });
    if (product) {
      productLine = {
        productId: product.id,
        productName: product.name,
        sizeLabel: null,
        unitPriceBaht: 0,
        quantity: 1,
        lineTotalBaht: 0,
      };
    }
  }

  const shouldCreateSale = Boolean(opts.createSale) && !opts.saleId;

  const result = await prisma.$transaction(async (tx) => {
    const member = await tx.drinkPosMember.update({
      where: { id: memberRes.member.id },
      data: {
        pointsBalance: { decrement: reward.pointsCost },
        totalRedeemed: { increment: reward.pointsCost },
        totalRedemptions: { increment: 1 },
      },
    });

    let saleId = opts.saleId ?? null;
    if (shouldCreateSale) {
      const sale = await tx.drinkPosSale.create({
        data: {
          ownerUserId: opts.ownerUserId,
          memberId: member.id,
          memberPhone: member.phone,
          isRewardRedemption: true,
          pointsRedeemed: reward.pointsCost,
          paymentMethod: "CASH",
          fulfillmentStatus: "RECEIVED",
          statusUpdatedAt: new Date(),
          note: `แลกคะแนน · ${reward.title}`,
          totalBaht: 0,
          lines: { create: [productLine] },
        },
      });
      saleId = sale.id;
    } else if (opts.saleId) {
      await tx.drinkPosSale.update({
        where: { id: opts.saleId },
        data: {
          memberPhone: member.phone,
          memberId: member.id,
          pointsRedeemed: { increment: reward.pointsCost },
          isRewardRedemption: true,
        },
      });
    }

    await tx.drinkPosLoyaltyLedger.create({
      data: {
        ownerUserId: opts.ownerUserId,
        trialSessionId: opts.trialSessionId,
        memberId: member.id,
        kind: "REDEEM",
        pointsDelta: -reward.pointsCost,
        balanceAfter: member.pointsBalance,
        saleId,
        rewardId: reward.id,
        note: `แลก ${reward.title}`,
      },
    });
    return { member, reward, saleId };
  });

  return {
    ok: true,
    member: mapDrinkPosLoyaltyMember(result.member),
    reward: await enrichDrinkPosLoyaltyRewardImage(opts.ownerUserId, result.reward),
    pointsSpent: reward.pointsCost,
    saleId: result.saleId,
  };
}
