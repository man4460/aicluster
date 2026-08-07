import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";
import { DRINK_POS_FULFILLMENT_STATUSES } from "@/systems/drink-pos/lib/fulfillment-status";
import { mapDrinkPosOrderBoardRow } from "@/systems/drink-pos/lib/order-board";
import { notifyDrinkPosOrderBoard } from "@/systems/drink-pos/lib/order-board-sse";

const bodySchema = z.object({
  status: z.enum(DRINK_POS_FULFILLMENT_STATUSES),
});

type Ctx = { params: Promise<{ id: string }> };

/** อัปเดตสถานะออเดอร์ (เจ้าของร้าน) */
export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;

  const { id } = await ctx.params;
  if (!id?.trim()) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 400 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
  }

  const existing = await prisma.drinkPosSale.findFirst({
    where: { id, ownerUserId: auth.ctx.ownerUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });

  const now = new Date();
  const sale = await prisma.drinkPosSale.update({
    where: { id },
    data: {
      fulfillmentStatus: parsed.data.status,
      statusUpdatedAt: now,
    },
    include: {
      lines: {
        orderBy: { id: "asc" },
        select: { id: true, productName: true, sizeLabel: true, quantity: true },
      },
    },
  });

  notifyDrinkPosOrderBoard(auth.ctx.ownerUserId);

  return NextResponse.json({ order: mapDrinkPosOrderBoardRow(sale) });
}

