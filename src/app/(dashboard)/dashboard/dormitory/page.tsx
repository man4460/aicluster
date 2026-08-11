import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";
import { DormDashboardRoomGrid } from "@/systems/dormitory/components/DormDashboardRoomGrid";
import { DormEmptyDashed, DormPageStack, DormPanelCard } from "@/systems/dormitory/components/DormPageChrome";
import { DormStatCard } from "@/systems/dormitory/components/DormStatCard";
import {
  buildRoomComputeInput,
  computeAllBalanceLines,
  overdueLines,
  roomBillingUiStatus,
} from "@/systems/dormitory/lib/compute";
import { dormBtnPrimary, dormBtnSecondary } from "@/systems/dormitory/dorm-ui";
import { dormListRowCardWarnClass } from "@/systems/dormitory/dorm-ui-tokens";
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
          <DormEmptyDashed>ยังไม่มีห้อง — เพิ่มได้จากเมนู «ห้อง»</DormEmptyDashed>
        ) : (
          <DormDashboardRoomGrid rooms={roomsForGrid} />
        )}
      </DormPanelCard>

      <DormPanelCard
        title="ค้างชำระ (งวดก่อน)"
        description="งวดก่อนเดือนปัจจุบัน (ไทย) — แยกรายคน · แตะ «ดำเนินการ»เพื่อเปิดห้อง"
        action={
          overdue.length > 0 ? (
            <Link href="/dashboard/dormitory/history" className={cn(dormBtnSecondary, "w-full justify-center sm:w-auto inline-flex gap-1.5")}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
                <path d="M3 4v3h3M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              ประวัติ
            </Link>
          ) : null
        }
      >
        {overdue.length === 0 ? (
          <p className="text-center text-sm font-medium text-emerald-700">ไม่มีรายการค้างจากงวดที่ผ่านมา</p>
        ) : (
          <>
            <ul className="grid list-none gap-2 md:hidden">
              {overdue.map((row) => (
                <li key={`${row.tenantId}-${row.month}`} className={dormListRowCardWarnClass}>
                  <div className="flex items-start justify-between gap-2 pt-0.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-amber-950">{row.tenantName}</p>
                      <p className="mt-0.5 text-[11px] text-amber-900/80">
                        ห้อง <span className="font-bold tabular-nums">{row.roomNumber}</span> · {row.month}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold tabular-nums text-red-700">
                      {row.balance.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/dormitory/rooms/${row.roomId}?month=${encodeURIComponent(row.month)}`}
                    className="mt-2 inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-[#5b61ff] py-2 text-center text-xs font-bold text-white shadow-sm active:scale-[0.99]"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    ดำเนินการ
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto rounded-xl border border-amber-100/90 bg-white/95 shadow-inner md:block [-webkit-overflow-scrolling:touch]">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-amber-50/90 text-[11px] font-bold text-amber-900/75">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2">ผู้เข้าพัก</th>
                    <th className="whitespace-nowrap px-3 py-2">ห้อง</th>
                    <th className="whitespace-nowrap px-3 py-2">งวด</th>
                    <th className="whitespace-nowrap px-3 py-2 text-right">ค้าง (บาท)</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overdue.map((row) => (
                    <tr key={`${row.tenantId}-${row.month}`} className="text-slate-800">
                      <td className="px-3 py-2 font-medium">{row.tenantName}</td>
                      <td className="px-3 py-2 tabular-nums">{row.roomNumber}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.month}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-red-700">
                        {row.balance.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/dashboard/dormitory/rooms/${row.roomId}?month=${encodeURIComponent(row.month)}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0000BF]/10 px-2.5 py-1.5 text-xs font-bold text-[#0000BF] hover:bg-[#0000BF]/15"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                            <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          ดำเนินการ
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DormPanelCard>
    </DormPageStack>
  );
}
