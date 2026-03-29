import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { computeUtilityTotalRoomAmount } from "@/systems/dormitory/lib/utility-math";

function newPublicProofToken(): string {
  return randomBytes(24).toString("hex");
}

export { computeUtilityTotalRoomAmount };

/**
 * บิลค่าน้ำไฟผูกกับห้อง (utility_bills.room_id) — มิเตอร์เป็นของทั้งห้อง
 * หลังบันทึกมิเตอร์: ดึงผู้พัก ACTIVE ในห้องนั้น แล้วหาร (ค่าเช่า + ยอดน้ำไฟห้อง) / จำนวนคน
 * สร้าง/อัปเดตแถว payments (SplitBillPayment) รายคน — ไม่แตะแถวที่ชำระแล้ว (PAID)
 */
export async function refreshPendingSplitPaymentsForBill(billId: number): Promise<void> {
  const bill = await prisma.utilityBill.findUnique({
    where: { id: billId },
    include: {
      room: {
        include: {
          tenants: { where: { status: "ACTIVE" }, orderBy: { id: "asc" } },
        },
      },
    },
  });
  if (!bill) return;

  const n = bill.room.tenants.length;
  const base = Number(bill.room.basePrice);
  const util = Number(bill.totalRoomAmount);
  const per = n > 0 ? Math.round(((base + util) / n) * 100) / 100 : 0;

  await prisma.$transaction(async (tx) => {
    if (n === 0) {
      await tx.splitBillPayment.deleteMany({ where: { billId, paymentStatus: "PENDING" } });
      return;
    }

    const activeIds = bill.room.tenants.map((t) => t.id);
    await tx.splitBillPayment.deleteMany({
      where: {
        billId,
        paymentStatus: "PENDING",
        tenantId: { notIn: activeIds },
      },
    });

    if (per <= 0) return;

    for (const t of bill.room.tenants) {
      const existing = await tx.splitBillPayment.findUnique({
        where: { tenantId_billId: { tenantId: t.id, billId } },
      });
      if (!existing) {
        await tx.splitBillPayment.create({
          data: {
            tenantId: t.id,
            billId,
            amountToPay: per,
            paymentStatus: "PENDING",
            publicProofToken: newPublicProofToken(),
          },
        });
      } else if (existing.paymentStatus === "PENDING") {
        await tx.splitBillPayment.update({
          where: { id: existing.id },
          data: {
            amountToPay: per,
            ...(existing.publicProofToken == null ? { publicProofToken: newPublicProofToken() } : {}),
          },
        });
      }
    }
  });
}
