import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requireModulePage } from "@/lib/modules/guard";
import { ECOMMERCE_STORE_MODULE_SLUG } from "@/lib/modules/config";
import { getEcommerceOwnerFromAuth, getOrCreateEcommerceStore } from "@/lib/ecommerce/api-owner";
import {
  ecommerceDecimalToBahtNumber,
  resolveEcommerceSalesRange,
} from "@/lib/ecommerce/sales-period";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireModulePage(ECOMMERCE_STORE_MODULE_SLUG);
  const owner = await getEcommerceOwnerFromAuth(session.sub);
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const range = resolveEcommerceSalesRange({
    period: url.searchParams.get("period"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });
  if ("error" in range) {
    return NextResponse.json({ error: range.error }, { status: 400 });
  }

  const store = await getOrCreateEcommerceStore(owner.ownerUserId);
  const agg = await prisma.ecommerceOrder.aggregate({
    where: {
      storeId: store.id,
      createdAt: { gte: range.start, lt: range.end },
    },
    _sum: { totalAmount: true },
    _count: { id: true },
  });

  return NextResponse.json({
    period: range.period,
    label: range.label,
    from: range.fromKey,
    to: range.toKey,
    timezone: "Asia/Bangkok",
    orderCount: agg._count.id,
    totalBaht: ecommerceDecimalToBahtNumber(agg._sum.totalAmount),
  });
}
