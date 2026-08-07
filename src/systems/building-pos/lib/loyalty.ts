import { prisma } from "@/lib/prisma";
import { normalizeMemberPhone } from "@/lib/loyalty-stamp/member-qr";
import {
  calcBuildingPosPointsEarned,
  clampBahtPerPoint,
  clampPointsCost,
  clampPointsPerUnit,
  type BuildingPosLoyaltyMemberDto,
  type BuildingPosLoyaltyRewardDto,
  type BuildingPosLoyaltySettingsDto,
} from "@/systems/building-pos/lib/loyalty-rule";

export {
  calcBuildingPosPointsEarned,
  clampBahtPerPoint,
  clampPointsCost,
  clampPointsPerUnit,
  formatBuildingPosLoyaltyEarnRule,
  type BuildingPosLoyaltyMemberDto,
  type BuildingPosLoyaltyRewardDto,
  type BuildingPosLoyaltySettingsDto,
} from "@/systems/building-pos/lib/loyalty-rule";

export async function ensureBuildingPosLoyaltySettings(
  ownerUserId: string,
  trialSessionId: string,
): Promise<BuildingPosLoyaltySettingsDto> {
  const row = await prisma.buildingPosLoyaltySettings.upsert({
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
  menuItemId: number | null;
  pointsCost: number;
  sortOrder: number;
  isActive: boolean;
  imageUrl?: string | null;
}): BuildingPosLoyaltyRewardDto {
  return {
    id: r.id,
    title: r.title,
    menu_item_id: r.menuItemId,
    points_cost: r.pointsCost,
    sort_order: r.sortOrder,
    is_active: r.isActive,
    image_url: typeof r.imageUrl === "string" ? r.imageUrl.trim() : "",
  };
}

/** รายการแลก + รูปจากเมนูที่ผูก */
export async function listBuildingPosLoyaltyRewards(
  ownerUserId: string,
  trialSessionId: string,
  opts?: { activeOnly?: boolean },
): Promise<BuildingPosLoyaltyRewardDto[]> {
  const rows = await prisma.buildingPosLoyaltyReward.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      ...(opts?.activeOnly ? { isActive: true } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  const menuIds = [
    ...new Set(rows.map((r) => r.menuItemId).filter((id): id is number => typeof id === "number" && id > 0)),
  ];
  const menus =
    menuIds.length > 0 ?
      await prisma.buildingPosMenuItem.findMany({
        where: { ownerUserId, id: { in: menuIds } },
        select: { id: true, imageUrl: true },
      })
    : [];
  const imgById = new Map(menus.map((m) => [m.id, (m.imageUrl ?? "").trim()]));
  return rows.map((r) =>
    mapLoyaltyReward({
      ...r,
      imageUrl: r.menuItemId != null ? (imgById.get(r.menuItemId) ?? "") : "",
    }),
  );
}

export async function enrichBuildingPosLoyaltyRewardImage(
  ownerUserId: string,
  reward: {
    id: number;
    title: string;
    menuItemId: number | null;
    pointsCost: number;
    sortOrder: number;
    isActive: boolean;
  },
): Promise<BuildingPosLoyaltyRewardDto> {
  let imageUrl = "";
  if (reward.menuItemId != null) {
    const m = await prisma.buildingPosMenuItem.findFirst({
      where: { id: reward.menuItemId, ownerUserId },
      select: { imageUrl: true },
    });
    imageUrl = (m?.imageUrl ?? "").trim();
  }
  return mapLoyaltyReward({ ...reward, imageUrl });
}

export function mapLoyaltyMember(r: {
  id: number;
  phone: string;
  customerName: string;
  pointsBalance: number;
  totalEarned: number;
  totalRedeemed: number;
}): BuildingPosLoyaltyMemberDto {
  return {
    id: r.id,
    phone: r.phone,
    customer_name: r.customerName,
    points_balance: r.pointsBalance,
    total_earned: r.totalEarned,
    total_redeemed: r.totalRedeemed,
  };
}

export async function findOrCreateBuildingPosLoyaltyMember(
  ownerUserId: string,
  trialSessionId: string,
  phoneRaw: string,
  customerName = "",
) {
  const phone = normalizeMemberPhone(phoneRaw);
  if (phone.length < 9) {
    return { ok: false as const, error: "เบอร์สมาชิกไม่ถูกต้อง" };
  }
  const existing = await prisma.buildingPosLoyaltyMember.findUnique({
    where: {
      ownerUserId_trialSessionId_phone: { ownerUserId, trialSessionId, phone },
    },
  });
  if (existing) {
    if (customerName.trim() && !existing.customerName.trim()) {
      const updated = await prisma.buildingPosLoyaltyMember.update({
        where: { id: existing.id },
        data: { customerName: customerName.trim().slice(0, 160) },
      });
      return { ok: true as const, member: updated };
    }
    return { ok: true as const, member: existing };
  }
  const created = await prisma.buildingPosLoyaltyMember.create({
    data: {
      ownerUserId,
      trialSessionId,
      phone,
      customerName: customerName.trim().slice(0, 160),
    },
  });
  return { ok: true as const, member: created };
}

/**
 * ให้คะแนนเมื่อออเดอร์เปลี่ยนเป็น PAID (ครั้งเดียวต่อออเดอร์)
 */
export async function applyBuildingPosLoyaltyEarnOnPaid(opts: {
  ownerUserId: string;
  trialSessionId: string;
  orderId: number;
  totalAmount: number;
  memberPhone: string;
  customerName?: string;
  previousPointsEarned: number;
}): Promise<{ pointsEarned: number; memberPhone: string }> {
  if (opts.previousPointsEarned > 0) {
    return { pointsEarned: opts.previousPointsEarned, memberPhone: opts.memberPhone };
  }
  const settings = await ensureBuildingPosLoyaltySettings(opts.ownerUserId, opts.trialSessionId);
  if (!settings.enabled) {
    return { pointsEarned: 0, memberPhone: opts.memberPhone };
  }
  const phone = normalizeMemberPhone(opts.memberPhone);
  if (phone.length < 9) {
    return { pointsEarned: 0, memberPhone: "" };
  }
  const points = calcBuildingPosPointsEarned(
    opts.totalAmount,
    settings.baht_per_point,
    settings.points_per_unit,
  );
  if (points <= 0) {
    return { pointsEarned: 0, memberPhone: phone };
  }

  const memberRes = await findOrCreateBuildingPosLoyaltyMember(
    opts.ownerUserId,
    opts.trialSessionId,
    phone,
    opts.customerName ?? "",
  );
  if (!memberRes.ok) {
    return { pointsEarned: 0, memberPhone: phone };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const member = await tx.buildingPosLoyaltyMember.update({
      where: { id: memberRes.member.id },
      data: {
        pointsBalance: { increment: points },
        totalEarned: { increment: points },
      },
    });
    await tx.buildingPosLoyaltyLedger.create({
      data: {
        ownerUserId: opts.ownerUserId,
        trialSessionId: opts.trialSessionId,
        memberId: member.id,
        kind: "EARN",
        pointsDelta: points,
        balanceAfter: member.pointsBalance,
        orderId: opts.orderId,
        note: `สะสมจากออเดอร์ #${opts.orderId} ยอด ฿${opts.totalAmount.toLocaleString("th-TH")}`,
      },
    });
    await tx.buildingPosOrder.update({
      where: { id: opts.orderId },
      data: {
        memberPhone: phone,
        pointsEarned: points,
      },
    });
    return member;
  });

  return { pointsEarned: points, memberPhone: updated.phone };
}

export async function redeemBuildingPosLoyaltyReward(opts: {
  ownerUserId: string;
  trialSessionId: string;
  phoneRaw: string;
  rewardId: number;
  orderId?: number | null;
  customerName?: string;
  /** ถ้ามี — สร้างออเดอร์ของแถมในธุรกรรมเดียวกับการหักคะแนน */
  createOrder?: {
    tableNo?: string;
    customerSessionId?: string;
    items: Array<{
      menu_item_id: number;
      name: string;
      price: number;
      qty: number;
      note: string;
      kitchen_department_id?: number | null;
      kitchen_status?: string;
    }>;
    note: string;
  };
}): Promise<
  | {
      ok: true;
      member: BuildingPosLoyaltyMemberDto;
      reward: BuildingPosLoyaltyRewardDto;
      pointsSpent: number;
      orderId: number | null;
    }
  | { ok: false; error: string }
> {
  const settings = await ensureBuildingPosLoyaltySettings(opts.ownerUserId, opts.trialSessionId);
  if (!settings.enabled) {
    return { ok: false, error: "ยังไม่เปิดระบบสะสมคะแนน" };
  }
  const memberRes = await findOrCreateBuildingPosLoyaltyMember(
    opts.ownerUserId,
    opts.trialSessionId,
    opts.phoneRaw,
    opts.customerName ?? "",
  );
  if (!memberRes.ok) return { ok: false, error: memberRes.error };

  const reward = await prisma.buildingPosLoyaltyReward.findFirst({
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
    const member = await tx.buildingPosLoyaltyMember.update({
      where: { id: memberRes.member.id },
      data: {
        pointsBalance: { decrement: reward.pointsCost },
        totalRedeemed: { increment: reward.pointsCost },
      },
    });

    let orderId = opts.orderId ?? null;
    if (opts.createOrder) {
      const order = await tx.buildingPosOrder.create({
        data: {
          ownerUserId: opts.ownerUserId,
          trialSessionId: opts.trialSessionId,
          customerName: (opts.customerName ?? "").trim().slice(0, 160),
          tableNo: (opts.createOrder.tableNo ?? "").trim().slice(0, 40),
          memberPhone: member.phone,
          status: "NEW",
          itemsJson: opts.createOrder.items,
          totalAmount: 0,
          note: opts.createOrder.note.slice(0, 1000),
          customerSessionId: opts.createOrder.customerSessionId ?? "",
          pointsRedeemed: reward.pointsCost,
        },
      });
      orderId = order.id;
    } else if (orderId) {
      await tx.buildingPosOrder.update({
        where: { id: orderId },
        data: {
          memberPhone: member.phone,
          pointsRedeemed: { increment: reward.pointsCost },
        },
      });
    }

    await tx.buildingPosLoyaltyLedger.create({
      data: {
        ownerUserId: opts.ownerUserId,
        trialSessionId: opts.trialSessionId,
        memberId: member.id,
        kind: "REDEEM",
        pointsDelta: -reward.pointsCost,
        balanceAfter: member.pointsBalance,
        orderId,
        rewardId: reward.id,
        note: `แลก ${reward.title}`,
      },
    });

    return { member, reward, orderId };
  });

  return {
    ok: true,
    member: mapLoyaltyMember(result.member),
    reward: mapLoyaltyReward(result.reward),
    pointsSpent: reward.pointsCost,
    orderId: result.orderId,
  };
}
