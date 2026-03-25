/**
 * รายการประวัติการชำระ (split bill) ทั้งหมดของเจ้าของหอ
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.splitBillPayment.findMany({
    where: { tenant: { room: { ownerUserId: auth.session.sub } } },
    include: {
      tenant: { select: { id: true, name: true, phone: true } },
      bill: {
        select: {
          id: true,
          billingMonth: true,
          billingYear: true,
          room: { select: { id: true, roomNumber: true } },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 800,
  });

  return NextResponse.json({
    items: rows.map((p) => ({
      id: p.id,
      amountToPay: Number(p.amountToPay),
      paymentStatus: p.paymentStatus,
      paidAt: p.paidAt?.toISOString() ?? null,
      receiptNumber: p.receiptNumber,
      note: p.note,
      proofSlipUrl: p.proofSlipUrl,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      tenant: p.tenant,
      bill: {
        id: p.bill.id,
        billingMonth: p.bill.billingMonth,
        billingYear: p.bill.billingYear,
        room: p.bill.room,
      },
    })),
  });
}
