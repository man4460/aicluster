import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";

export async function POST(req: Request) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;
  let body: { label?: string; amountBaht?: number; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const label = body.label?.trim();
  const amountBaht = Math.round(body.amountBaht ?? 0);
  if (!label || amountBaht <= 0) {
    return NextResponse.json({ error: "กรอกรายการและจำนวนเงิน" }, { status: 400 });
  }
  const row = await prisma.hotelResortCostEntry.create({
    data: {
      ownerUserId: auth.ctx.ownerUserId,
      label,
      amountBaht,
      note: body.note?.trim() || null,
    },
  });
  return NextResponse.json({ cost: row });
}
