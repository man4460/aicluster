import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDrinkPosPortalOpenForOwner } from "@/lib/drink-pos/portal-access";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { mapDrinkPosProductRow } from "@/systems/drink-pos/lib/product-map";
import {
  ensureDrinkPosLoyaltySettings,
  formatDrinkPosLoyaltyEarnRule,
  listDrinkPosLoyaltyRewards,
} from "@/systems/drink-pos/lib/loyalty";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ownerId = searchParams.get("ownerId")?.trim() ?? "";
  if (ownerId.length < 10) return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });

  const open = await isDrinkPosPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "ร้านปิดรับออเดอร์ชั่วคราว" }, { status: 403 });

  const scope = await getDrinkPosDataScope(ownerId);
  const trialParam = searchParams.get("t")?.trim() || searchParams.get("trialSessionId")?.trim() || "";
  const trialSessionId = trialParam || scope.trialSessionId;

  const [profile, cats, products, loyaltySettings, loyaltyRewards] = await Promise.all([
    prisma.drinkPosShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
      select: { displayName: true, logoUrl: true, tagline: true },
    }),
    prisma.drinkPosCategory.findMany({
      where: { ownerUserId: ownerId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, imageUrl: true, sortOrder: true, isActive: true },
    }),
    prisma.drinkPosProduct.findMany({
      where: { ownerUserId: ownerId, isActive: true },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      include: { category: { select: { id: true, name: true } } },
    }),
    ensureDrinkPosLoyaltySettings(ownerId, trialSessionId).catch(() => ({
      enabled: false,
      baht_per_point: 100,
      points_per_unit: 1,
    })),
    listDrinkPosLoyaltyRewards(ownerId, trialSessionId, { activeOnly: true }).catch(() => []),
  ]);

  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { username: true, email: true },
  });
  const shopName =
    profile?.displayName?.trim() ||
    owner?.username?.trim() ||
    owner?.email?.split("@")[0]?.trim() ||
    "ร้านเครื่องดื่ม";

  return NextResponse.json({
    trialSessionId,
    shop: {
      displayName: shopName,
      logoUrl: profile?.logoUrl ?? null,
      tagline: profile?.tagline ?? null,
    },
    loyalty: {
      enabled: loyaltySettings.enabled,
      rule_preview: formatDrinkPosLoyaltyEarnRule(
        loyaltySettings.baht_per_point,
        loyaltySettings.points_per_unit,
      ),
      rewards: loyaltyRewards,
    },
    categories: cats.map((c) => ({
      id: c.id,
      name: c.name,
      imageUrl: c.imageUrl,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    })),
    products: products.map(mapDrinkPosProductRow),
  });
}
