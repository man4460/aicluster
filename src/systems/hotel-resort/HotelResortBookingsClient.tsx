"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
  useAppImageLightbox,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { HotelResortButton } from "@/systems/hotel-resort/components/HotelResortButton";
import { HotelResortErrorBanner } from "@/systems/hotel-resort/components/HotelResortErrorBanner";
import {
  HOTEL_BOOKING_ALLOWED,
  HOTEL_BOOKING_STATUS_LABELS,
  HOTEL_PAYMENT_STATUS_LABELS,
} from "@/systems/hotel-resort/lib/booking-status";
import {
  HOTEL_RESORT_BOOKING_DATE_PRESET_LABELS,
  hotelResortBookingNeedsClose,
  hotelResortBookingOverlapsRange,
  hotelResortBookingOverdueLabel,
  hotelResortBookingRangeForPreset,
  hotelResortParseDateInput,
  type HotelResortBookingDatePreset,
} from "@/systems/hotel-resort/lib/booking-filters";
import {
  hotelResortFetchErrorMessage,
  type HotelResortBookingRow,
  type HotelResortRoomRow,
} from "@/systems/hotel-resort/lib/client-data";
import { useHotelResortApiFetch } from "@/systems/hotel-resort/lib/staff-api-fetch";
import {
  hotelResortBookingListClass,
  hotelResortBookingStatusBadgeClass,
  hotelResortCardAccentBarClass,
  hotelResortContentCardClass,
  hotelResortFieldClass,
  hotelResortFormLabelClass,
  hotelResortGradientPriceClass,
  hotelResortInitialAvatarClass,
  hotelResortMetaChipClass,
  hotelResortPaymentStatusBadgeClass,
  hotelResortPlainIconActionClass,
  hotelResortSectionRadiusClass,
  hotelResortSkeletonClass,
} from "@/systems/hotel-resort/lib/ui-tokens";
import { IconAlertTriangle, IconFilter, IconPhone } from "@/systems/hotel-resort/components/HotelResortIcons";
import { IconRowEdit } from "@/systems/asset/components/AssetRowActionIcons";

type HotelResortBookingStatus = "RESERVED" | "CHECKED_IN" | "CHECKED_OUT" | "NO_SHOW" | "CANCELLED";

const BOOKING_ACCENT: Record<HotelResortBookingStatus, "amber" | "indigo" | "emerald" | "slate" | "rose"> = {
  RESERVED: "amber",
  CHECKED_IN: "indigo",
  CHECKED_OUT: "emerald",
  NO_SHOW: "slate",
  CANCELLED: "rose",
};

const DATE_PRESETS: HotelResortBookingDatePreset[] = ["TODAY", "MONTH", "YEAR", "CUSTOM", "ALL"];

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarToneFor(id: string): "violet" | "amber" | "emerald" | "rose" | "sky" {
  const tones: Array<"violet" | "amber" | "emerald" | "rose" | "sky"> = ["violet", "amber", "emerald", "rose", "sky"];
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return tones[sum % tones.length];
}

function FilterChip({
  label,
  active,
  onClick,
  tone = "brand",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: "brand" | "warn";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-[36px] rounded-full border px-3 text-xs font-black transition",
        tone === "warn"
          ? active
            ? "border-amber-400 bg-amber-100 text-amber-900 ring-2 ring-amber-300/50"
            : "border-amber-200/80 bg-amber-50/70 text-amber-800 hover:bg-amber-100/80"
          : active
            ? "border-[#5b61ff]/50 bg-[#ecebff] text-[#3b36a0] ring-2 ring-[#5b61ff]/20"
            : "border-white/60 bg-white/70 text-[#4d47b6] hover:bg-white/90",
      )}
    >
      {label}
    </button>
  );
}

type ManageState = {
  open: boolean;
  booking: HotelResortBookingRow | null;
  statusPick: "" | HotelResortBookingStatus;
  qrUrl: string | null;
  statusBusy: boolean;
  qrBusy: boolean;
  error: string | null;
};

const emptyManage: ManageState = {
  open: false,
  booking: null,
  statusPick: "",
  qrUrl: null,
  statusBusy: false,
  qrBusy: false,
  error: null,
};

export function HotelResortBookingsClient({ refreshNonce = 0 }: { refreshNonce?: number } = {}) {
  const apiFetch = useHotelResortApiFetch();
  const [bookings, setBookings] = useState<HotelResortBookingRow[]>([]);
  const [rooms, setRooms] = useState<HotelResortRoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(true);
  const [datePreset, setDatePreset] = useState<HotelResortBookingDatePreset>("MONTH");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | HotelResortBookingStatus>("");
  const [keyword, setKeyword] = useState("");
  const [needsCloseOnly, setNeedsCloseOnly] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manage, setManage] = useState<ManageState>(emptyManage);
  const slipLb = useAppImageLightbox();

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [roomId, setRoomId] = useState("");
  const [checkInAt, setCheckInAt] = useState("");
  const [checkOutAt, setCheckOutAt] = useState("");
  const [totalBaht, setTotalBaht] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingRes, roomRes] = await Promise.all([
        apiFetch("/api/hotel-resort/bookings?limit=200", { cache: "no-store" }),
        apiFetch("/api/hotel-resort/rooms", { cache: "no-store" }),
      ]);
      if (!bookingRes.ok) throw new Error(await hotelResortFetchErrorMessage(bookingRes));
      if (!roomRes.ok) throw new Error(await hotelResortFetchErrorMessage(roomRes));
      const bookingsJson = (await bookingRes.json()) as { bookings?: HotelResortBookingRow[] };
      const roomsJson = (await roomRes.json()) as { rooms?: HotelResortRoomRow[] };
      setBookings(Array.isArray(bookingsJson.bookings) ? bookingsJson.bookings : []);
      setRooms(Array.isArray(roomsJson.rooms) ? roomsJson.rooms : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void load();
  }, [load, refreshNonce]);

  const activeRange = useMemo(() => {
    if (datePreset === "CUSTOM") {
      const from = hotelResortParseDateInput(dateFrom, false);
      const to = hotelResortParseDateInput(dateTo, true);
      if (!from || !to || from > to) return null;
      return { from, to };
    }
    return hotelResortBookingRangeForPreset(datePreset);
  }, [datePreset, dateFrom, dateTo]);

  const filtersActive = useMemo(() => {
    if (keyword.trim()) return true;
    if (statusFilter) return true;
    if (needsCloseOnly) return true;
    if (datePreset !== "MONTH") return true;
    return false;
  }, [keyword, statusFilter, needsCloseOnly, datePreset]);

  const needsCloseCount = useMemo(() => {
    const now = new Date();
    return bookings.filter((b) => hotelResortBookingNeedsClose(b.status, b.checkInAt, b.checkOutAt, now)).length;
  }, [bookings]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const now = new Date();
    const rows = bookings.filter((b) => {
      if (statusFilter && b.status !== statusFilter) return false;
      if (!hotelResortBookingOverlapsRange(b.checkInAt, b.checkOutAt, activeRange)) return false;
      const overdue = hotelResortBookingNeedsClose(b.status, b.checkInAt, b.checkOutAt, now);
      if (needsCloseOnly && !overdue) return false;
      if (kw) {
        const blob = `${b.guestName} ${b.guestPhone} ${b.roomNumber ?? ""} ${b.roomTypeName ?? ""}`.toLowerCase();
        if (!blob.includes(kw)) return false;
      }
      return true;
    });

    return rows.sort((a, b) => {
      const aOver = hotelResortBookingNeedsClose(a.status, a.checkInAt, a.checkOutAt, now) ? 1 : 0;
      const bOver = hotelResortBookingNeedsClose(b.status, b.checkInAt, b.checkOutAt, now) ? 1 : 0;
      if (aOver !== bOver) return bOver - aOver;
      return new Date(b.checkInAt).getTime() - new Date(a.checkInAt).getTime();
    });
  }, [bookings, keyword, statusFilter, activeRange, needsCloseOnly]);

  function selectDatePreset(next: HotelResortBookingDatePreset) {
    setDatePreset(next);
    if (next !== "CUSTOM") {
      setDateFrom("");
      setDateTo("");
    }
  }

  function resetFilters() {
    setKeyword("");
    setStatusFilter("");
    setNeedsCloseOnly(false);
    setDatePreset("MONTH");
    setDateFrom("");
    setDateTo("");
  }

  async function createReservation() {
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
      setGuestName("");
      setGuestPhone("");
      setRoomId("");
      setCheckInAt("");
      setCheckOutAt("");
      setTotalBaht("");
      setNote("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  function openManage(booking: HotelResortBookingRow, preferClose = false) {
    const status = booking.status as HotelResortBookingStatus;
    const allowed = HOTEL_BOOKING_ALLOWED[status] ?? [];
    let statusPick: "" | HotelResortBookingStatus = "";
    if (preferClose) {
      if (status === "RESERVED") {
        if (allowed.includes("NO_SHOW")) statusPick = "NO_SHOW";
        else if (allowed.includes("CANCELLED")) statusPick = "CANCELLED";
      } else if (status === "CHECKED_IN" && allowed.includes("CHECKED_OUT")) {
        statusPick = "CHECKED_OUT";
      }
    }
    setManage({ ...emptyManage, open: true, booking, statusPick });
  }

  function closeManage() {
    if (manage.statusBusy || manage.qrBusy) return;
    setManage(emptyManage);
  }

  async function applyManageStatus() {
    if (!manage.booking || !manage.statusPick) return;
    setManage((prev) => ({ ...prev, statusBusy: true, error: null }));
    try {
      const res = await apiFetch(`/api/hotel-resort/bookings/${manage.booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: manage.statusPick }),
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      await load();
      setManage(emptyManage);
    } catch (e) {
      setManage((prev) => ({
        ...prev,
        statusBusy: false,
        error: e instanceof Error ? e.message : "เปลี่ยนสถานะไม่สำเร็จ",
      }));
    }
  }

  async function generateBillQr() {
    if (!manage.booking) return;
    setManage((prev) => ({ ...prev, qrBusy: true, error: null }));
    const due = Math.round(Math.max(0, manage.booking.totalBaht - manage.booking.amountPaidBaht));
    if (due <= 0) {
      setManage((prev) => ({ ...prev, qrBusy: false, error: "ไม่มียอดค้างชำระ" }));
      return;
    }
    try {
      const res = await apiFetch("/api/hotel-resort/promptpay-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: due }),
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      const j = (await res.json()) as { qrDataUrl?: string | null; configured?: boolean };
      if (!j.configured || !j.qrDataUrl) {
        setManage((prev) => ({
          ...prev,
          qrBusy: false,
          error: "ยังไม่ได้ตั้งค่าเบอร์พร้อมเพย์ — ไปที่ตั้งค่าที่พักก่อน",
        }));
        return;
      }
      setManage((prev) => ({ ...prev, qrUrl: j.qrDataUrl ?? null, qrBusy: false }));
    } catch (e) {
      setManage((prev) => ({
        ...prev,
        qrBusy: false,
        error: e instanceof Error ? e.message : "สร้าง QR ไม่สำเร็จ",
      }));
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {error ? <HotelResortErrorBanner message={error} /> : null}
      <AppDashboardSection tone="violet" className={hotelResortSectionRadiusClass}>
        <AppSectionHeader
          tone="violet"
          title="การจองห้องพัก"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <HotelResortButton
                type="button"
                onClick={() => setFilterOpen((v) => !v)}
                aria-expanded={filterOpen}
                aria-controls="hotel-resort-booking-filter-panel"
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
                onClick={() => setCreateOpen(true)}
                className="app-btn-primary min-h-[40px] min-w-[40px] rounded-[1rem] px-0 font-black sm:min-w-0 sm:px-4"
                aria-label="เพิ่มการจอง"
              >
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">+ เพิ่มการจอง</span>
              </HotelResortButton>
            </div>
          }
        />

        <div
          id="hotel-resort-booking-filter-panel"
          className={cn("mt-3 space-y-3", filterOpen ? "block" : "hidden")}
        >
          <div className="flex flex-wrap gap-2" role="group" aria-label="กรองช่วงเวลาการจอง">
            {DATE_PRESETS.map((preset) => (
              <FilterChip
                key={preset}
                label={HOTEL_RESORT_BOOKING_DATE_PRESET_LABELS[preset]}
                active={datePreset === preset}
                onClick={() => selectDatePreset(preset)}
              />
            ))}
            <FilterChip
              label={needsCloseCount > 0 ? `ต้องปิดงาน (${needsCloseCount})` : "ต้องปิดงาน"}
              active={needsCloseOnly}
              tone="warn"
              onClick={() => setNeedsCloseOnly((v) => !v)}
            />
          </div>

          {datePreset === "CUSTOM" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="min-w-0">
                <span className={hotelResortFormLabelClass}>จากวันที่</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={cn(hotelResortFieldClass, "mt-1")}
                />
              </label>
              <label className="min-w-0">
                <span className={hotelResortFormLabelClass}>ถึงวันที่</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={cn(hotelResortFieldClass, "mt-1")}
                />
              </label>
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-3">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ค้นหา ชื่อ/เบอร์/ห้อง"
              className={hotelResortFieldClass}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "" | HotelResortBookingStatus)}
              className={hotelResortFieldClass}
            >
              <option value="">ทุกสถานะ</option>
              {(Object.keys(HOTEL_BOOKING_STATUS_LABELS) as HotelResortBookingStatus[]).map((s) => (
                <option key={s} value={s}>
                  {HOTEL_BOOKING_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <HotelResortButton
              type="button"
              onClick={resetFilters}
              className={cn(appTemplateOutlineButtonClass, "min-h-[44px] rounded-[1rem] text-xs font-black text-[#4d47b6]")}
            >
              ล้างตัวกรอง
            </HotelResortButton>
          </div>
        </div>

        {!filterOpen ? (
          <p className="mt-3 text-xs font-semibold text-[#8b87b8]">
            ตัวกรองถูกซ่อน{filtersActive ? " · มีเงื่อนไขกรองอยู่" : ""} — กด «แสดงกรอง» เพื่อเปิด
          </p>
        ) : null}

        {loading ? (
          <div className={`mt-4 h-28 ${hotelResortSkeletonClass}`} aria-hidden />
        ) : filtered.length === 0 ? (
          <AppEmptyState className="mt-4">ยังไม่มีรายการจอง</AppEmptyState>
        ) : (
          <ul className={hotelResortBookingListClass}>
            {filtered.map((b) => {
              const status = b.status as HotelResortBookingStatus;
              const payment = b.paymentStatus as keyof typeof HOTEL_PAYMENT_STATUS_LABELS;
              const accent = BOOKING_ACCENT[status];
              const overdue = hotelResortBookingNeedsClose(b.status, b.checkInAt, b.checkOutAt);

              return (
                <li
                  key={b.id}
                  className={cn(
                    hotelResortContentCardClass,
                    "relative overflow-hidden pl-5 pr-12 sm:pl-6 sm:pr-14",
                    overdue && "ring-2 ring-amber-400/70",
                  )}
                >
                  <span className={hotelResortCardAccentBarClass(overdue ? "amber" : accent)} aria-hidden />

                  <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1 sm:right-3 sm:top-3">
                    <button
                      type="button"
                      className={hotelResortPlainIconActionClass}
                      onClick={() => openManage(b, overdue)}
                      aria-label={`จัดการการจอง ${b.guestName}`}
                      title="จัดการการจอง"
                    >
                      <IconRowEdit className="h-5 w-5" aria-hidden />
                    </button>
                    <div className="hidden text-right md:block">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8b87b8]">ยอดรวม</p>
                      <p className={cn("text-lg font-black tabular-nums leading-tight", hotelResortGradientPriceClass)}>
                        ฿{b.totalBaht.toLocaleString("th-TH")}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className={hotelResortInitialAvatarClass(avatarToneFor(b.id))}>
                      {getInitials(b.guestName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-base font-black tracking-tight text-[#1e1b4b]">{b.guestName}</p>
                        <span className={hotelResortBookingStatusBadgeClass(status)}>
                          {HOTEL_BOOKING_STATUS_LABELS[status]}
                        </span>
                        <span className={hotelResortPaymentStatusBadgeClass(payment as "UNPAID" | "PARTIAL" | "PAID")}>
                          {HOTEL_PAYMENT_STATUS_LABELS[payment] ?? b.paymentStatus}
                        </span>
                      </div>

                      {overdue ? (
                        <div
                          className="mt-2 flex flex-wrap items-center gap-2 rounded-[1rem] border border-amber-300/80 bg-amber-50/95 px-2.5 py-1.5 text-xs font-bold text-amber-950"
                          role="status"
                        >
                          <IconAlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
                          <span className="min-w-0 flex-1">{hotelResortBookingOverdueLabel(status)}</span>
                          <HotelResortButton
                            type="button"
                            onClick={() => openManage(b, true)}
                            className="min-h-[32px] rounded-lg border border-amber-400/70 bg-white/90 px-2.5 text-[11px] font-black text-amber-900"
                          >
                            ปิดงาน
                          </HotelResortButton>
                        </div>
                      ) : null}

                      <div className="mt-1.5 flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <span className={hotelResortMetaChipClass}>
                            <IconPhone className="h-3 w-3" />
                            {b.guestPhone}
                          </span>
                          <p className="text-xs font-medium text-[#66638c]">
                            ห้อง {b.roomNumber ?? "—"} · {b.roomTypeName ?? "—"}
                          </p>
                          <p className="text-xs font-medium text-[#8b87b8]">
                            {new Date(b.checkInAt).toLocaleDateString("th-TH")} –{" "}
                            {new Date(b.checkOutAt).toLocaleDateString("th-TH")}
                          </p>
                          {b.amountPaidBaht > 0 ? (
                            <p className="text-xs font-semibold text-[#4d47b6]">
                              ชำระแล้ว ฿{b.amountPaidBaht.toLocaleString("th-TH")}
                              {b.amountPaidBaht < b.totalBaht
                                ? ` · ค้าง ฿${Math.max(0, b.totalBaht - b.amountPaidBaht).toLocaleString("th-TH")}`
                                : ""}
                            </p>
                          ) : null}
                          {b.paymentSlipUrl?.trim() ? (
                            <div className="pt-1">
                              <AppImageThumb
                                src={b.paymentSlipUrl}
                                alt={`สลิป ${b.guestName}`}
                                onOpen={() => slipLb.open(b.paymentSlipUrl!.trim())}
                                className="h-14 w-14"
                              />
                            </div>
                          ) : null}
                        </div>
                        <div className="shrink-0 text-right md:hidden">
                          <p className={cn("text-lg font-black tabular-nums", hotelResortGradientPriceClass)}>
                            ฿{b.totalBaht.toLocaleString("th-TH")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AppDashboardSection>

      <FormModal
        open={createOpen}
        onClose={() => !saving && setCreateOpen(false)}
        title="สร้างการจอง"
        footer={
          <FormModalFooterActions
            onCancel={() => setCreateOpen(false)}
            onSubmit={() => void createReservation()}
            submitLabel="บันทึก"
            loading={saving}
          />
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input className={hotelResortFieldClass} value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="ชื่อลูกค้า" />
          <input className={hotelResortFieldClass} value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="เบอร์โทร" />
          <select className={hotelResortFieldClass} value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            <option value="">เลือกห้อง</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                ห้อง {r.roomNumber} ({r.roomTypeName})
              </option>
            ))}
          </select>
          <input className={hotelResortFieldClass} type="number" min={0} value={totalBaht} onChange={(e) => setTotalBaht(e.target.value)} placeholder="ยอดรวม (บาท)" />
          <input className={hotelResortFieldClass} type="date" value={checkInAt} onChange={(e) => setCheckInAt(e.target.value)} />
          <input className={hotelResortFieldClass} type="date" value={checkOutAt} onChange={(e) => setCheckOutAt(e.target.value)} />
          <textarea className={cn(hotelResortFieldClass, "sm:col-span-2 min-h-[80px]")} value={note} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุ" />
        </div>
      </FormModal>

      <FormModal
        open={manage.open}
        onClose={closeManage}
        title="จัดการการจอง"
        description={manage.booking ? manage.booking.guestName : undefined}
      >
        {manage.booking
          ? (() => {
              const mStatus = manage.booking.status as HotelResortBookingStatus;
              const mPayment = manage.booking.paymentStatus as keyof typeof HOTEL_PAYMENT_STATUS_LABELS;
              const mAllowed = HOTEL_BOOKING_ALLOWED[mStatus] ?? [];
              const due = Math.max(0, manage.booking.totalBaht - manage.booking.amountPaidBaht);
              const overdue = hotelResortBookingNeedsClose(
                manage.booking.status,
                manage.booking.checkInAt,
                manage.booking.checkOutAt,
              );

              return (
                <div className="space-y-4">
                  {overdue ? (
                    <div
                      className="flex items-start gap-2 rounded-[1rem] border border-amber-300/80 bg-amber-50/95 px-3 py-2.5 text-sm font-bold text-amber-950"
                      role="alert"
                    >
                      <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                      <span>{hotelResortBookingOverdueLabel(mStatus)}</span>
                    </div>
                  ) : null}

                  <div className={cn(hotelResortContentCardClass, "relative pl-5")}>
                    <span className={hotelResortCardAccentBarClass(BOOKING_ACCENT[mStatus])} aria-hidden />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={hotelResortBookingStatusBadgeClass(mStatus)}>
                        {HOTEL_BOOKING_STATUS_LABELS[mStatus]}
                      </span>
                      <span className={hotelResortPaymentStatusBadgeClass(mPayment as "UNPAID" | "PARTIAL" | "PAID")}>
                        {HOTEL_PAYMENT_STATUS_LABELS[mPayment] ?? manage.booking.paymentStatus}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#66638c]">
                      ห้อง {manage.booking.roomNumber ?? "—"} · {manage.booking.roomTypeName ?? "—"}
                    </p>
                    <p className="text-xs font-medium text-[#8b87b8]">
                      {new Date(manage.booking.checkInAt).toLocaleDateString("th-TH")} –{" "}
                      {new Date(manage.booking.checkOutAt).toLocaleDateString("th-TH")}
                    </p>
                    <p className={cn("mt-2 text-xl font-black tabular-nums", hotelResortGradientPriceClass)}>
                      ฿{manage.booking.totalBaht.toLocaleString("th-TH")}
                    </p>
                    {manage.booking.amountPaidBaht > 0 ? (
                      <p className="mt-1 text-sm font-semibold text-[#4d47b6]">
                        ชำระแล้ว ฿{manage.booking.amountPaidBaht.toLocaleString("th-TH")}
                        {due > 0 ? ` · คงเหลือ ฿${due.toLocaleString("th-TH")}` : ""}
                      </p>
                    ) : null}
                    {manage.booking.paymentSlipUrl?.trim() ? (
                      <div className="mt-3 space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8b87b8]">
                          สลิปชำระ / มัดจำ
                        </p>
                        <AppImageThumb
                          src={manage.booking.paymentSlipUrl}
                          alt={`สลิป ${manage.booking.guestName}`}
                          onOpen={() => slipLb.open(manage.booking!.paymentSlipUrl!.trim())}
                          className="h-20 w-20"
                        />
                      </div>
                    ) : null}
                  </div>

                  {mAllowed.length > 0 ? (
                    <div>
                      <p className={hotelResortFormLabelClass}>เปลี่ยนสถานะ</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <select
                          className={cn(hotelResortFieldClass, "min-w-0 flex-1 py-2")}
                          value={manage.statusPick}
                          onChange={(e) =>
                            setManage((prev) => ({
                              ...prev,
                              statusPick: e.target.value as "" | HotelResortBookingStatus,
                              error: null,
                            }))
                          }
                        >
                          <option value="">เลือกสถานะใหม่…</option>
                          {mAllowed.map((s) => (
                            <option key={s} value={s}>
                              {HOTEL_BOOKING_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        <HotelResortButton
                          type="button"
                          disabled={!manage.statusPick || manage.statusBusy}
                          onClick={() => void applyManageStatus()}
                          className={cn("app-btn-primary min-h-[44px] shrink-0 rounded-[1rem] px-4 text-sm font-black", "disabled:opacity-50")}
                        >
                          {manage.statusBusy ? "กำลังบันทึก…" : "บันทึก"}
                        </HotelResortButton>
                      </div>
                      {overdue && mStatus === "RESERVED" ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {mAllowed.includes("NO_SHOW") ? (
                            <HotelResortButton
                              type="button"
                              disabled={manage.statusBusy}
                              onClick={() =>
                                setManage((prev) => ({ ...prev, statusPick: "NO_SHOW", error: null }))
                              }
                              className={cn(appTemplateOutlineButtonClass, "min-h-[40px] rounded-[1rem] px-3 text-xs font-black text-amber-900")}
                            >
                              ไม่มา
                            </HotelResortButton>
                          ) : null}
                          {mAllowed.includes("CANCELLED") ? (
                            <HotelResortButton
                              type="button"
                              disabled={manage.statusBusy}
                              onClick={() =>
                                setManage((prev) => ({ ...prev, statusPick: "CANCELLED", error: null }))
                              }
                              className={cn(appTemplateOutlineButtonClass, "min-h-[40px] rounded-[1rem] px-3 text-xs font-black text-rose-700")}
                            >
                              ยกเลิก
                            </HotelResortButton>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div>
                    <p className={hotelResortFormLabelClass}>บิล & QR พร้อมเพย์</p>
                    <p className="mt-2 text-sm font-semibold text-[#2e2a58]">
                      คงเหลือ: <span className={hotelResortGradientPriceClass}>฿{due.toLocaleString("th-TH")}</span>
                    </p>
                    <HotelResortButton
                      type="button"
                      disabled={manage.qrBusy || due <= 0}
                      onClick={() => void generateBillQr()}
                      className={cn(
                        appTemplateOutlineButtonClass,
                        "mt-3 min-h-[44px] rounded-[1rem] px-4 text-sm font-black text-[#4d47b6]",
                        "disabled:opacity-50",
                      )}
                    >
                      {manage.qrBusy ? "กำลังสร้าง QR…" : "สร้าง QR พร้อมเพย์"}
                    </HotelResortButton>
                    {manage.qrUrl ? (
                      <img
                        src={manage.qrUrl}
                        alt="PromptPay QR"
                        className="mx-auto mt-3 w-full max-w-xs rounded-2xl border border-white/60 bg-white/70 p-2"
                      />
                    ) : null}
                  </div>

                  {manage.error ? <p className="text-sm font-semibold text-rose-600">{manage.error}</p> : null}
                </div>
              );
            })()
          : null}
      </FormModal>

      <AppImageLightbox src={slipLb.src} onClose={slipLb.close} alt="สลิปชำระเงิน" />
    </div>
  );
}
