import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";
import { DormDashboardRoomGrid } from "@/systems/dormitory/components/DormDashboardRoomGrid";
import { DormOverdueDashboardPanel } from "@/systems/dormitory/components/DormOverdueDashboardPanel";
import { DormEmptyDashed, DormPageStack, DormPanelCard } from "@/systems/dormitory/components/DormPageChrome";
import { DormStatCard } from "@/systems/dormitory/components/DormStatCard";
import {
  buildRoomComputeInput,
  computeAllBalanceLines,
  overdueLines,
  roomBillingUiStatus,
} from "@/systems/dormitory/lib/compute";
import { dormBtnPrimary } from "@/systems/dormitory/dorm-ui";
import { cn } from "@/lib/cn";

export default async function DormitoryDashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const scope = await getDormitoryDataScope(session.sub);
  const rooms = await prisma.room.findMany({
    where: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId },
    orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
    include: {
      tenants: true,
      utilityBills: {
        include: { payments: true },
      },
    },
  });

  const allLines = rooms.flatMap((r) => computeAllBalanceLines(buildRoomComputeInput(r)));
  const overdue = overdueLines(allLines);
  const overdueRoomIds = new Set(overdue.map((o) => o.roomId));
  const vacantCount = rooms.filter((r) => r.tenants.every((t) => t.status !== "ACTIVE")).length;
  const occupiedCount = rooms.length - vacantCount;

  const roomsForGrid = rooms.map((r) => {
    const input = buildRoomComputeInput(r);
    const billing = roomBillingUiStatus(input);
    const activeN = r.tenants.filter((t) => t.status === "ACTIVE").length;
    const occ = activeN === 0 ? "ว่าง" : activeN >= r.maxOccupants ? "เต็ม" : `พัก ${activeN}/${r.maxOccupants}`;
    return {
      id: r.id,
      roomNumber: r.roomNumber,
      floor: r.floor,
      roomType: r.roomType,
      occupancyLabel: occ,
      billingStatus: billing,
      showOverdueDot: overdueRoomIds.has(String(r.id)),
    };
  });

  return (
    <DormPageStack>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DormStatCard title="ห้องทั้งหมด" value={rooms.length} tone="slate" />
        <DormStatCard title="มีผู้พัก" value={occupiedCount} tone="blue" subtitle={vacantCount > 0 ? `ว่าง ${vacantCount} ห้อง` : undefined} />
        <DormStatCard
          title="ค้างชำระงวดก่อน"
          value={overdue.length}
          tone={overdue.length > 0 ? "rose" : "green"}
          subtitle={overdue.length > 0 ? "รายการที่ต้องติดตาม" : "ไม่มีค้างจากงวดเก่า"}
        />
        <DormStatCard
          title="รายการค้างรวม"
          value={overdue.reduce((s, o) => s + o.balance, 0).toLocaleString("th-TH", { maximumFractionDigits: 0 })}
          tone="violet"
          subtitle="บาท (ประมาณ)"
        />
      </div>

      <DormPanelCard
        title="ผังห้องพัก"
        description="คลิกห้องเพื่อมิเตอร์ แบ่งบิล และแนบสลิป — สถานะการเงินอิงงวดเดือนปัจจุบัน (เวลาไทย)"
        action={
          <Link href="/dashboard/dormitory/rooms" className={cn(dormBtnPrimary, "w-full justify-center sm:w-auto inline-flex gap-1.5")}>
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M3 10h18M9 10v10M15 10v10" strokeLinecap="round" />
            </svg>
            จัดการห้อง
          </Link>
        }
      >
        {rooms.length === 0 ? (
          <DormEmptyDashed>ยังไม่มีห้อง — เพิ่มได้จากเมนู «การจัดการ»</DormEmptyDashed>
        ) : (
          <DormDashboardRoomGrid rooms={roomsForGrid} />
        )}
      </DormPanelCard>

      <DormPanelCard
        title="ค้างชำระ (งวดก่อน)"
        description="งวดก่อนเดือนปัจจุบัน (ไทย) — เลือกแถบเดือน · แยกรายคน · แตะ «ดำเนินการ»เพื่อเปิดห้อง"
      >
        <DormOverdueDashboardPanel
          rows={overdue.map((row) => ({
            roomId: String(row.roomId),
            roomNumber: row.roomNumber,
            tenantId: String(row.tenantId),
            tenantName: row.tenantName,
            month: row.month,
            balance: row.balance,
          }))}
        />
      </DormPanelCard>
    </DormPageStack>
  );
}
