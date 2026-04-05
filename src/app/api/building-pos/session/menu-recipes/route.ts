import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";

const putSchema = z.object({
  lines: z.array(
    z.object({
      ingredient_id: z.number().int().positive(),
      qty_per_portion: z.coerce.number().positive(),
    }),
  ),
});

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const menuId = Number(new URL(req.url).searchParams.get("menu_item_id"));

    if (Number.isFinite(menuId) && menuId > 0) {
      const menu = await prisma.buildingPosMenuItem.findFirst({
        where: { id: menuId, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
        select: { id: true },
      });
      if (!menu) return NextResponse.json({ error: "ไม่พบเมนู" }, { status: 404 });
      const lines = await prisma.buildingPosMenuRecipeLine.findMany({
        where: { menuItemId: menuId },
        orderBy: { id: "asc" },
      });
      return NextResponse.json({
        menu_item_id: menuId,
        lines: lines.map((l) => ({
          ingredient_id: l.ingredientId,
          qty_per_portion: Number(l.qtyPerPortion),
        })),
      });
    }

    const menus = await prisma.buildingPosMenuItem.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      select: { id: true },
    });
    const menuIds = menus.map((m) => m.id);
    if (menuIds.length === 0) {
      return NextResponse.json({ recipes_by_menu: {} as Record<string, { ingredient_id: number; qty_per_portion: number }[]> });
    }
    const allLines = await prisma.buildingPosMenuRecipeLine.findMany({
      where: { menuItemId: { in: menuIds } },
      orderBy: [{ menuItemId: "asc" }, { id: "asc" }],
    });
    const recipesByMenu: Record<string, { ingredient_id: number; qty_per_portion: number }[]> = {};
    for (const m of menuIds) {
      recipesByMenu[String(m)] = [];
    }
    for (const l of allLines) {
      const key = String(l.menuItemId);
      if (!recipesByMenu[key]) recipesByMenu[key] = [];
      recipesByMenu[key].push({
        ingredient_id: l.ingredientId,
        qty_per_portion: Number(l.qtyPerPortion),
      });
    }
    return NextResponse.json({ recipes_by_menu: recipesByMenu });
  } catch (e) {
    console.error("[building-pos/session/menu-recipes GET]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const menuId = Number(new URL(req.url).searchParams.get("menu_item_id"));
    if (!Number.isFinite(menuId) || menuId <= 0) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = putSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const menu = await prisma.buildingPosMenuItem.findFirst({
      where: { id: menuId, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      select: { id: true },
    });
    if (!menu) return NextResponse.json({ error: "ไม่พบเมนู" }, { status: 404 });

    const seen = new Set<number>();
    for (const ln of parsed.data.lines) {
      if (seen.has(ln.ingredient_id)) {
        return NextResponse.json({ error: "ห้ามซ้ำรายการของในสูตร" }, { status: 400 });
      }
      seen.add(ln.ingredient_id);
    }

    const ingIds = [...seen];
    if (ingIds.length > 0) {
      const cnt = await prisma.buildingPosIngredient.count({
        where: {
          id: { in: ingIds },
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
        },
      });
      if (cnt !== ingIds.length) {
        return NextResponse.json({ error: "มีรายการของที่ไม่พบ" }, { status: 400 });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.buildingPosMenuRecipeLine.deleteMany({ where: { menuItemId: menuId } });
      for (const ln of parsed.data.lines) {
        await tx.buildingPosMenuRecipeLine.create({
          data: {
            menuItemId: menuId,
            ingredientId: ln.ingredient_id,
            qtyPerPortion: new Prisma.Decimal(String(ln.qty_per_portion)),
          },
        });
      }
    });

    const lines = await prisma.buildingPosMenuRecipeLine.findMany({
      where: { menuItemId: menuId },
      orderBy: { id: "asc" },
    });
    return NextResponse.json({
      menu_item_id: menuId,
      lines: lines.map((l) => ({
        ingredient_id: l.ingredientId,
        qty_per_portion: Number(l.qtyPerPortion),
      })),
    });
  } catch (e) {
    console.error("[building-pos/session/menu-recipes PUT]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
