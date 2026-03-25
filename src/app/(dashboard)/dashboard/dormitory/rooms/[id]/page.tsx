import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-container";
import { RoomDetailClient, type DormRoomDetailJson } from "@/systems/dormitory/components/RoomDetailClient";

type Props = { params: Promise<{ id: string }> };

function parseRoomId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export default async function DormitoryRoomDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const roomId = parseRoomId(id);
  if (roomId === null) notFound();

  const room = await prisma.room.findFirst({
    where: { id: roomId, ownerUserId: session.sub },
    include: {
      tenants: { orderBy: { id: "asc" } },
      utilityBills: {
        orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }],
        include: { payments: true },
      },
    },
  });
  if (!room) notFound();

  const paidPayments = await prisma.splitBillPayment.findMany({
    where: {
      tenant: { roomId: room.id },
      paymentStatus: "PAID",
      paidAt: { not: null },
    },
    orderBy: { paidAt: "desc" },
    take: 40,
    include: { tenant: true, bill: true },
  });

  const json: DormRoomDetailJson = {
    id: String(room.id),
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    floor: room.floor,
    basePrice: Number(room.basePrice),
    maxOccupants: room.maxOccupants,
    tenants: room.tenants.map((t) => ({
      id: String(t.id),
      name: t.name,
      phone: t.phone,
      idCard: t.idCard,
      status: t.status,
      checkInDate: t.checkInDate.toISOString().slice(0, 10),
    })),
    utilityBills: room.utilityBills.map((b) => ({
      id: b.id,
      periodMonth: `${b.billingYear}-${String(b.billingMonth).padStart(2, "0")}`,
      waterMeterPrev: b.waterMeterPrev,
      waterMeterCurr: b.waterMeterCurr,
      waterPrice: Number(b.waterPrice),
      electricMeterPrev: b.electricMeterPrev,
      electricMeterCurr: b.electricMeterCurr,
      electricPrice: Number(b.electricPrice),
      fixedFees: b.fixedFees,
      totalRoomAmount: Number(b.totalRoomAmount),
      payments: b.payments.map((p) => ({
        id: p.id,
        tenantId: p.tenantId,
        amountToPay: Number(p.amountToPay),
        paymentStatus: p.paymentStatus,
        proofSlipUrl: p.proofSlipUrl,
        proofUploadedAt: p.proofUploadedAt?.toISOString() ?? null,
      })),
    })),
    paidPayments: paidPayments.map((p) => ({
      id: String(p.id),
      tenantId: String(p.tenantId),
      periodMonth: `${p.bill.billingYear}-${String(p.bill.billingMonth).padStart(2, "0")}`,
      amountToPay: Number(p.amountToPay),
      paidAt: p.paidAt!.toISOString(),
      note: p.note,
      receiptNumber: p.receiptNumber,
    })),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`ห้อง ${room.roomNumber}`}
        description={`${room.roomType} · ชั้น ${room.floor} · ค่าเช่า ${Number(room.basePrice).toLocaleString("th-TH")} บาท/เดือน`}
        action={
          <Link
            href="/dashboard/dormitory/rooms"
            className="text-sm font-medium text-[#0000BF] hover:underline"
          >
            ← รายการห้อง
          </Link>
        }
      />
      <RoomDetailClient key={`${room.id}-${room.updatedAt.toISOString()}`} room={json} />
    </div>
  );
}
