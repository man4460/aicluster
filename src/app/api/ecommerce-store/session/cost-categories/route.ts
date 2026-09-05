import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withEcommerceStoreOwnerContext } from "@/systems/ecommerce-store/lib/api-auth";

export async function GET() {
  const auth = await withEcommerceStoreOwnerContext();
  if (!auth.ok) return auth.res;
  const rows = await prisma.ecommerceCostCategory.findMany({
    where: { ownerUserId: auth.ctx.ownerUserId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({
    categories: rows.map((r) => ({
      id: r.id,
      name: r.name,
      sortOrder: r.sortOrder,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const auth = await withEcommerceStoreOwnerContext();
  if (!auth.ok) return auth.res;
  let body: { name?: string; sortOrder?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const name = body.name?.trim() ?? "";
  if (!name || name.length > 120) {
    return NextResponse.json({ error: "กรอกชื่อหมวดหมู่" }, { status: 400 });
  }
  const maxSort = await prisma.ecommerceCostCategory.aggregate({
    where: { ownerUserId: auth.ctx.ownerUserId },
    _max: { sortOrder: true },
  });
  const sortOrder =
    typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
      ? Math.round(body.sortOrder)
      : (maxSort._max.sortOrder ?? 0) + 1;

  const row = await prisma.ecommerceCostCategory.create({
    data: { ownerUserId: auth.ctx.ownerUserId, name, sortOrder },
  });
  return NextResponse.json({
    category: {
      id: row.id,
      name: row.name,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt.toISOString(),
    },
  });
}
