import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAssetOwnerContext } from "@/systems/asset/lib/asset-api";
import { calcStraightLineValue } from "@/systems/asset/lib/asset-types";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await withAssetOwnerContext();
  if (!auth.ok) return auth.res;
  const { ctx } = auth;

  const where = {
    ownerUserId: ctx.ownerUserId,
    trialSessionId: ctx.trialSessionId,
    isDeleted: false,
  } as const;

  const [assets, categories, departments] = await Promise.all([
    prisma.asset.findMany({
      where,
      select: {
        id: true,
        assetCode: true,
        assetName: true,
        categoryId: true,
        departmentId: true,
        purchaseDate: true,
        purchasePrice: true,
        depreciationYears: true,
        status: true,
        condition: true,
      },
    }),
    prisma.assetCategory.findMany({
      where: { ownerUserId: ctx.ownerUserId, trialSessionId: ctx.trialSessionId },
      select: { id: true, name: true },
    }),
    prisma.assetDepartment.findMany({
      where: { ownerUserId: ctx.ownerUserId, trialSessionId: ctx.trialSessionId },
      select: { id: true, name: true },
    }),
  ]);

  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const depMap = new Map(departments.map((d) => [d.id, d.name]));

  type Bucket = { id: number | null; name: string; count: number; purchase: number; current: number };

  const byCategory = new Map<number | null, Bucket>();
  const byDepartment = new Map<number | null, Bucket>();

  let totalPurchase = 0;
  let totalCurrent = 0;

  for (const a of assets) {
    const purchase = a.purchasePrice ? Number(a.purchasePrice) : 0;
    const current = calcStraightLineValue({
      purchasePrice: purchase,
      purchaseDate: a.purchaseDate,
      depreciationYears: a.depreciationYears ?? 5,
    });
    totalPurchase += purchase;
    totalCurrent += current;

    const cKey = a.categoryId ?? null;
    const cName = cKey ? (catMap.get(cKey) ?? "—") : "ไม่ระบุ";
    const cBucket = byCategory.get(cKey) ?? { id: cKey, name: cName, count: 0, purchase: 0, current: 0 };
    cBucket.count += 1;
    cBucket.purchase += purchase;
    cBucket.current += current;
    byCategory.set(cKey, cBucket);

    const dKey = a.departmentId ?? null;
    const dName = dKey ? (depMap.get(dKey) ?? "—") : "ไม่ระบุ";
    const dBucket = byDepartment.get(dKey) ?? { id: dKey, name: dName, count: 0, purchase: 0, current: 0 };
    dBucket.count += 1;
    dBucket.purchase += purchase;
    dBucket.current += current;
    byDepartment.set(dKey, dBucket);
  }

  return NextResponse.json({
    totalAssets: assets.length,
    totalPurchase,
    totalCurrent,
    depreciation: totalPurchase - totalCurrent,
    byCategory: Array.from(byCategory.values()).sort((a, b) => b.purchase - a.purchase),
    byDepartment: Array.from(byDepartment.values()).sort((a, b) => b.purchase - a.purchase),
  });
}
