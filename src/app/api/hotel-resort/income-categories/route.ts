import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";
import { ensureHotelResortIncomeCategories } from "@/systems/hotel-resort/lib/ensure-income-categories";

function mapCategory(r: {
  id: string;
  name: string;
  kind: string;
  isBuiltin: boolean;
  sortOrder: number;
  createdAt: Date;
}) {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind as "ROOM_STAY" | "CUSTOM",
    isBuiltin: r.isBuiltin,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function GET() {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  await ensureHotelResortIncomeCategories(auth.ctx.ownerUserId);
  const rows = await prisma.hotelResortIncomeCategory.findMany({
    where: { ownerUserId: auth.ctx.ownerUserId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ categories: rows.map(mapCategory) });
}

export async function POST(req: Request) {
  const auth = await withHotelResortOwnerContext();
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
  const maxSort = await prisma.hotelResortIncomeCategory.aggregate({
    where: { ownerUserId: auth.ctx.ownerUserId },
    _max: { sortOrder: true },
  });
  const sortOrder =
    typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
      ? Math.round(body.sortOrder)
      : (maxSort._max.sortOrder ?? 0) + 1;

  const row = await prisma.hotelResortIncomeCategory.create({
    data: {
      ownerUserId: auth.ctx.ownerUserId,
      name,
      kind: "CUSTOM",
      isBuiltin: false,
      sortOrder,
    },
  });
  return NextResponse.json({ category: mapCategory(row) });
}
