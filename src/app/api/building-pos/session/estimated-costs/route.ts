import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";

/** ราคาต่อหน่วยล่าสุดต่อรายการของ (จากบันทึกรายจ่าย เรียงวันที่มากสุดก่อน) */
export async function GET() {
  try {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await buildingPosOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getBuildingPosDataScope(own.ownerId);

  const orders = await prisma.buildingPosPurchaseOrder.findMany({
    where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    orderBy: [{ purchasedOn: "desc" }, { id: "desc" }],
    include: { lines: true },
  });

  const lastUnitPriceByIngredient = new Map<number, number>();
  for (const o of orders) {
    for (const ln of o.lines) {
      if (!lastUnitPriceByIngredient.has(ln.ingredientId)) {
        lastUnitPriceByIngredient.set(ln.ingredientId, Number(ln.unitPriceBaht));
      }
    }
  }

  const menus = await prisma.buildingPosMenuItem.findMany({
    where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    select: { id: true, price: true },
  });
  const menuIds = menus.map((m) => m.id);
  const priceByMenu = new Map(menus.map((m) => [m.id, m.price]));

  const recipeLines =
    menuIds.length === 0
      ? []
      : await prisma.buildingPosMenuRecipeLine.findMany({
          where: { menuItemId: { in: menuIds } },
        });

  const costByMenu = new Map<number, number>();
  for (const m of menuIds) costByMenu.set(m, 0);

  for (const rl of recipeLines) {
    const unit = lastUnitPriceByIngredient.get(rl.ingredientId);
    if (unit === undefined) continue;
    const q = Number(rl.qtyPerPortion);
    const prev = costByMenu.get(rl.menuItemId) ?? 0;
    costByMenu.set(rl.menuItemId, prev + q * unit);
  }

  const estimated_cost_baht: Record<string, number> = {};
  const margin_baht: Record<string, number | null> = {};
  for (const m of menuIds) {
    const raw = costByMenu.get(m) ?? 0;
    const rounded = Math.round(raw * 100) / 100;
    estimated_cost_baht[String(m)] = rounded;
    const price = priceByMenu.get(m) ?? 0;
    margin_baht[String(m)] = rounded > 0 || recipeLines.some((x) => x.menuItemId === m) ? Math.round((price - rounded) * 100) / 100 : null;
  }

  const ingredient_last_unit_price_baht: Record<string, number> = {};
  lastUnitPriceByIngredient.forEach((v, k) => {
    ingredient_last_unit_price_baht[String(k)] = Math.round(v * 100) / 100;
  });

  return NextResponse.json({
    estimated_cost_baht,
    margin_baht,
    ingredient_last_unit_price_baht,
  });
  } catch (e) {
    console.error("[building-pos/session/estimated-costs GET]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
