import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { bangkokYearMonthYm } from "@/lib/dates/bangkok-calendar";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";
import { DormPageStack, DormPanelCard } from "@/systems/dormitory/components/DormPageChrome";
import {
  RoomDetailClient,
  type DormOverdueRow,
  type DormRoomDetailJson,
} from "@/systems/dormitory/components/RoomDetailClient";
import { dormBtnSecondary } from "@/systems/dormitory/dorm-ui";
import { cn } from "@/lib/cn";
import {
  buildRoomComputeInput,
  computeAllBalanceLines,
  overdueLines,
} from "@/systems/dormitory/lib/compute";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ month?: string }> };

function parseRoomId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function billPeriodKey(b: { billingYear: number; billingMonth: number }): string {
  return `${b.billingYear}-${String(b.billingMonth).padStart(2, "0")}`;
}

export default async function DormitoryRoomDetailPage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const sp = await searchParams;
  const focusMonth =
    typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : null;
  const roomId = parseRoomId(id);
  if (roomId === null) notFound();

  const scope = await getDormitoryDataScope(session.sub);
  const room = await prisma.room.findFirst({
    where: { id: roomId, ownerUserId: session.sub, trialSessionId: scope.trialSessionId },
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

  const computeInput = buildRoomComputeInput(room);
  const overdueBalanceLines = overdueLines(computeAllBalanceLines(computeInput)).filter(
    (l) => l.roomId === String(room.id),
  );
  const overdueRows: DormOverdueRow[] = overdueBalanceLines.map((l) => {
    const bill = room.utilityBills.find((b) => billPeriodKey(b) === l.month);
    const payment = bill?.payments.find((p) => String(p.tenantId) === l.tenantId);
    return {
      tenantId: l.tenantId,
      tenantName: l.tenantName,
      month: l.month,
      balance: l.balance,
      billId: bill?.id ?? null,
      paymentId: payment?.id ?? null,
      paymentStatus: payment?.paymentStatus ?? null,
      proofSlipUrl: payment?.proofSlipUrl ?? null,
    };
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
    <DormPageStack>
      <DormPanelCard
        title={`ห้อง ${room.roomNumber}`}
        description={`${room.roomType} · ชั้น ${room.floor} · ค่าเช่า ${Number(room.basePrice).toLocaleString("th-TH")} บาท/เดือน`}
        action={
          <Link href="/dashboard/dormitory/rooms" className={cn(dormBtnSecondary, "w-full justify-center sm:w-auto")}>
            รายการห้อง
          </Link>
        }
      >
        <p className="text-[11px] leading-relaxed text-slate-500">
          เลือกงวดด้านล่างเพื่อบันทึกมิเตอร์ แบ่งบิล แนบสลิป และชำระเงิน
        </p>
      </DormPanelCard>
      <RoomDetailClient
        key={`${room.id}-${room.updatedAt.toISOString()}`}
        room={json}
        overdueRows={overdueRows}
        initialPayMonth={focusMonth}
        initialBangkokYm={bangkokYearMonthYm()}
      />
    </DormPageStack>
  );
}
