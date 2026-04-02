import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";
import { PageHeader } from "@/components/ui/page-container";
import { AddRoomForm } from "@/systems/dormitory/components/AddRoomForm";
import { RoomBillingStatusBadge } from "@/systems/dormitory/components/RoomBillingStatusBadge";
import { buildRoomComputeInput, roomBillingUiStatus } from "@/systems/dormitory/lib/compute";
import {
  dormBtnSecondary,
  dormCard,
  dormRoomCardCta,
  dormRoomFieldLabel,
  dormRoomListCard,
  dormRoomNumberList,
  dormRoomStatRow,
  dormRoomStatValue,
} from "@/systems/dormitory/dorm-ui";

export default async function DormitoryRoomsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

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

  return (
    <div className="space-y-8">
      <PageHeader
        title="จัดการห้องพัก"
        description="เพิ่มห้อง มิเตอร์ระดับห้อง และ Split Bill ตามจำนวนผู้พัก ACTIVE"
        action={
          <Link href="/dashboard/dormitory" className={dormBtnSecondary}>
            ← ผังห้อง
          </Link>
        }
      />

      <AddRoomForm />

      <section className={`${dormCard} p-5`}>
        <h2 className="text-base font-semibold tracking-tight text-slate-900">รายการห้อง</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          คลิกการ์ดเพื่อเปิดรายละเอียด มิเตอร์ และการชำระเงิน
        </p>
        {rooms.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">ยังไม่มีห้อง</p>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
                  <Link href={`/dashboard/dormitory/rooms/${r.id}`} className={dormRoomListCard}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className={dormRoomFieldLabel}>เลขห้อง</span>
                        <p className={dormRoomNumberList}>{r.roomNumber}</p>
                        <p className="text-[11px] font-semibold leading-snug text-slate-600 tabular-nums antialiased sm:text-xs">
                          ชั้น {r.floor}
                        </p>
                        <p className="line-clamp-2 text-[11px] font-medium leading-snug text-slate-500 antialiased sm:text-xs">
                          {r.roomType}
                        </p>
                      </div>
                      <div className="flex max-w-[46%] shrink-0 flex-col items-end gap-1">
                        <span className={`${dormRoomFieldLabel} text-right`}>สถานะ</span>
                        <RoomBillingStatusBadge status={billing} size="compactWide" />
                      </div>
                    </div>
                    <div className={`${dormRoomStatRow} mt-3 border-t border-slate-200/60 pt-3`}>
                      <span className={dormRoomFieldLabel}>ผู้พัก</span>
                      <span className={dormRoomStatValue}>{occ}</span>
                      <span className={dormRoomFieldLabel}>ค่าเช่า</span>
                      <span className={`${dormRoomStatValue} tabular-nums`}>
                        {Number(r.basePrice).toLocaleString("th-TH", { maximumFractionDigits: 0 })} บาท/เดือน
                      </span>
                    </div>
                    <span className={dormRoomCardCta}>
                      รายละเอียดห้อง
                      <svg
                        className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
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
