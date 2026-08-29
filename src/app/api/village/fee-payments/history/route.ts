import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";
import { isPrismaSchemaMismatchError, PRISMA_SYNC_HINT_TH } from "@/lib/prisma-errors";

/** ประวัติค่าส่วนกลางที่ชำระแล้ว — ใช้ในแท็บ «ประวัติ / รายรับ» ของหน้าการเงิน */
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  try {
    const scope = await getVillageDataScope(own.ownerId);
    const rows = await prisma.villageCommonFeeRow.findMany({
      where: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        paidAt: { not: null },
        OR: [{ status: "PAID" }, { amountPaid: { gt: 0 } }],
      },
      include: { house: { select: { houseNo: true, ownerName: true } } },
      orderBy: [{ paidAt: "desc" }, { id: "desc" }],
      take: 500,
    });

    return NextResponse.json({
      items: rows.map((r) => ({
        id: r.id,
        house_id: r.houseId,
        house_no: r.house.houseNo,
        owner_name: r.house.ownerName,
        year_month: r.yearMonth,
        amount_due: r.amountDue,
        amount_paid: r.amountPaid,
        status: r.status,
        note: r.note,
        paid_at: r.paidAt?.toISOString() ?? null,
      })),
    });
  } catch (e) {
    if (isPrismaSchemaMismatchError(e)) {
      return NextResponse.json({ error: PRISMA_SYNC_HINT_TH }, { status: 503 });
    }
    console.error("village/fee-payments/history GET", e);
    return NextResponse.json({ error: "โหลดประวัติชำระไม่สำเร็จ" }, { status: 500 });
  }
}
