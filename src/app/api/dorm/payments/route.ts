/**
 * ชำระเงินรายคน (payments) — อ้างอิงบิลของห้อง (bill_id) + ผู้พัก; ตรวจสิทธิ์ผ่าน tenant → room → owner
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

const postSchema = z.object({
  billId: z.number().int().positive(),
  tenantId: z.number().int().positive(),
  note: z.string().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const { billId, tenantId, note } = parsed.data;

  const row = await prisma.splitBillPayment.findFirst({
    where: {
      billId,
      tenantId,
      paymentStatus: "PENDING",
      tenant: { room: { ownerUserId: auth.session.sub } },
    },
  });

  if (!row) {
    return NextResponse.json(
      { error: "ไม่พบรายการค้างชำระสำหรับผู้เข้าพัก/งวดนี้ — บันทึกบิลมิเตอร์ก่อน" },
      { status: 400 },
    );
  }

  const receiptNumber = `RCP-${Date.now()}`;
  const payment = await prisma.splitBillPayment.update({
    where: { id: row.id },
    data: {
      paymentStatus: "PAID",
      paidAt: new Date(),
      receiptNumber,
      ...(note !== undefined && { note: note?.trim() || null }),
    },
  });

  return NextResponse.json({
    payment: {
      id: payment.id,
      tenantId: payment.tenantId,
      billId: payment.billId,
      amountToPay: Number(payment.amountToPay),
      paymentStatus: payment.paymentStatus,
      paidAt: payment.paidAt?.toISOString() ?? null,
      receiptNumber: payment.receiptNumber,
    },
  });
}
