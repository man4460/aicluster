import { NextResponse } from "next/server";
import { z } from "zod";
import { parseLoyaltyPhoneQuery } from "@/lib/loyalty-stamp/member-qr";
import { prisma } from "@/lib/prisma";
import { requireDrinkPosStaff } from "@/lib/drink-pos/staff-auth";
import { notifyDrinkPosOrderBoard } from "@/systems/drink-pos/lib/order-board-sse";
import {
  ensureDrinkPosLoyaltySettings,
  findOrCreateDrinkPosLoyaltyMember,
  formatDrinkPosLoyaltyEarnRule,
  listDrinkPosLoyaltyRewards,
  mapDrinkPosLoyaltyMember,
  redeemDrinkPosLoyaltyReward,
} from "@/systems/drink-pos/lib/loyalty";

export async function GET(req: Request) {
  const auth = await requireDrinkPosStaff(req);
  if ("error" in auth) return auth.error;
  const ctx = auth.ctx;
  const settings = await ensureDrinkPosLoyaltySettings(ctx.ownerId, ctx.trialSessionId);
  if (!settings.enabled) {
    return NextResponse.json({
      enabled: false,
      member: null,
      rewards: [],
      rule_preview: formatDrinkPosLoyaltyEarnRule(settings.baht_per_point, settings.points_per_unit),
    });
  }

  const phoneRaw = new URL(req.url).searchParams.get("phone")?.trim() ?? "";
  const q = parseLoyaltyPhoneQuery(phoneRaw);
  if ("error" in q) {
    return NextResponse.json({ error: q.error }, { status: 400 });
  }

  let member = null;
  if (q.kind === "full") {
    const row = await prisma.drinkPosMember.findUnique({
      where: {
        ownerUserId_trialSessionId_phone: {
          ownerUserId: ctx.ownerId,
          trialSessionId: ctx.trialSessionId,
          phone: q.phone,
        },
      },
    });
    member = row ? mapDrinkPosLoyaltyMember(row) : null;
  } else {
    const rows = await prisma.drinkPosMember.findMany({
      where: {
        ownerUserId: ctx.ownerId,
        trialSessionId: ctx.trialSessionId,
        phone: { endsWith: q.suffix },
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
    });
    if (rows.length === 1) member = mapDrinkPosLoyaltyMember(rows[0]!);
    else if (rows.length > 1) {
      const rewards = await listDrinkPosLoyaltyRewards(ctx.ownerId, ctx.trialSessionId, {
        activeOnly: true,
      });
      return NextResponse.json({
        enabled: true,
        member: null,
        error: "พบหลายเบอร์ที่ลงท้ายเหมือนกัน — เลือกเบอร์เต็ม",
        candidates: rows.map(mapDrinkPosLoyaltyMember),
        rewards,
        rule_preview: formatDrinkPosLoyaltyEarnRule(settings.baht_per_point, settings.points_per_unit),
      });
    }
  }

  const rewards = await listDrinkPosLoyaltyRewards(ctx.ownerId, ctx.trialSessionId, {
    activeOnly: true,
  });

  return NextResponse.json({
    enabled: true,
    member,
    rewards,
    settings,
    rule_preview: formatDrinkPosLoyaltyEarnRule(settings.baht_per_point, settings.points_per_unit),
  });
}

const redeemSchema = z.object({
  phone: z.string().min(4).max(20),
  reward_id: z.number().int().positive(),
  sale_id: z.string().min(1).max(191).optional().nullable(),
  customer_name: z.string().max(160).optional().nullable(),
  create_sale: z.boolean().optional(),
});

const upsertSchema = z.object({
  phone: z.string().min(9).max(20),
  customer_name: z.string().max(160).optional().nullable(),
});

export async function POST(req: Request) {
  const auth = await requireDrinkPosStaff(req);
  if ("error" in auth) return auth.error;
  const ctx = auth.ctx;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const action = new URL(req.url).searchParams.get("action")?.trim() || "upsert";

  if (action === "redeem") {
    const parsed = redeemSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const result = await redeemDrinkPosLoyaltyReward({
      ownerUserId: ctx.ownerId,
      trialSessionId: ctx.trialSessionId,
      phoneRaw: parsed.data.phone,
      rewardId: parsed.data.reward_id,
      saleId: parsed.data.sale_id ?? null,
      customerName: parsed.data.customer_name ?? "",
      createSale: parsed.data.create_sale ?? !parsed.data.sale_id,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    if (result.saleId) notifyDrinkPosOrderBoard(ctx.ownerId);
    return NextResponse.json({
      ok: true,
      member: result.member,
      reward: result.reward,
      points_spent: result.pointsSpent,
      sale_id: result.saleId,
    });
  }

  const parsed = upsertSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const memberRes = await findOrCreateDrinkPosLoyaltyMember(
    ctx.ownerId,
    ctx.trialSessionId,
    parsed.data.phone,
    parsed.data.customer_name ?? "",
  );
  if (!memberRes.ok) return NextResponse.json({ error: memberRes.error }, { status: 400 });
  return NextResponse.json({ member: mapDrinkPosLoyaltyMember(memberRes.member) });
}
