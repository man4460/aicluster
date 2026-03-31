import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolvePublicBuildingPosTrialSessionId } from "@/lib/building-pos/public-trial-scope";

const orderItemSchema = z.object({
  menu_item_id: z.number().int().positive(),
  name: z.string().min(1).max(160),
  price: z.number().int().min(0),
  qty: z.number().int().min(1).max(100),
  note: z.string().max(300),
});

const postSchema = z.object({
  ownerId: z.string().min(10).max(64),
  trialSessionId: z.string().max(36).optional().nullable(),
  customer_name: z.string().max(160).optional().nullable(),
  table_no: z.string().max(40).optional().nullable(),
  items: z.array(orderItemSchema).min(1),
});

export async function POST(req: Request) {
  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 }); }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const { trialSessionId } = await resolvePublicBuildingPosTrialSessionId(parsed.data.ownerId, parsed.data.trialSessionId);
  const total = parsed.data.items.reduce((s, x) => s + x.price * x.qty, 0);
  const row = await prisma.buildingPosOrder.create({
    data: {
      ownerUserId: parsed.data.ownerId,
      trialSessionId,
      customerName: parsed.data.customer_name?.trim() ?? "",
      tableNo: parsed.data.table_no?.trim() ?? "",
      status: "NEW",
      itemsJson: parsed.data.items,
      totalAmount: total,
      note: "ลูกค้าสั่งผ่าน QR",
    },
  });
  return NextResponse.json({ ok: true, orderId: row.id });
}
