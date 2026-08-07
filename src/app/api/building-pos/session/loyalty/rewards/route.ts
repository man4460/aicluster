import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { prisma } from "@/lib/prisma";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import {
  clampPointsCost,
  enrichBuildingPosLoyaltyRewardImage,
  listBuildingPosLoyaltyRewards,
} from "@/systems/building-pos/lib/loyalty";

const postSchema = z.object({
  title: z.string().min(1).max(160),
  menu_item_id: z.number().int().positive().nullable().optional(),
  points_cost: z.number().int().min(1).max(1_000_000),
  sort_order: z.number().int().min(0).max(9999).optional(),
  is_active: z.boolean().optional(),
});

const patchSchema = z
  .object({
    title: z.string().min(1).max(160).optional(),
    menu_item_id: z.number().int().positive().nullable().optional(),
    points_cost: z.number().int().min(1).max(1_000_000).optional(),
    sort_order: z.number().int().min(0).max(9999).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "empty" });

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const rewards = await listBuildingPosLoyaltyRewards(own.ownerId, scope.trialSessionId);
    return NextResponse.json({ rewards });
  } catch (e) {
    console.error("[building-pos/session/loyalty/rewards GET]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    let menuItemId: number | null = parsed.data.menu_item_id ?? null;
    if (menuItemId != null) {
      const menu = await prisma.buildingPosMenuItem.findFirst({
        where: { id: menuItemId, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
        select: { id: true, name: true },
      });
      if (!menu) return NextResponse.json({ error: "ไม่พบเมนู" }, { status: 400 });
    }

    const row = await prisma.buildingPosLoyaltyReward.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        title: parsed.data.title.trim(),
        menuItemId,
        pointsCost: clampPointsCost(parsed.data.points_cost),
        sortOrder: parsed.data.sort_order ?? 100,
        isActive: parsed.data.is_active ?? true,
      },
    });
    return NextResponse.json({
      reward: await enrichBuildingPosLoyaltyRewardImage(own.ownerId, row),
    });
  } catch (e) {
    console.error("[building-pos/session/loyalty/rewards POST]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const data: {
      title?: string;
      menuItemId?: number | null;
      pointsCost?: number;
      sortOrder?: number;
      isActive?: boolean;
    } = {};
    if (parsed.data.title !== undefined) data.title = parsed.data.title.trim();
    if (parsed.data.menu_item_id !== undefined) {
      if (parsed.data.menu_item_id == null) {
        data.menuItemId = null;
      } else {
        const menu = await prisma.buildingPosMenuItem.findFirst({
          where: {
            id: parsed.data.menu_item_id,
            ownerUserId: own.ownerId,
            trialSessionId: scope.trialSessionId,
          },
          select: { id: true },
        });
        if (!menu) return NextResponse.json({ error: "ไม่พบเมนู" }, { status: 400 });
        data.menuItemId = menu.id;
      }
    }
    if (parsed.data.points_cost !== undefined) data.pointsCost = clampPointsCost(parsed.data.points_cost);
    if (parsed.data.sort_order !== undefined) data.sortOrder = parsed.data.sort_order;
    if (parsed.data.is_active !== undefined) data.isActive = parsed.data.is_active;

    const n = await prisma.buildingPosLoyaltyReward.updateMany({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      data,
    });
    if (n.count === 0) return NextResponse.json({ error: "ไม่พบรายการแลก" }, { status: 404 });
    const row = await prisma.buildingPosLoyaltyReward.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!row) return NextResponse.json({ error: "ไม่พบรายการแลก" }, { status: 404 });
    return NextResponse.json({
      reward: await enrichBuildingPosLoyaltyRewardImage(own.ownerId, row),
    });
  } catch (e) {
    console.error("[building-pos/session/loyalty/rewards PATCH]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const n = await prisma.buildingPosLoyaltyReward.deleteMany({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (n.count === 0) return NextResponse.json({ error: "ไม่พบรายการแลก" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[building-pos/session/loyalty/rewards DELETE]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
