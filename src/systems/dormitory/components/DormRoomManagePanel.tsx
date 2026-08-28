"use client";

import Link from "next/link";
import { DormEmptyDashed } from "@/systems/dormitory/components/DormPageChrome";
import { RoomBillingStatusBadge } from "@/systems/dormitory/components/RoomBillingStatusBadge";
import type { RoomBillingUiStatus } from "@/systems/dormitory/lib/compute";
import {
  dormRoomCardCta,
  dormRoomFieldLabel,
  dormRoomListCard,
  dormRoomNumberList,
  dormRoomStatRow,
  dormRoomStatValue,
} from "@/systems/dormitory/dorm-ui";

export type DormRoomManageRow = {
  id: number;
  roomNumber: string;
  floor: number;
  roomType: string;
  basePrice: number;
  maxOccupants: number;
  activeTenants: number;
  billingStatus: RoomBillingUiStatus;
};

function occupancyLabel(activeTenants: number, maxOccupants: number): string {
  if (activeTenants === 0) return "ว่าง";
  if (activeTenants >= maxOccupants) return "เต็ม";
  return `${activeTenants}/${maxOccupants} คน`;
}

export function DormRoomManagePanel({ rooms }: { rooms: DormRoomManageRow[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-[#66638c]">
        {rooms.length > 0
          ? `รายการห้อง ${rooms.length} ห้อง — คลิกการ์ดเพื่อเปิดรายละเอียด มิเตอร์ และการชำระ`
          : "คลิกการ์ดเพื่อเปิดรายละเอียด มิเตอร์ และการชำระ"}
      </p>
      {rooms.length === 0 ? (
        <DormEmptyDashed>ยังไม่มีห้อง — กด «+ เพิ่มห้อง» ด้านบนขวา</DormEmptyDashed>
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((r) => (
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
                    <RoomBillingStatusBadge status={r.billingStatus} size="compactWide" />
                  </div>
                </div>
                <div className={`${dormRoomStatRow} mt-3 border-t border-slate-200/60 pt-3`}>
                  <span className={dormRoomFieldLabel}>ผู้พัก</span>
                  <span className={dormRoomStatValue}>{occupancyLabel(r.activeTenants, r.maxOccupants)}</span>
                  <span className={dormRoomFieldLabel}>ค่าเช่า</span>
                  <span className={`${dormRoomStatValue} tabular-nums`}>
                    {r.basePrice.toLocaleString("th-TH", { maximumFractionDigits: 0 })} บาท/ด.
                  </span>
                </div>
                <span className={dormRoomCardCta}>
                  รายละเอียด
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
          ))}
        </ul>
      )}
    </div>
  );
}
