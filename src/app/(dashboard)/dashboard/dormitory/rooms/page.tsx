import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-container";
import { AddRoomForm } from "@/systems/dormitory/components/AddRoomForm";
import { RoomBillingStatusBadge } from "@/systems/dormitory/components/RoomBillingStatusBadge";
import { buildRoomComputeInput, roomBillingUiStatus } from "@/systems/dormitory/lib/compute";

export default async function DormitoryRoomsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const rooms = await prisma.room.findMany({
    where: { ownerUserId: session.sub },
    orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
    include: {
      tenants: true,
      utilityBills: {
        include: { payments: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="จัดการห้องพัก"
        description="เพิ่มห้อง มิเตอร์ระดับห้อง และ Split Bill ตามจำนวนผู้พัก ACTIVE"
        action={
          <Link
            href="/dashboard/dormitory"
            className="text-sm font-medium text-[#0000BF] hover:underline"
          >
            ← ผังห้อง
          </Link>
        }
      />

      <AddRoomForm />

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">รายการห้อง</h2>
        {rooms.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">ยังไม่มีห้อง</p>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {rooms.map((r) => {
              const billing = roomBillingUiStatus(buildRoomComputeInput(r));
              const activeN = r.tenants.filter((t) => t.status === "ACTIVE").length;
              const occ =
                activeN === 0
                  ? "ว่าง"
                  : activeN >= r.maxOccupants
                    ? "เต็ม"
                    : `${activeN}/${r.maxOccupants} คน`;

              return (
                <li key={r.id}>
                  <Link
                    href={`/dashboard/dormitory/rooms/${r.id}`}
                    className="flex h-full min-h-[128px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#0000BF]/30 hover:shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-lg font-bold tabular-nums text-slate-900">{r.roomNumber}</p>
                      <RoomBillingStatusBadge status={billing} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      ชั้น {r.floor} · {r.roomType}
                    </p>
                    <p className="mt-2 text-xs text-slate-600">
                      {occ} · {Number(r.basePrice).toLocaleString("th-TH")} บ./ด.
                    </p>
                    <span className="mt-auto pt-3 text-xs font-medium text-[#0000BF]">รายละเอียด →</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
