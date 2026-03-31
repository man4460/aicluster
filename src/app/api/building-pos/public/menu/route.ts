import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolvePublicBuildingPosTrialSessionId } from "@/lib/building-pos/public-trial-scope";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ownerId = searchParams.get("ownerId")?.trim() ?? "";
  if (ownerId.length < 10) return NextResponse.json({ error: "ไม่พบ" }, { status: 400 });
  const trialParam = searchParams.get("t")?.trim() ?? searchParams.get("trialSessionId")?.trim() ?? "";
  const { trialSessionId } = await resolvePublicBuildingPosTrialSessionId(ownerId, trialParam || null);

  const [cats, menus, ordersForStats] = await Promise.all([
    prisma.buildingPosCategory.findMany({
      where: { ownerUserId: ownerId, trialSessionId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    }),
    prisma.buildingPosMenuItem.findMany({
      where: { ownerUserId: ownerId, trialSessionId, isActive: true },
      orderBy: { id: "asc" },
    }),
    prisma.buildingPosOrder.findMany({
      where: { ownerUserId: ownerId, trialSessionId },
      select: { itemsJson: true },
    }),
  ]);

  const soldByMenuId = new Map<number, number>();
  for (const o of ordersForStats) {
    const raw = o.itemsJson;
    if (!Array.isArray(raw)) continue;
    for (const row of raw) {
      if (!row || typeof row !== "object") continue;
      const it = row as { menu_item_id?: unknown; qty?: unknown };
      const mid = typeof it.menu_item_id === "number" ? it.menu_item_id : Number(it.menu_item_id);
      const q = typeof it.qty === "number" ? it.qty : Number(it.qty);
      if (!Number.isFinite(mid) || mid <= 0 || !Number.isFinite(q) || q <= 0) continue;
      soldByMenuId.set(mid, (soldByMenuId.get(mid) ?? 0) + q);
    }
  }

  return NextResponse.json({
    trialSessionId,
    categories: cats.map((c) => ({ id: c.id, name: c.name, image_url: c.imageUrl, sort_order: c.sortOrder, is_active: c.isActive })),
    menu_items: menus.map((m) => ({
      id: m.id,
      category_id: m.categoryId,
      name: m.name,
      image_url: m.imageUrl,
      price: m.price,
      description: m.description,
      is_active: m.isActive,
      is_featured: m.isFeatured,
      sold_qty: soldByMenuId.get(m.id) ?? 0,
    })),
  });
}
