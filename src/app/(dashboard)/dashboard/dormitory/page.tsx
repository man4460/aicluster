import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";
import { PageHeader } from "@/components/ui/page-container";
import { RoomBillingStatusBadge } from "@/systems/dormitory/components/RoomBillingStatusBadge";
import {
  buildRoomComputeInput,
  computeAllBalanceLines,
  overdueLines,
  roomBillingUiStatus,
} from "@/systems/dormitory/lib/compute";
import {
  dormBtnPrimary,
  dormCard,
  dormRoomCardDivider,
  dormRoomFieldLabel,
  dormRoomFloorPill,
  dormRoomNumberHero,
  dormRoomOccLine,
  dormRoomTile,
  dormRoomTileOverdueHint,
  dormRoomTypeHint,
} from "@/systems/dormitory/dorm-ui";

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
    <div className="space-y-8">
      <PageHeader
        title="ผังห้องพัก"
        description="คลิกเลขห้องเพื่อดูมิเตอร์ระดับห้องและสถานะชำระเงินรายคน — ชำระครบเมื่อผู้พักทุกคนในห้องจ่ายครบงวดปัจจุบัน"
        action={
          <Link href="/dashboard/dormitory/rooms" className={dormBtnPrimary}>
            เพิ่ม / จัดการห้อง
          </Link>
        }
      />

      <section className={`${dormCard} p-5`}>
        <h2 className="text-base font-semibold tracking-tight text-slate-900">ห้องทั้งหมด</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          เรียงตามชั้น · สถานะการเงินอิงงวดเดือนปัจจุบัน (เขตเวลาไทย) · คลิกห้องเพื่อชำระหรือแนบสลิป
        </p>
        {rooms.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">ยังไม่มีห้อง — เพิ่มได้ที่เมนูจัดการห้อง</p>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {rooms.map((r) => {
              const input = buildRoomComputeInput(r);
              const billing = roomBillingUiStatus(input);
              const activeN = r.tenants.filter((t) => t.status === "ACTIVE").length;
              const occ =
                activeN === 0
                  ? "ว่าง"
                  : activeN >= r.maxOccupants
                    ? "เต็ม"
                    : `พัก ${activeN}/${r.maxOccupants}`;

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
                    <div className="mt-3 flex flex-col items-center gap-2">
                      <span className={dormRoomFloorPill}>ชั้น {r.floor}</span>
                      <p className={dormRoomOccLine}>{occ}</p>
                    </div>
                    <div
                      className={`${dormRoomCardDivider} mt-auto flex flex-1 flex-col items-center justify-end gap-2.5 pt-3`}
                    >
                      <div className="flex w-full flex-col items-center gap-1">
                        <span className={dormRoomFieldLabel}>สถานะการเงิน</span>
                        <RoomBillingStatusBadge status={billing} size="compact" />
                      </div>
                      <div className="flex w-full flex-col items-center gap-1 px-0.5">
                        <span className={dormRoomFieldLabel}>ประเภทห้อง</span>
                        <span className={dormRoomTypeHint}>{r.roomType}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border-2 border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-white p-5 shadow-sm">
        <h2 className="text-base font-semibold tracking-tight text-amber-950">ค้างชำระ (งวดที่ผ่านมา)</h2>
        <p className="mt-1 text-xs leading-relaxed text-amber-900/85">
          แยกรายคน — งวดก่อนเดือนปัจจุบัน (ไทย) ที่มียอดคงค้าง · เปิดห้องเพื่อใบแจ้งหนี้ แนบสลิป หรือบันทึกมิเตอร์
        </p>
        {overdue.length === 0 ? (
          <p className="mt-4 text-sm text-emerald-700">ไม่มีรายการค้างชำระจากงวดที่ผ่านมา</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-amber-100/90 bg-white/90 shadow-inner">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-amber-50/90 text-xs font-semibold uppercase tracking-wide text-amber-900/70">
                <tr>
                  <th className="px-3 py-2">ผู้เข้าพัก</th>
                  <th className="px-3 py-2">ห้อง</th>
                  <th className="px-3 py-2">งวด</th>
                  <th className="px-3 py-2 text-right">ค้าง (บาท)</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdue.map((row) => (
                  <tr key={`${row.tenantId}-${row.month}`} className="text-slate-800">
                    <td className="px-3 py-2 font-medium">{row.tenantName}</td>
                    <td className="px-3 py-2">{row.roomNumber}</td>
                    <td className="px-3 py-2">{row.month}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-red-700">
                      {row.balance.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/dashboard/dormitory/rooms/${row.roomId}?month=${encodeURIComponent(row.month)}`}
                        className="rounded-lg bg-[#0000BF]/10 px-2.5 py-1 text-xs font-semibold text-[#0000BF] hover:bg-[#0000BF]/15"
                      >
                        ดำเนินการ
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
