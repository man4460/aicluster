import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";

export async function POST(req: Request) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  let body: {
    label?: string;
    amountBaht?: number;
    note?: string | null;
    categoryId?: string;
    paymentSlipUrl?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const label = body.label?.trim();
  const amountBaht = Math.round(body.amountBaht ?? 0);
  const categoryId = body.categoryId?.trim() || null;
  if (!label || amountBaht <= 0) {
    return NextResponse.json({ error: "กรอกรายการและจำนวนเงิน" }, { status: 400 });
  }
  if (!categoryId) {
    return NextResponse.json({ error: "เลือกหมวดหมู่รายจ่าย" }, { status: 400 });
  }
  const cat = await prisma.hotelResortCostCategory.findFirst({
    where: { id: categoryId, ownerUserId: auth.ctx.ownerUserId },
  });
  if (!cat) {
    return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 400 });
  }
  const row = await prisma.hotelResortCostEntry.create({
    data: {
      ownerUserId: auth.ctx.ownerUserId,
      categoryId,
      label,
      amountBaht,
      note: body.note?.trim() || null,
      paymentSlipUrl: body.paymentSlipUrl?.trim() || null,
    },
    include: { category: { select: { id: true, name: true } } },
  });
  return NextResponse.json({
    cost: {
      id: row.id,
      label: row.label,
      amountBaht: row.amountBaht,
      spentAt: row.spentAt.toISOString(),
      note: row.note,
      paymentSlipUrl: row.paymentSlipUrl,
      categoryId: row.categoryId,
      categoryName: row.category?.name ?? null,
    },
  });
}
