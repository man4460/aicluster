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

  return (
    <div className="space-y-8">
      <PageHeader
        title="ผังห้องพัก"
        description="คลิกเลขห้องเพื่อดูมิเตอร์ระดับห้องและสถานะชำระเงินรายคน — ชำระครบเมื่อผู้พักทุกคนในห้องจ่ายครบงวดปัจจุบัน"
        action={
          <Link
            href="/dashboard/dormitory/rooms"
            className="rounded-lg bg-[#0000BF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0000a6]"
          >
            เพิ่ม / จัดการห้อง
          </Link>
        }
      />

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">ห้องทั้งหมด</h2>
        <p className="mt-1 text-xs text-slate-500">
          เรียงตามชั้น · สถานะการเงินอิงงวดเดือนปัจจุบัน (เขตเวลาไทย)
        </p>
        {rooms.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">ยังไม่มีห้อง — เพิ่มได้ที่เมนูจัดการห้อง</p>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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

              return (
                <li key={r.id}>
                  <Link
                    href={`/dashboard/dormitory/rooms/${r.id}`}
                    className="flex h-full min-h-[132px] flex-col rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/90 p-4 shadow-sm transition hover:border-[#0000BF]/35 hover:shadow-md"
                  >
                    <p className="text-center text-2xl font-bold tabular-nums text-slate-900">
                      {r.roomNumber}
                    </p>
                    <p className="mt-1 text-center text-[11px] text-slate-500">
                      ชั้น {r.floor} · {occ}
                    </p>
                    <div className="mt-2 flex flex-1 flex-col items-center justify-end gap-2">
                      <RoomBillingStatusBadge status={billing} />
                      <span className="text-[10px] text-slate-400 line-clamp-2 text-center">
                        {r.roomType}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">ค้างชำระ (งวดที่ผ่านมา)</h2>
        <p className="mt-1 text-xs text-slate-500">แยกรายคน — งวดก่อนเดือนปัจจุบัน (ไทย) ที่มียอดคงค้าง</p>
        {overdue.length === 0 ? (
          <p className="mt-4 text-sm text-emerald-700">ไม่มีรายการค้างชำระจากงวดที่ผ่านมา</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                        href={`/dashboard/dormitory/rooms/${row.roomId}`}
                        className="text-xs font-medium text-[#0000BF] hover:underline"
                      >
                        เปิดห้อง
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
