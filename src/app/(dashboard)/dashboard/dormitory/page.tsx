import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";
import { RoomBillingStatusBadge } from "@/systems/dormitory/components/RoomBillingStatusBadge";
import { DormEmptyDashed, DormPageStack, DormPanelCard } from "@/systems/dormitory/components/DormPageChrome";
import {
  buildRoomComputeInput,
  computeAllBalanceLines,
  overdueLines,
  roomBillingUiStatus,
} from "@/systems/dormitory/lib/compute";
import {
  dormBtnPrimary,
  dormBtnSecondary,
  dormRoomCardDivider,
  dormRoomFieldLabel,
  dormRoomFloorPill,
  dormRoomNumberHero,
  dormRoomOccLine,
  dormRoomTile,
  dormRoomTileOverdueHint,
  dormRoomTypeHint,
} from "@/systems/dormitory/dorm-ui";
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

  return (
    <DormPageStack>
      <DormPanelCard
        title="ผังห้องพัก"
        description="คลิกห้องเพื่อมิเตอร์ แบ่งบิล และแนบสลิป — สถานะการเงินอิงงวดเดือนปัจจุบัน (เวลาไทย)"
        action={
          <Link href="/dashboard/dormitory/rooms" className={cn(dormBtnPrimary, "w-full justify-center sm:w-auto")}>
            จัดการห้อง
          </Link>
        }
      >
        {rooms.length === 0 ? (
          <DormEmptyDashed>ยังไม่มีห้อง — เพิ่มได้จากเมนู «ห้อง»</DormEmptyDashed>
        ) : (
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {rooms.map((r) => {
              const input = buildRoomComputeInput(r);
              const billing = roomBillingUiStatus(input);
              const activeN = r.tenants.filter((t) => t.status === "ACTIVE").length;
              const occ =
                activeN === 0 ? "ว่าง" : activeN >= r.maxOccupants ? "เต็ม" : `พัก ${activeN}/${r.maxOccupants}`;

              const showOverdueDot = overdueRoomIds.has(String(r.id));
              return (
                <li key={r.id}>
                  <Link
                    href={`/dashboard/dormitory/rooms/${r.id}`}
                    className={`${dormRoomTile}${showOverdueDot ? ` ${dormRoomTileOverdueHint}` : ""}`}
                  >
                    <div className="flex flex-col items-center">
                      <span className={dormRoomFieldLabel}>เลขห้อง</span>
                      <p className={`${dormRoomNumberHero} mt-1`}>{r.roomNumber}</p>
                    </div>
                    <div className="mt-2 flex flex-col items-center gap-1.5 sm:mt-3 sm:gap-2">
                      <span className={dormRoomFloorPill}>ชั้น {r.floor}</span>
                      <p className={dormRoomOccLine}>{occ}</p>
                    </div>
                    <div
                      className={`${dormRoomCardDivider} mt-auto flex flex-1 flex-col items-center justify-end gap-2 pt-2.5 sm:gap-2.5 sm:pt-3`}
                    >
                      <div className="flex w-full flex-col items-center gap-0.5 sm:gap-1">
                        <span className={dormRoomFieldLabel}>การเงิน</span>
                        <RoomBillingStatusBadge status={billing} size="compact" />
                      </div>
                      <div className="flex w-full flex-col items-center gap-0.5 px-0.5 sm:gap-1">
                        <span className={dormRoomFieldLabel}>ประเภท</span>
                        <span className={dormRoomTypeHint}>{r.roomType}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </DormPanelCard>

      <DormPanelCard
        title="ค้างชำระ (งวดก่อน)"
        description="งวดก่อนเดือนปัจจุบัน (ไทย) — แยกรายคน · แตะ «ดำเนินการ»เพื่อเปิดห้อง"
        action={
          overdue.length > 0 ? (
            <Link href="/dashboard/dormitory/history" className={cn(dormBtnSecondary, "w-full justify-center sm:w-auto")}>
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
                <li
                  key={`${row.tenantId}-${row.month}`}
                  className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white p-3 shadow-sm ring-1 ring-amber-100/80"
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-400/90 to-orange-300/80"
                    aria-hidden
                  />
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
                    className="mt-2 flex min-h-[40px] items-center justify-center rounded-xl bg-amber-600/95 py-2 text-center text-xs font-bold text-white shadow-sm active:scale-[0.99]"
                  >
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
                          className="inline-flex rounded-lg bg-[#0000BF]/10 px-2.5 py-1.5 text-xs font-bold text-[#0000BF] hover:bg-[#0000BF]/15"
                        >
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
