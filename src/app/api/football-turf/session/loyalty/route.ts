import { NextResponse } from "next/server";
import { getFootballTurfOwnerContext } from "@/systems/football-turf/lib/api-auth";
import {
  clampBahtPerPoint,
  clampPointsCost,
  clampPointsPerUnit,
  ensureFootballTurfLoyaltySettings,
  listFootballTurfLoyaltyRewards,
  mapLoyaltyReward,
  redeemFootballTurfLoyaltyReward,
} from "@/systems/football-turf/lib/loyalty";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ctx = await getFootballTurfOwnerContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await ensureFootballTurfLoyaltySettings(ctx.userId, ctx.scope.trialSessionId);
  const rewards = await listFootballTurfLoyaltyRewards(ctx.userId, ctx.scope.trialSessionId);
  return NextResponse.json({ settings, rewards });
}

export async function PATCH(req: Request) {
  const ctx = await getFootballTurfOwnerContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    enabled?: boolean;
    baht_per_point?: number;
    points_per_unit?: number;
  };

  await ensureFootballTurfLoyaltySettings(ctx.userId, ctx.scope.trialSessionId);
  const row = await prisma.footballTurfLoyaltySettings.update({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: ctx.userId,
        trialSessionId: ctx.scope.trialSessionId,
      },
    },
    data: {
      ...(typeof body.enabled === "boolean" ? { enabled: body.enabled } : {}),
      ...(body.baht_per_point != null ? { bahtPerPoint: clampBahtPerPoint(Number(body.baht_per_point)) } : {}),
      ...(body.points_per_unit != null ? { pointsPerUnit: clampPointsPerUnit(Number(body.points_per_unit)) } : {}),
    },
  });

  return NextResponse.json({
    settings: {
      enabled: row.enabled,
      baht_per_point: row.bahtPerPoint,
      points_per_unit: row.pointsPerUnit,
    },
  });
}

export async function POST(req: Request) {
  const ctx = await getFootballTurfOwnerContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    phone?: string;
    reward_id?: number;
    customer_name?: string;
    title?: string;
    points_cost?: number;
    sort_order?: number;
    is_active?: boolean;
    image_url?: string;
    id?: number;
  };

  if (body.action === "redeem") {
    const result = await redeemFootballTurfLoyaltyReward({
      ownerUserId: ctx.userId,
      trialSessionId: ctx.scope.trialSessionId,
      phoneRaw: body.phone ?? "",
      rewardId: Number(body.reward_id),
      customerName: body.customer_name,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  }

  if (body.action === "create_reward") {
    const title = (body.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "ระบุชื่อของรางวัล" }, { status: 400 });
    const row = await prisma.footballTurfLoyaltyReward.create({
      data: {
        ownerUserId: ctx.userId,
        trialSessionId: ctx.scope.trialSessionId,
        title: title.slice(0, 160),
        pointsCost: clampPointsCost(Number(body.points_cost ?? 10)),
        sortOrder: Math.max(0, Math.floor(Number(body.sort_order ?? 100))),
        isActive: body.is_active !== false,
        imageUrl: body.image_url?.trim() || null,
      },
    });
    return NextResponse.json({ reward: mapLoyaltyReward(row) });
  }

  if (body.action === "update_reward") {
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const existing = await prisma.footballTurfLoyaltyReward.findFirst({
      where: { id, ownerUserId: ctx.userId, trialSessionId: ctx.scope.trialSessionId },
    });
    if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
    const row = await prisma.footballTurfLoyaltyReward.update({
      where: { id },
      data: {
        ...(body.title != null ? { title: String(body.title).trim().slice(0, 160) } : {}),
        ...(body.points_cost != null ? { pointsCost: clampPointsCost(Number(body.points_cost)) } : {}),
        ...(body.sort_order != null ? { sortOrder: Math.max(0, Math.floor(Number(body.sort_order))) } : {}),
        ...(typeof body.is_active === "boolean" ? { isActive: body.is_active } : {}),
        ...(body.image_url !== undefined ? { imageUrl: body.image_url?.trim() || null } : {}),
      },
    });
    return NextResponse.json({ reward: mapLoyaltyReward(row) });
  }

  if (body.action === "delete_reward") {
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const existing = await prisma.footballTurfLoyaltyReward.findFirst({
      where: { id, ownerUserId: ctx.userId, trialSessionId: ctx.scope.trialSessionId },
    });
    if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
    await prisma.footballTurfLoyaltyReward.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
