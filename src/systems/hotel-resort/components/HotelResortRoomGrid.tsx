"use client";

import { useMemo, useState } from "react";
import { AppEmptyState, appTemplateOutlineButtonClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { HotelResortButton } from "@/systems/hotel-resort/components/HotelResortButton";
import { HotelResortRoomStatusBadge } from "@/systems/hotel-resort/components/HotelResortRoomStatusBadge";
import type { HotelResortRoomRow } from "@/systems/hotel-resort/lib/client-data";
import {
  hotelResortCardAccentBarClass,
  hotelResortContentCardClass,
  hotelResortContentCardInteractiveClass,
  hotelResortContentCardSelectedClass,
  hotelResortFieldClass,
  hotelResortFilterChipClass,
  hotelResortGradientPriceClass,
  hotelResortListGridClass,
  hotelResortMetaChipClass,
} from "@/systems/hotel-resort/lib/ui-tokens";

type HotelResortRoomStatus = "VACANT" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";

const statuses: Array<{ key: "ALL" | HotelResortRoomStatus; label: string }> = [
  { key: "ALL", label: "ทั้งหมด" },
  { key: "VACANT", label: "ว่าง" },
  { key: "OCCUPIED", label: "เข้าพัก" },
  { key: "RESERVED", label: "จอง" },
  { key: "MAINTENANCE", label: "ซ่อม" },
];

function HotelResortRoomCard({
  room,
  selectable,
  selected,
  onRoomSelect,
  onOpenBookingDetail,
}: {
  room: HotelResortRoomRow;
  selectable: boolean;
  selected: boolean;
  onRoomSelect?: (room: HotelResortRoomRow) => void;
  onOpenBookingDetail?: (bookingId: string) => void;
}) {
  const showBookingLink = Boolean(room.bookingId && onOpenBookingDetail);

  const accentTone: "emerald" | "indigo" | "amber" | "rose" | "slate" =
    room.status === "VACANT"
      ? "emerald"
      : room.status === "OCCUPIED"
        ? "indigo"
        : room.status === "RESERVED"
          ? "amber"
          : "rose";

  const cardClass = cn(
    "relative flex h-full min-h-[10.5rem] w-full flex-col overflow-hidden pl-4 text-left sm:min-h-[11rem] sm:pl-5",
    hotelResortContentCardClass,
    selectable && hotelResortContentCardInteractiveClass,
    selectable && "cursor-pointer",
    selected && hotelResortContentCardSelectedClass,
  );

  const body = (
    <>
      <span className={hotelResortCardAccentBarClass(accentTone)} aria-hidden />
      <div className="flex shrink-0 items-start justify-between gap-2">
        <p className="text-lg font-black tracking-tight text-[#1e1b4b]">{room.roomNumber}</p>
        <HotelResortRoomStatusBadge status={room.status as HotelResortRoomStatus} className="shrink-0" />
      </div>

      <div className="mt-2 min-h-0 flex-1 space-y-1.5">
        <span className={hotelResortMetaChipClass}>{room.roomTypeName}</span>
        <p className={cn("text-sm font-black tabular-nums", hotelResortGradientPriceClass)}>
          ฿{room.basePriceBaht.toLocaleString("th-TH")}
          <span className="text-xs font-semibold text-[#8b87b8]">/คืน</span>
        </p>
        <p className="line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-snug text-[#2e2a58]">
          {room.guestLabel ? (
            <>
              <span className="font-semibold text-[#66638c]">ผู้เข้าพัก: </span>
              {room.guestLabel}
            </>
          ) : (
            <span className="text-[#8b87b8]">ยังไม่มีผู้เข้าพัก</span>
          )}
        </p>
      </div>

      <div className="mt-auto shrink-0 pt-3">
        {showBookingLink ? (
          selectable ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onOpenBookingDetail?.(room.bookingId as string);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.preventDefault();
                e.stopPropagation();
                onOpenBookingDetail?.(room.bookingId as string);
              }}
              className="inline-flex min-h-[1.625rem] cursor-pointer rounded-full border border-[#5b61ff]/35 bg-white/70 px-2.5 py-1 text-[10px] font-black text-[#4d47b6]"
            >
              ดูการจอง
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onOpenBookingDetail?.(room.bookingId as string)}
              className="inline-flex min-h-[1.625rem] rounded-full border border-[#5b61ff]/35 bg-white/70 px-2.5 py-1 text-[10px] font-black text-[#4d47b6]"
            >
              ดูการจอง
            </button>
          )
        ) : (
          <span className="inline-flex min-h-[1.625rem]" aria-hidden />
        )}
      </div>
    </>
  );

  if (selectable) {
    return (
      <HotelResortButton
        type="button"
        onClick={() => onRoomSelect?.(room)}
        className={cardClass}
        aria-label={`ห้อง ${room.roomNumber}`}
      >
        {body}
      </HotelResortButton>
    );
  }

  return (
    <div className={cardClass} aria-label={`ห้อง ${room.roomNumber}`}>
      {body}
    </div>
  );
}

export function HotelResortRoomGrid({
  rooms,
  onRoomSelect,
  onOpenBookingDetail,
  activeRoomId,
}: {
  rooms: HotelResortRoomRow[];
  onRoomSelect?: (room: HotelResortRoomRow) => void;
  onOpenBookingDetail?: (bookingId: string) => void;
  activeRoomId?: string | null;
}) {
  const [filterStatus, setFilterStatus] = useState<"ALL" | HotelResortRoomStatus>("ALL");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const roomTypes = useMemo(() => {
    const map = new Map<string, string>();
    for (const room of rooms) map.set(room.roomTypeId, room.roomTypeName);
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "th"));
  }, [rooms]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return rooms.filter((room) => {
      if (filterStatus !== "ALL" && room.status !== filterStatus) return false;
      if (roomTypeId && room.roomTypeId !== roomTypeId) return false;
      if (!kw) return true;
      const blob = `${room.roomNumber} ${room.roomTypeName} ${room.guestLabel ?? ""} ${room.floor}`.toLowerCase();
      return blob.includes(kw);
    });
  }, [rooms, filterStatus, roomTypeId, keyword]);

  const hasActiveFilter = filterStatus !== "ALL" || roomTypeId !== "" || keyword.trim() !== "";

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="ค้นหาเลขห้อง ประเภท ชื่อผู้เข้าพัก"
            className={cn(hotelResortFieldClass, "min-w-0 flex-1")}
            aria-label="ค้นหาห้องพัก"
          />
          <HotelResortButton
            type="button"
            onClick={() => setMobileFilterOpen((v) => !v)}
            className={cn(
              appTemplateOutlineButtonClass,
              "relative min-h-[44px] min-w-[44px] shrink-0 px-0 sm:hidden",
              hasActiveFilter && "border-[#5b61ff]/40 bg-[#ecebff]/80",
            )}
            aria-label="เปิดตัวกรอง"
            aria-expanded={mobileFilterOpen}
          >
            <IconFilter className="h-5 w-5" />
          </HotelResortButton>
        </div>

        <div
          className={cn(
            "space-y-2 rounded-2xl border border-white/50 bg-white/25 p-3 backdrop-blur-sm sm:space-y-0 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none",
            mobileFilterOpen ? "block" : "hidden sm:block",
          )}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => (
                <HotelResortButton
                  key={s.key}
                  type="button"
                  onClick={() => setFilterStatus(s.key)}
                  className={hotelResortFilterChipClass(filterStatus === s.key)}
                  aria-pressed={filterStatus === s.key}
                >
                  {s.label}
                </HotelResortButton>
              ))}
            </div>
            <select
              value={roomTypeId}
              onChange={(e) => setRoomTypeId(e.target.value)}
              className={cn(hotelResortFieldClass, "sm:max-w-[12rem]")}
              aria-label="กรองประเภทห้อง"
            >
              <option value="">ทุกประเภทห้อง</option>
              {roomTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilter ? (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 sm:pt-2">
              <p className="text-xs font-semibold text-[#66638c]">
                แสดง {filtered.length.toLocaleString("th-TH")} จาก {rooms.length.toLocaleString("th-TH")} ห้อง
              </p>
              <HotelResortButton
                type="button"
                onClick={() => {
                  setFilterStatus("ALL");
                  setRoomTypeId("");
                  setKeyword("");
                }}
                className={cn(appTemplateOutlineButtonClass, "min-h-[36px] rounded-xl px-3 text-xs font-black text-[#4d47b6]")}
              >
                ล้างตัวกรอง
              </HotelResortButton>
            </div>
          ) : (
            <p className="text-xs font-semibold text-[#66638c] sm:pt-2">
              ทั้งหมด {rooms.length.toLocaleString("th-TH")} ห้อง
            </p>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <AppEmptyState>ไม่พบห้องตามเงื่อนไขที่กรอง</AppEmptyState>
      ) : (
        <ul className={hotelResortListGridClass}>
          {filtered.map((room) => {
            const selectable = Boolean(onRoomSelect);
            const selected = activeRoomId != null && activeRoomId === room.id;
            return (
              <li key={room.id} className="flex min-h-0">
                <HotelResortRoomCard
                  room={room}
                  selectable={selectable}
                  selected={selected}
                  onRoomSelect={onRoomSelect}
                  onOpenBookingDetail={onOpenBookingDetail}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}
