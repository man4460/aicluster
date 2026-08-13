import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDrinkPosStaff } from "@/lib/drink-pos/staff-auth";
import { drinkPosPublicImageUrl } from "@/lib/drink-pos/drink-stock-images";
import { mapDrinkPosProductRow } from "@/systems/drink-pos/lib/product-map";
import {
  ensureDrinkPosLoyaltySettings,
  formatDrinkPosLoyaltyEarnRule,
  listDrinkPosLoyaltyRewards,
} from "@/systems/drink-pos/lib/loyalty";

export async function GET(req: Request) {
  const auth = await requireDrinkPosStaff(req);
  if ("error" in auth) return auth.error;
  const ctx = auth.ctx;

  const { ownerId, trialSessionId } = ctx;
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
    categories: cats.map((c) => ({
      id: c.id,
      name: c.name,
      imageUrl: drinkPosPublicImageUrl(c.imageUrl),
      sortOrder: c.sortOrder,
    })),
    products: products.map(mapDrinkPosProductRow),
    loyalty: {
      enabled: loyaltySettings.enabled,
      rule_preview: formatDrinkPosLoyaltyEarnRule(
        loyaltySettings.baht_per_point,
        loyaltySettings.points_per_unit,
      ),
      rewards: loyaltyRewards,
    },
  });
}
