"use client";

import { useEffect, useMemo, useState } from "react";
import { AppEmptyState, appTemplateOutlineButtonClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { HotelResortButton } from "@/systems/hotel-resort/components/HotelResortButton";
import { HotelResortRoomStatusBadge } from "@/systems/hotel-resort/components/HotelResortRoomStatusBadge";
import { IconAlertTriangle } from "@/systems/hotel-resort/components/HotelResortIcons";
import type { HotelResortRoomRow } from "@/systems/hotel-resort/lib/client-data";
import { hotelResortNeedsCloseLabel } from "@/systems/hotel-resort/lib/room-occupancy";
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
  onCheckIn,
  onCheckOut,
  onManageStay,
  onMarkNoShow,
  onAddBooking,
  checkInBusy,
  noShowBusy,
}: {
  room: HotelResortRoomRow;
  selectable: boolean;
  selected: boolean;
  onRoomSelect?: (room: HotelResortRoomRow) => void;
  onCheckIn?: (room: HotelResortRoomRow) => void;
  onCheckOut?: (room: HotelResortRoomRow) => void;
  onManageStay?: (room: HotelResortRoomRow) => void;
  onMarkNoShow?: (room: HotelResortRoomRow) => void;
  onAddBooking?: (room: HotelResortRoomRow) => void;
  checkInBusy?: boolean;
  noShowBusy?: boolean;
}) {
  const status = (room.displayStatus ?? room.status) as HotelResortRoomStatus;
  const canAddBooking = Boolean(onAddBooking) && status === "VACANT";
  const canCheckIn = Boolean(onCheckIn) && (status === "VACANT" || status === "RESERVED");
  const canManageStay = Boolean(onManageStay) && status === "OCCUPIED" && Boolean(room.bookingId);
  const canCheckOut = Boolean(onCheckOut) && status === "OCCUPIED" && Boolean(room.bookingId);
  const needsClose = Boolean(room.needsClose);
  const needsCloseKind = room.needsCloseKind ?? null;
  const isNoShowAlert = needsClose && needsCloseKind === "NO_SHOW";
  const isCheckoutAlert = needsClose && needsCloseKind === "CHECKOUT";
  const canMarkNoShow =
    Boolean(onMarkNoShow) && isNoShowAlert && Boolean(room.bookingId);

  const accentTone: "emerald" | "indigo" | "amber" | "rose" | "slate" = isCheckoutAlert
    ? "rose"
    : isNoShowAlert
      ? "amber"
      : status === "VACANT"
        ? "emerald"
        : status === "OCCUPIED"
          ? "indigo"
          : status === "RESERVED"
            ? "amber"
            : "rose";

  const cardClass = cn(
    "relative flex h-full min-h-[10.5rem] w-full flex-col overflow-hidden pl-4 text-left sm:min-h-[11rem] sm:pl-5",
    hotelResortContentCardClass,
    selectable && hotelResortContentCardInteractiveClass,
    selectable && "cursor-pointer",
    selected && hotelResortContentCardSelectedClass,
    isCheckoutAlert && "ring-2 ring-rose-400/80 shadow-[0_0_0_1px_rgba(251,113,133,0.35)]",
    isNoShowAlert && "ring-2 ring-amber-400/80 shadow-[0_0_0_1px_rgba(251,191,36,0.4)]",
  );

  const hasActions = canAddBooking || canCheckIn || canManageStay || canCheckOut || canMarkNoShow;

  const actions = (
    <div className="mt-auto flex shrink-0 flex-wrap items-center gap-1.5 pt-3">
      {canAddBooking ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddBooking?.(room);
          }}
          className="inline-flex min-h-[32px] items-center justify-center rounded-xl border border-[#5b61ff]/35 bg-white/80 px-3 py-1.5 text-[11px] font-black text-[#4d47b6] shadow-sm"
          aria-label={`เพิ่มการจองห้อง ${room.roomNumber}`}
        >
          จอง
        </button>
      ) : null}
      {canCheckIn && !canMarkNoShow ? (
        <button
          type="button"
          disabled={checkInBusy}
          onClick={(e) => {
            e.stopPropagation();
            onCheckIn?.(room);
          }}
          className="inline-flex min-h-[32px] items-center justify-center rounded-xl bg-gradient-to-r from-[#5b61ff] to-[#7c66ff] px-3 py-1.5 text-[11px] font-black text-white shadow-sm disabled:opacity-50"
          aria-label={`เช็คอินห้อง ${room.roomNumber}`}
        >
          {checkInBusy ? "..." : "เช็คอิน"}
        </button>
      ) : null}
      {canMarkNoShow ? (
        <>
          <button
            type="button"
            disabled={noShowBusy}
            onClick={(e) => {
              e.stopPropagation();
              onMarkNoShow?.(room);
            }}
            className="inline-flex min-h-[32px] items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-black text-amber-900 shadow-sm disabled:opacity-50"
            aria-label={`ปิดงานไม่มา ห้อง ${room.roomNumber}`}
          >
            {noShowBusy ? "..." : "ไม่มา · เปิดห้อง"}
          </button>
          {canCheckIn ? (
            <button
              type="button"
              disabled={checkInBusy}
              onClick={(e) => {
                e.stopPropagation();
                onCheckIn?.(room);
              }}
              className="inline-flex min-h-[32px] items-center justify-center rounded-xl border border-[#5b61ff]/35 bg-white/80 px-3 py-1.5 text-[11px] font-black text-[#4d47b6] shadow-sm disabled:opacity-50"
              aria-label={`เช็คอินห้อง ${room.roomNumber}`}
            >
              {checkInBusy ? "..." : "เช็คอิน"}
            </button>
          ) : null}
        </>
      ) : null}
      {canManageStay ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onManageStay?.(room);
          }}
          className="inline-flex min-h-[32px] items-center justify-center rounded-xl border border-[#5b61ff]/35 bg-white/80 px-3 py-1.5 text-[11px] font-black text-[#4d47b6] shadow-sm"
          aria-label={`แก้ไขการเช็คอินห้อง ${room.roomNumber}`}
        >
          แก้ไข
        </button>
      ) : null}
      {canCheckOut ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCheckOut?.(room);
          }}
          className={cn(
            "inline-flex min-h-[32px] items-center justify-center rounded-xl px-3 py-1.5 text-[11px] font-black shadow-sm",
            isCheckoutAlert
              ? "border border-rose-400 bg-rose-600 text-white"
              : "border border-indigo-300/70 bg-indigo-50 text-indigo-800",
          )}
          aria-label={`เช็คเอาต์ห้อง ${room.roomNumber}`}
        >
          {isCheckoutAlert ? "เช็คเอาต์ · เคลียร์" : "เช็คเอาต์"}
        </button>
      ) : !hasActions ? (
        <span className="inline-flex min-h-[32px]" aria-hidden />
      ) : null}
    </div>
  );

  const stayLabel =
    room.checkInAt && room.checkOutAt
      ? `${new Date(room.checkInAt).toLocaleDateString("th-TH")} – ${new Date(room.checkOutAt).toLocaleDateString("th-TH")}`
      : null;

  const alertLabel = hotelResortNeedsCloseLabel(needsCloseKind, {
    hasFollowingGuest: Boolean(room.nextDayGuestLabel),
  });

  const body = (
    <>
      <span className={hotelResortCardAccentBarClass(accentTone)} aria-hidden />
      {isNoShowAlert ? (
        <span
          className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-300 bg-amber-500 text-white shadow-md ring-2 ring-white"
          title={alertLabel}
          aria-label={alertLabel}
        >
          <IconAlertTriangle className="h-4 w-4" />
        </span>
      ) : null}
      {isCheckoutAlert ? (
        <span
          className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-300 bg-rose-500 text-white shadow-md ring-2 ring-white"
          title={alertLabel}
          aria-label={alertLabel}
        >
          <IconAlertTriangle className="h-4 w-4" />
        </span>
      ) : null}

      <div className={cn("flex shrink-0 items-start justify-between gap-2", needsClose && "pr-9")}>
        <p className="text-lg font-black tracking-tight text-[#1e1b4b]">{room.roomNumber}</p>
        <HotelResortRoomStatusBadge status={status} className="shrink-0" />
      </div>

      <div className="mt-2 min-h-0 flex-1 space-y-1.5">
        {room.buildingName ? (
          <p className="text-[11px] font-bold text-[#66638c]">{room.buildingName}</p>
        ) : null}
        {(room.bedType || room.roomSizeSqm) && (
          <p className="text-[11px] font-semibold text-[#66638c]">
            {[room.bedType, room.roomSizeSqm != null ? `${room.roomSizeSqm} ตร.ม.` : null].filter(Boolean).join(" · ")}
          </p>
        )}
        <span className={hotelResortMetaChipClass}>{room.roomTypeName}</span>
        <p className={cn("text-sm font-black tabular-nums", hotelResortGradientPriceClass)}>
          ฿{room.basePriceBaht.toLocaleString("th-TH")}
          <span className="text-xs font-semibold text-[#8b87b8]">/คืน</span>
        </p>

        {isNoShowAlert ? (
          <div
            className="flex items-start gap-1.5 rounded-xl border border-amber-300/90 bg-amber-50 px-2 py-1.5 text-[11px] font-bold text-amber-950"
            role="alert"
          >
            <IconAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span>{alertLabel}</span>
          </div>
        ) : null}
        {isCheckoutAlert ? (
          <div
            className="flex items-start gap-1.5 rounded-xl border border-rose-300/90 bg-rose-50 px-2 py-1.5 text-[11px] font-bold text-rose-950"
            role="alert"
          >
            <IconAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
            <span>{alertLabel}</span>
          </div>
        ) : null}

        {stayLabel ? <p className="text-[11px] font-semibold text-[#8b87b8]">{stayLabel}</p> : null}

        <p className="line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-snug text-[#2e2a58]">
          {room.guestLabel ? (
            <>
              <span className="font-semibold text-[#66638c]">
                {needsClose ? "ผู้เข้าพักก่อนหน้า: " : "ผู้เข้าพัก: "}
              </span>
              {room.guestLabel}
            </>
          ) : room.nextDayGuestLabel ? (
            <span className="text-[#8b87b8]">วันนี้ว่าง · รอผู้จองถัดไป</span>
          ) : room.upcomingLabel ? (
            <>
              <span className="font-semibold text-[#66638c]">ล่วงหน้า: </span>
              {room.upcomingLabel}
            </>
          ) : (
            <span className="text-[#8b87b8]">ยังไม่มีผู้เข้าพัก</span>
          )}
        </p>

        {room.nextDayGuestLabel ? (
          <div
            className={cn(
              "rounded-xl border px-2 py-1.5 text-[11px] font-bold",
              room.nextDayIsContinuous
                ? "border-violet-300/90 bg-violet-50/95 text-violet-950"
                : "border-sky-200/90 bg-sky-50/95 text-sky-950",
            )}
            role="status"
          >
            <p
              className={cn(
                "font-black uppercase tracking-wide",
                room.nextDayIsContinuous ? "text-violet-800" : "text-sky-700",
              )}
            >
              {room.nextDayIsContinuous
                ? room.nextDayIsToday
                  ? "เช็คอินต่อ (วันนี้)"
                  : "เช็คอินต่อ"
                : "ผู้จองถัดไป"}
            </p>
            <p className="mt-0.5 line-clamp-2 font-semibold text-[#2e2a58]">{room.nextDayGuestLabel}</p>
            {room.nextDayCheckInAt ? (
              <p
                className={cn(
                  "mt-0.5 text-[10px] font-semibold",
                  room.nextDayIsContinuous ? "text-violet-900/75" : "text-sky-800/80",
                )}
              >
                เช็คอิน {new Date(room.nextDayCheckInAt).toLocaleDateString("th-TH")}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {actions}
    </>
  );

  if (selectable) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onRoomSelect?.(room)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onRoomSelect?.(room);
          }
        }}
        className={cardClass}
        aria-label={`ห้อง ${room.roomNumber}`}
      >
        {body}
      </div>
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
  filterOpen = true,
  onFiltersActiveChange,
  onRoomSelect,
  onCheckIn,
  onCheckOut,
  onManageStay,
  onMarkNoShow,
  onAddBooking,
  checkInRoomId,
  noShowRoomId,
  activeRoomId,
}: {
  rooms: HotelResortRoomRow[];
  filterOpen?: boolean;
  onFiltersActiveChange?: (active: boolean) => void;
  onRoomSelect?: (room: HotelResortRoomRow) => void;
  onCheckIn?: (room: HotelResortRoomRow) => void;
  onCheckOut?: (room: HotelResortRoomRow) => void;
  onManageStay?: (room: HotelResortRoomRow) => void;
  onMarkNoShow?: (room: HotelResortRoomRow) => void;
  onAddBooking?: (room: HotelResortRoomRow) => void;
  checkInRoomId?: string | null;
  noShowRoomId?: string | null;
  activeRoomId?: string | null;
}) {
  const [filterStatus, setFilterStatus] = useState<"ALL" | HotelResortRoomStatus>("ALL");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [needsCloseOnly, setNeedsCloseOnly] = useState(false);

  const roomTypes = useMemo(() => {
    const map = new Map<string, string>();
    for (const room of rooms) map.set(room.roomTypeId, room.roomTypeName);
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "th"));
  }, [rooms]);

  const buildings = useMemo(() => {
    const map = new Map<string, string>();
    for (const room of rooms) {
      if (room.buildingId && room.buildingName) map.set(room.buildingId, room.buildingName);
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "th"));
  }, [rooms]);

  const needsCloseCount = useMemo(() => rooms.filter((r) => r.needsClose).length, [rooms]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const rows = rooms.filter((room) => {
      const status = (room.displayStatus ?? room.status) as HotelResortRoomStatus;
      if (filterStatus !== "ALL" && status !== filterStatus) return false;
      if (needsCloseOnly && !room.needsClose) return false;
      if (roomTypeId && room.roomTypeId !== roomTypeId) return false;
      if (buildingId && room.buildingId !== buildingId) return false;
      if (!kw) return true;
      const blob =
        `${room.roomNumber} ${room.roomTypeName} ${room.buildingName ?? ""} ${room.guestLabel ?? ""} ${room.nextDayGuestLabel ?? ""} ${room.upcomingLabel ?? ""} ${room.floor}`.toLowerCase();
      return blob.includes(kw);
    });
    return rows.sort((a, b) => {
      const aClose = a.needsClose ? 1 : 0;
      const bClose = b.needsClose ? 1 : 0;
      if (aClose !== bClose) return bClose - aClose;
      return String(a.roomNumber).localeCompare(String(b.roomNumber), "th", { numeric: true });
    });
  }, [rooms, filterStatus, roomTypeId, buildingId, keyword, needsCloseOnly]);

  const hasActiveFilter =
    filterStatus !== "ALL" ||
    roomTypeId !== "" ||
    buildingId !== "" ||
    keyword.trim() !== "" ||
    needsCloseOnly;

  useEffect(() => {
    onFiltersActiveChange?.(hasActiveFilter);
  }, [hasActiveFilter, onFiltersActiveChange]);

  function resetFilters() {
    setFilterStatus("ALL");
    setRoomTypeId("");
    setBuildingId("");
    setKeyword("");
    setNeedsCloseOnly(false);
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {!filterOpen ? (
        <p className="text-xs font-semibold text-[#8b87b8]">
          ตัวกรองถูกซ่อน{hasActiveFilter ? " · มีเงื่อนไขกรองอยู่" : ""} — กด «แสดงกรอง» เพื่อเปิด
        </p>
      ) : null}

      <div
        id="hotel-resort-room-filter-panel"
        className={cn(
          "rounded-[1.25rem] border border-white/55 bg-gradient-to-br from-white/55 via-white/35 to-[#ecebff]/40 p-3 shadow-sm backdrop-blur-md sm:p-3.5",
          filterOpen ? "block" : "hidden",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <p className="text-xs font-semibold text-[#66638c]">
            แสดง {filtered.length.toLocaleString("th-TH")} จาก {rooms.length.toLocaleString("th-TH")} ห้อง
            {rooms[0]?.asOf
              ? ` · ณ ${new Date(`${rooms[0].asOf}T12:00:00`).toLocaleDateString("th-TH")}`
              : ""}
          </p>
          {hasActiveFilter ? (
            <HotelResortButton
              type="button"
              onClick={resetFilters}
              className={cn(
                appTemplateOutlineButtonClass,
                "min-h-[32px] rounded-xl px-3 text-[11px] font-black text-[#4d47b6]",
              )}
            >
              ล้างตัวกรอง
            </HotelResortButton>
          ) : null}
        </div>

        <div className="mt-2.5 flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-2.5">
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="ค้นหาเลขห้อง ประเภท ชื่อผู้เข้าพัก"
            className={cn(hotelResortFieldClass, "min-h-[40px] min-w-0 w-full py-2 lg:max-w-[16rem] lg:flex-none")}
            aria-label="ค้นหาห้องพัก"
          />
          <div
            className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5"
            role="group"
            aria-label="กรองสถานะห้อง"
          >
            {statuses.map((s) => (
              <HotelResortButton
                key={s.key}
                type="button"
                onClick={() => setFilterStatus(s.key)}
                className={cn(hotelResortFilterChipClass(filterStatus === s.key), "!px-3 !py-1.5")}
                aria-pressed={filterStatus === s.key}
              >
                {s.label}
              </HotelResortButton>
            ))}
            <HotelResortButton
              type="button"
              onClick={() => setNeedsCloseOnly((v) => !v)}
              className={cn(
                hotelResortFilterChipClass(needsCloseOnly),
                "!px-3 !py-1.5",
                (needsCloseOnly || needsCloseCount > 0) &&
                  "!border-rose-400 !bg-rose-100 !text-rose-900",
              )}
              aria-pressed={needsCloseOnly}
            >
              {needsCloseCount > 0 ? `ต้องเคลียร์ (${needsCloseCount})` : "ต้องเคลียร์"}
            </HotelResortButton>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:flex lg:shrink-0 lg:items-center">
            <select
              value={buildingId}
              onChange={(e) => setBuildingId(e.target.value)}
              className={cn(hotelResortFieldClass, "min-h-[40px] py-2 lg:w-[9.5rem]")}
              aria-label="กรองอาคาร"
            >
              <option value="">ทุกอาคาร</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={roomTypeId}
              onChange={(e) => setRoomTypeId(e.target.value)}
              className={cn(hotelResortFieldClass, "min-h-[40px] py-2 lg:w-[10.5rem]")}
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
                  onCheckIn={onCheckIn}
                  onCheckOut={onCheckOut}
                  onManageStay={onManageStay}
                  onMarkNoShow={onMarkNoShow}
                  onAddBooking={onAddBooking}
                  checkInBusy={checkInRoomId === room.id}
                  noShowBusy={noShowRoomId === room.id}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
