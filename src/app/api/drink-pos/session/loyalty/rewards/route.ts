import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";
import {
  clampPointsCost,
  enrichDrinkPosLoyaltyRewardImage,
  listDrinkPosLoyaltyRewards,
} from "@/systems/drink-pos/lib/loyalty";

const postSchema = z.object({
  title: z.string().min(1).max(160),
  product_id: z.string().min(1).max(191).nullable().optional(),
  image_url: z.string().trim().max(500).nullable().optional(),
  points_cost: z.number().int().min(1).max(1_000_000),
  sort_order: z.number().int().min(0).max(9999).optional(),
  is_active: z.boolean().optional(),
});

const patchSchema = z
  .object({
    title: z.string().min(1).max(160).optional(),
    product_id: z.string().min(1).max(191).nullable().optional(),
    image_url: z.string().trim().max(500).nullable().optional(),
    points_cost: z.number().int().min(1).max(1_000_000).optional(),
    sort_order: z.number().int().min(0).max(9999).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "empty" });

export async function GET() {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const scope = await getDrinkPosDataScope(auth.ctx.ownerUserId);
  const rewards = await listDrinkPosLoyaltyRewards(auth.ctx.ownerUserId, scope.trialSessionId);
  return NextResponse.json({ rewards });
}

export async function POST(req: Request) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const scope = await getDrinkPosDataScope(auth.ctx.ownerUserId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  let productId: string | null = parsed.data.product_id ?? null;
  if (productId) {
    const product = await prisma.drinkPosProduct.findFirst({
      where: { id: productId, ownerUserId: auth.ctx.ownerUserId },
      select: { id: true },
    });
    if (!product) return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 400 });
  }

  const customImage =
    parsed.data.image_url !== undefined ? (parsed.data.image_url?.trim() || null) : null;
  /** ผูกสินค้าแล้วไม่เก็บรูปกำหนดเอง — ใช้รูปสินค้า */
  const imageUrl = productId ? null : customImage;

  const row = await prisma.drinkPosLoyaltyReward.create({
    data: {
      ownerUserId: auth.ctx.ownerUserId,
      trialSessionId: scope.trialSessionId,
      title: parsed.data.title.trim(),
      productId,
      imageUrl,
      pointsCost: clampPointsCost(parsed.data.points_cost),
      sortOrder: parsed.data.sort_order ?? 100,
      isActive: parsed.data.is_active ?? true,
    },
  });
  return NextResponse.json({
    reward: await enrichDrinkPosLoyaltyRewardImage(auth.ctx.ownerUserId, row),
  });
}

export async function PATCH(req: Request) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const scope = await getDrinkPosDataScope(auth.ctx.ownerUserId);
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

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
    productId?: string | null;
    imageUrl?: string | null;
    pointsCost?: number;
    sortOrder?: number;
    isActive?: boolean;
  } = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title.trim();
  if (parsed.data.product_id !== undefined) {
    if (parsed.data.product_id == null) {
      data.productId = null;
    } else {
      const product = await prisma.drinkPosProduct.findFirst({
        where: { id: parsed.data.product_id, ownerUserId: auth.ctx.ownerUserId },
        select: { id: true },
      });
      if (!product) return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 400 });
      data.productId = product.id;
      data.imageUrl = null;
    }
  }
  if (parsed.data.image_url !== undefined) {
    const nextProductId =
      data.productId !== undefined ? data.productId : (
        await prisma.drinkPosLoyaltyReward.findFirst({
          where: { id, ownerUserId: auth.ctx.ownerUserId, trialSessionId: scope.trialSessionId },
          select: { productId: true },
        })
      )?.productId ?? null;
    if (nextProductId) {
      data.imageUrl = null;
    } else {
      data.imageUrl = parsed.data.image_url?.trim() || null;
    }
  }
  if (parsed.data.points_cost !== undefined) data.pointsCost = clampPointsCost(parsed.data.points_cost);
  if (parsed.data.sort_order !== undefined) data.sortOrder = parsed.data.sort_order;
  if (parsed.data.is_active !== undefined) data.isActive = parsed.data.is_active;

  const n = await prisma.drinkPosLoyaltyReward.updateMany({
    where: {
      id,
      ownerUserId: auth.ctx.ownerUserId,
      trialSessionId: scope.trialSessionId,
    },
    data,
  });
  if (n.count === 0) return NextResponse.json({ error: "ไม่พบรายการแลก" }, { status: 404 });
  const row = await prisma.drinkPosLoyaltyReward.findFirst({
    where: {
      id,
      ownerUserId: auth.ctx.ownerUserId,
      trialSessionId: scope.trialSessionId,
    },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบรายการแลก" }, { status: 404 });
  return NextResponse.json({
    reward: await enrichDrinkPosLoyaltyRewardImage(auth.ctx.ownerUserId, row),
  });
}

export async function DELETE(req: Request) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const scope = await getDrinkPosDataScope(auth.ctx.ownerUserId);
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const n = await prisma.drinkPosLoyaltyReward.deleteMany({
    where: {
      id,
      ownerUserId: auth.ctx.ownerUserId,
      trialSessionId: scope.trialSessionId,
    },
  });
  if (n.count === 0) return NextResponse.json({ error: "ไม่พบรายการแลก" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
