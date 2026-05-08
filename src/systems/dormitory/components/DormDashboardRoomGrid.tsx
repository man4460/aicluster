"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { RoomBillingStatusBadge } from "@/systems/dormitory/components/RoomBillingStatusBadge";
import type { RoomBillingUiStatus } from "@/systems/dormitory/lib/compute";
import {
  dormRoomCardDivider,
  dormRoomFieldLabel,
  dormRoomFloorPill,
  dormRoomNumberHero,
  dormRoomOccLine,
  dormRoomTile,
  dormRoomTileOverdueHint,
  dormRoomTypeHint,
} from "@/systems/dormitory/dorm-ui";

type RoomGridItem = {
  id: number;
  roomNumber: string;
  floor: number;
  roomType: string;
  occupancyLabel: string;
  billingStatus: RoomBillingUiStatus;
  showOverdueDot: boolean;
};

type FilterKey = "all" | "unpaid" | "paid";

export function DormDashboardRoomGrid({ rooms }: { rooms: RoomGridItem[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filteredRooms = useMemo(() => {
    if (filter === "all") return rooms;
    if (filter === "paid") return rooms.filter((r) => r.billingStatus === "paid_complete");
    return rooms.filter((r) =>
      r.billingStatus === "overdue" ||
      r.billingStatus === "payment_pending" ||
      r.billingStatus === "meter_needed",
    );
  }, [filter, rooms]);

  const pillClass = (active: boolean) =>
    cn(
      "inline-flex min-h-[40px] items-center justify-center rounded-full px-3 py-1.5 text-xs font-bold transition",
      active
        ? "bg-[#ecebff] text-[#4338ca] ring-1 ring-[#4d47b6]/20"
        : "bg-white text-[#66638c] ring-1 ring-slate-200/80 hover:bg-slate-50",
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={pillClass(filter === "all")} onClick={() => setFilter("all")}>
          ทั้งหมด
        </button>
        <button type="button" className={pillClass(filter === "unpaid")} onClick={() => setFilter("unpaid")}>
          ค้างชำระ
        </button>
        <button type="button" className={pillClass(filter === "paid")} onClick={() => setFilter("paid")}>
          ชำระแล้ว
        </button>
      </div>

      {filteredRooms.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
          ไม่พบห้องตามตัวกรองที่เลือก
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3">
          {filteredRooms.map((r) => (
            <li key={r.id}>
              <Link
                href={`/dashboard/dormitory/rooms/${r.id}`}
                className={`${dormRoomTile}${r.showOverdueDot ? ` ${dormRoomTileOverdueHint}` : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className={dormRoomFieldLabel}>เลขห้อง</span>
                    <p className={`${dormRoomNumberHero} mt-1 text-left`}>{r.roomNumber}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={dormRoomFloorPill}>ชั้น {r.floor}</span>
                      <p className={`${dormRoomOccLine} text-left`}>{r.occupancyLabel}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className={dormRoomFieldLabel}>การเงิน</span>
                    <RoomBillingStatusBadge status={r.billingStatus} size="compact" />
                  </div>
                </div>
                <div className={`${dormRoomCardDivider} mt-3 pt-2.5`}>
                  <div className="flex items-start justify-between gap-3">
                    <span className={dormRoomFieldLabel}>ประเภท</span>
                    <span className={`${dormRoomTypeHint} text-right`}>{r.roomType}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

