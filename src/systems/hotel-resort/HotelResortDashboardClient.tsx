"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { HotelResortButton } from "@/systems/hotel-resort/components/HotelResortButton";
import { HotelResortCheckOutModal } from "@/systems/hotel-resort/components/HotelResortCheckOutModal";
import { HotelResortErrorBanner } from "@/systems/hotel-resort/components/HotelResortErrorBanner";
import { HotelResortRoomGrid } from "@/systems/hotel-resort/components/HotelResortRoomGrid";
import { HotelResortStayManageModal } from "@/systems/hotel-resort/components/HotelResortStayManageModal";
import { HotelResortStatCard } from "@/systems/hotel-resort/components/HotelResortStatCard";
import { HotelResortStatsPanel } from "@/systems/hotel-resort/components/HotelResortStatsPanel";
import {
  IconBed,
  IconBuilding,
  IconDoorOpen,
  IconAlertTriangle,
  IconFilter,
  IconRefresh,
} from "@/systems/hotel-resort/components/HotelResortIcons";
import {
  hotelResortFetchErrorMessage,
  type HotelResortDashboardSummary,
  type HotelResortRoomRow,
} from "@/systems/hotel-resort/lib/client-data";
import { hotelResortAsOfInputValue } from "@/systems/hotel-resort/lib/room-occupancy";
import { useHotelResortApiFetch } from "@/systems/hotel-resort/lib/staff-api-fetch";
import {
  hotelResortFieldClass,
  hotelResortSectionRadiusClass,
  hotelResortSkeletonClass,
  hotelResortStatsGridClass,
} from "@/systems/hotel-resort/lib/ui-tokens";

const emptySummary: HotelResortDashboardSummary = {
  totalRooms: 0,
  vacant: 0,
  occupied: 0,
  reserved: 0,
  maintenance: 0,
  arrivalsToday: 0,
  departuresToday: 0,
  inHouse: 0,
};

function todayIsoDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysIsoDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function checkInHref(room: HotelResortRoomRow): string {
  const params = new URLSearchParams();
  params.set("roomId", room.id);
  if (room.bookingId) params.set("bookingId", room.bookingId);
  return `/dashboard/hotel-resort/check-in?${params.toString()}`;
}

export function HotelResortDashboardClient({
  onRequestCheckIn,
  refreshNonce = 0,
}: {
  /** พอร์ทัลพนักงาน — ไม่ push ไป /dashboard/... */
  onRequestCheckIn?: (room: HotelResortRoomRow) => void;
  refreshNonce?: number;
} = {}) {
  const router = useRouter();
  const apiFetch = useHotelResortApiFetch();
  const [summary, setSummary] = useState<HotelResortDashboardSummary>(emptySummary);
  const [rooms, setRooms] = useState<HotelResortRoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filtersActive, setFiltersActive] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [checkOutRoom, setCheckOutRoom] = useState<HotelResortRoomRow | null>(null);
  const [manageStayRoom, setManageStayRoom] = useState<HotelResortRoomRow | null>(null);
  const [noShowRoomId, setNoShowRoomId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [roomId, setRoomId] = useState("");
  const [checkInAt, setCheckInAt] = useState(todayIsoDate);
  const [checkOutAt, setCheckOutAt] = useState(() => addDaysIsoDate(1));
  const [totalBaht, setTotalBaht] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ผังแดชบอร์ดอ้างอิง «ตอนนี้» เสมอ — ไม่มีตัวกรองช่วงเวลา
      const asOf = hotelResortAsOfInputValue(new Date());
      const qs = new URLSearchParams({ asOf });
      const [summaryRes, roomsRes] = await Promise.all([
        apiFetch(`/api/hotel-resort/dashboard-summary?${qs.toString()}`, {
          cache: "no-store",
        }),
        apiFetch(`/api/hotel-resort/rooms?${qs.toString()}`, { cache: "no-store" }),
      ]);
      if (!summaryRes.ok) throw new Error(await hotelResortFetchErrorMessage(summaryRes));
      if (!roomsRes.ok) throw new Error(await hotelResortFetchErrorMessage(roomsRes));
      const summaryJson = (await summaryRes.json()) as HotelResortDashboardSummary;
      const roomsJson = (await roomsRes.json()) as { rooms?: HotelResortRoomRow[] };
      setSummary(summaryJson);
      setRooms(Array.isArray(roomsJson.rooms) ? roomsJson.rooms : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดแดชบอร์ดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void load();
  }, [load, refreshNonce]);

  const roomCounts = useMemo(() => {
    const counts = {
      vacant: 0,
      occupied: 0,
      reserved: 0,
      maintenance: 0,
      needsClear: 0,
      total: rooms.length,
    };
    for (const r of rooms) {
      const s = (r.displayStatus ?? r.status) as string;
      if (r.needsClose) counts.needsClear += 1;
      if (s === "VACANT") counts.vacant += 1;
      else if (s === "OCCUPIED") counts.occupied += 1;
      else if (s === "RESERVED") counts.reserved += 1;
      else if (s === "MAINTENANCE") counts.maintenance += 1;
    }
    return counts;
  }, [rooms]);

  const onCheckIn = useCallback(
    (room: HotelResortRoomRow) => {
      if (onRequestCheckIn) {
        onRequestCheckIn(room);
        return;
      }
      router.push(checkInHref(room));
    },
    [router, onRequestCheckIn],
  );

  const onMarkNoShow = useCallback(
    async (room: HotelResortRoomRow) => {
      if (!room.bookingId) return;
      const ok = window.confirm(
        `ยืนยันปิดงานห้อง ${room.roomNumber} เป็น「ไม่มา」เพื่อเปิดห้องรับแขกใหม่?`,
      );
      if (!ok) return;
      setNoShowRoomId(room.id);
      setError(null);
      try {
        const res = await apiFetch(`/api/hotel-resort/bookings/${room.bookingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "NO_SHOW" }),
        });
        if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "ปิดงานไม่สำเร็จ");
      } finally {
        setNoShowRoomId(null);
      }
    },
    [apiFetch, load],
  );

  const openCreateBooking = useCallback((room: HotelResortRoomRow) => {
    setRoomId(room.id);
    setGuestName("");
    setGuestPhone("");
    setCheckInAt(todayIsoDate());
    setCheckOutAt(addDaysIsoDate(1));
    setTotalBaht(String(room.basePriceBaht || ""));
    setNote("");
    setCreateOpen(true);
  }, []);

  const createReservation = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch("/api/hotel-resort/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          roomId: roomId || null,
          checkInAt,
          checkOutAt,
          totalBaht: Math.round(Number(totalBaht || 0)),
          note: note.trim() || null,
          isWalkIn: false,
        }),
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      setCreateOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกการจองไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }, [apiFetch, checkInAt, checkOutAt, guestName, guestPhone, load, note, roomId, totalBaht]);

  const selectedRoom = rooms.find((r) => r.id === roomId);
  const vacantRooms = rooms.filter(
    (r) => (r.displayStatus ?? r.status) === "VACANT" || r.id === roomId,
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {error ? <HotelResortErrorBanner message={error} /> : null}

      <HotelResortStatsPanel title="แดชบอร์ด" gridClassName={hotelResortStatsGridClass}>
        <HotelResortStatCard
          title="ห้องทั้งหมด"
          value={(roomCounts.total || summary.totalRooms).toLocaleString("th-TH")}
          tone="slate"
          icon={<IconBuilding className="h-4 w-4" />}
        />
        <HotelResortStatCard
          title="ว่าง"
          value={(rooms.length ? roomCounts.vacant : summary.vacant).toLocaleString("th-TH")}
          tone="emerald"
          icon={<IconDoorOpen className="h-4 w-4" />}
        />
        <HotelResortStatCard
          title="เข้าพัก"
          value={(rooms.length ? roomCounts.occupied : summary.occupied).toLocaleString("th-TH")}
          tone="indigo"
          icon={<IconBed className="h-4 w-4" />}
        />
        <HotelResortStatCard
          title="ต้องเคลียร์"
          value={roomCounts.needsClear.toLocaleString("th-TH")}
          tone={roomCounts.needsClear > 0 ? "rose" : "amber"}
          icon={<IconAlertTriangle className="h-4 w-4" />}
        />
      </HotelResortStatsPanel>

      <AppDashboardSection tone="violet" className={hotelResortSectionRadiusClass}>
        <AppSectionHeader
          tone="violet"
          title="ผังห้องพัก"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <HotelResortButton
                type="button"
                onClick={() => setFilterOpen((v) => !v)}
                aria-expanded={filterOpen}
                aria-controls="hotel-resort-room-filter-panel"
                aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 px-0 text-xs font-black text-[#4d47b6] sm:min-w-0 sm:px-3",
                  filterOpen && "border-[#5b61ff]/45 bg-[#ecebff]/90 ring-2 ring-[#5b61ff]/20",
                  filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
                )}
              >
                <IconFilter className="h-5 w-5 shrink-0" />
                <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                {filtersActive ? (
                  <span
                    className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#5b61ff] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
                    aria-hidden
                  />
                ) : null}
              </HotelResortButton>
              <HotelResortButton
                type="button"
                onClick={() => void load()}
                disabled={loading}
                aria-busy={loading}
                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-[1rem] border border-white/55 bg-white/75 px-2.5 py-2 text-sm font-semibold text-[#5b61ff] hover:bg-white/90 disabled:opacity-50 sm:min-w-0 sm:px-3.5"
                aria-label="รีเฟรชข้อมูลห้องพัก"
              >
                <IconRefresh className={cn("h-5 w-5 sm:mr-1.5", loading && "animate-spin")} />
                <span className="hidden sm:inline">รีเฟรช</span>
              </HotelResortButton>
            </div>
          }
        />

        {rooms.length === 0 && !loading ? (
          <AppEmptyState className="mt-4">ยังไม่มีห้องพักในระบบ</AppEmptyState>
        ) : loading && rooms.length === 0 ? (
          <div className={`mt-4 h-32 ${hotelResortSkeletonClass}`} aria-hidden />
        ) : (
          <div className="mt-4">
            <HotelResortRoomGrid
              rooms={rooms}
              filterOpen={filterOpen}
              onFiltersActiveChange={setFiltersActive}
              onCheckIn={onCheckIn}
              onCheckOut={setCheckOutRoom}
              onManageStay={setManageStayRoom}
              onMarkNoShow={(room) => void onMarkNoShow(room)}
              onAddBooking={openCreateBooking}
              noShowRoomId={noShowRoomId}
            />
          </div>
        )}
      </AppDashboardSection>

      <HotelResortCheckOutModal
        open={Boolean(checkOutRoom)}
        room={checkOutRoom}
        onClose={() => setCheckOutRoom(null)}
        onDone={() => void load()}
      />

      <HotelResortStayManageModal
        open={Boolean(manageStayRoom)}
        room={manageStayRoom}
        onClose={() => setManageStayRoom(null)}
        onDone={() => void load()}
      />

      <FormModal
        open={createOpen}
        onClose={() => !saving && setCreateOpen(false)}
        title="สร้างการจอง"
        description={
          selectedRoom ? `ห้อง ${selectedRoom.roomNumber} · ${selectedRoom.roomTypeName}` : undefined
        }
        footer={
          <FormModalFooterActions
            onCancel={() => setCreateOpen(false)}
            onSubmit={() => void createReservation()}
            submitLabel="บันทึกการจอง"
            loading={saving}
            submitDisabled={!guestName.trim() || !guestPhone.trim() || !roomId || !checkInAt || !checkOutAt}
          />
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            className={hotelResortFieldClass}
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="ชื่อลูกค้า"
            aria-label="ชื่อลูกค้า"
          />
          <input
            className={hotelResortFieldClass}
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            placeholder="เบอร์โทร"
            aria-label="เบอร์โทร"
          />
          <select
            className={hotelResortFieldClass}
            value={roomId}
            onChange={(e) => {
              const nextId = e.target.value;
              setRoomId(nextId);
              const next = rooms.find((r) => r.id === nextId);
              if (next) setTotalBaht(String(next.basePriceBaht || ""));
            }}
            aria-label="เลือกห้อง"
          >
            <option value="">เลือกห้อง</option>
            {vacantRooms.map((r) => (
              <option key={r.id} value={r.id}>
                ห้อง {r.roomNumber} ({r.roomTypeName})
              </option>
            ))}
          </select>
          <input
            className={hotelResortFieldClass}
            type="number"
            min={0}
            value={totalBaht}
            onChange={(e) => setTotalBaht(e.target.value)}
            placeholder="ยอดรวม (บาท)"
            aria-label="ยอดรวม"
          />
          <input
            className={hotelResortFieldClass}
            type="date"
            value={checkInAt}
            onChange={(e) => setCheckInAt(e.target.value)}
            aria-label="วันเช็คอิน"
          />
          <input
            className={hotelResortFieldClass}
            type="date"
            value={checkOutAt}
            onChange={(e) => setCheckOutAt(e.target.value)}
            aria-label="วันเช็คเอาต์"
          />
          <textarea
            className={cn(hotelResortFieldClass, "min-h-[80px] sm:col-span-2")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="หมายเหตุ"
            aria-label="หมายเหตุ"
          />
        </div>
      </FormModal>
    </div>
  );
}
