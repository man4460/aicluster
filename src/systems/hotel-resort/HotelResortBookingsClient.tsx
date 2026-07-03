"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
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
  hotelResortFetchErrorMessage,
  type HotelResortBookingRow,
  type HotelResortRoomRow,
} from "@/systems/hotel-resort/lib/client-data";
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
  hotelResortSkeletonClass,
} from "@/systems/hotel-resort/lib/ui-tokens";
import { IconFilter, IconPhone } from "@/systems/hotel-resort/components/HotelResortIcons";
import { IconRowEdit } from "@/systems/asset/components/AssetRowActionIcons";

type HotelResortBookingStatus = "RESERVED" | "CHECKED_IN" | "CHECKED_OUT" | "NO_SHOW" | "CANCELLED";

const BOOKING_ACCENT: Record<HotelResortBookingStatus, "amber" | "indigo" | "emerald" | "slate" | "rose"> = {
  RESERVED: "amber",
  CHECKED_IN: "indigo",
  CHECKED_OUT: "emerald",
  NO_SHOW: "slate",
  CANCELLED: "rose",
};

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

export function HotelResortBookingsClient() {
  const [bookings, setBookings] = useState<HotelResortBookingRow[]>([]);
  const [rooms, setRooms] = useState<HotelResortRoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"" | HotelResortBookingStatus>("");
  const [keyword, setKeyword] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manage, setManage] = useState<ManageState>(emptyManage);

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
        fetch("/api/hotel-resort/bookings?limit=200", { cache: "no-store", credentials: "include" }),
        fetch("/api/hotel-resort/rooms", { cache: "no-store", credentials: "include" }),
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
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter && b.status !== statusFilter) return false;
      if (!kw) return true;
      const blob = `${b.guestName} ${b.guestPhone} ${b.roomNumber ?? ""} ${b.roomTypeName ?? ""}`.toLowerCase();
      return blob.includes(kw);
    });
  }, [bookings, keyword, statusFilter]);

  async function createReservation() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/hotel-resort/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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

  function openManage(booking: HotelResortBookingRow) {
    setManage({ ...emptyManage, open: true, booking });
  }

  function closeManage() {
    if (manage.statusBusy || manage.qrBusy) return;
    setManage(emptyManage);
  }

  async function applyManageStatus() {
    if (!manage.booking || !manage.statusPick) return;
    setManage((prev) => ({ ...prev, statusBusy: true, error: null }));
    try {
      const res = await fetch(`/api/hotel-resort/bookings/${manage.booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
      const res = await fetch("/api/hotel-resort/promptpay-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="การจองห้องพัก"
          description={`ทั้งหมด ${filtered.length.toLocaleString("th-TH")} รายการ`}
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <HotelResortButton
                type="button"
                onClick={() => setMobileFilterOpen((v) => !v)}
                className={cn(appTemplateOutlineButtonClass, "relative min-h-[40px] min-w-[40px] px-0 sm:hidden", (statusFilter || keyword) && "border-[#5b61ff]/40 bg-[#ecebff]/80")}
                aria-label="เปิดตัวกรอง"
              >
                <IconFilter className="h-5 w-5" />
              </HotelResortButton>
              <HotelResortButton
                type="button"
                onClick={() => setCreateOpen(true)}
                className="app-btn-primary min-h-[40px] min-w-[40px] rounded-xl px-0 font-black sm:min-w-0 sm:px-4"
                aria-label="เพิ่มการจอง"
              >
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">+ เพิ่มการจอง</span>
              </HotelResortButton>
            </div>
          }
        />

        <div className={cn("mt-3 grid gap-2 sm:grid sm:grid-cols-3", mobileFilterOpen ? "grid" : "hidden sm:grid")}>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="ค้นหา ชื่อ/เบอร์/ห้อง" className={hotelResortFieldClass} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "" | HotelResortBookingStatus)} className={hotelResortFieldClass}>
            <option value="">ทุกสถานะ</option>
            {(Object.keys(HOTEL_BOOKING_STATUS_LABELS) as HotelResortBookingStatus[]).map((s) => (
              <option key={s} value={s}>{HOTEL_BOOKING_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <HotelResortButton type="button" onClick={() => { setKeyword(""); setStatusFilter(""); }} className={cn(appTemplateOutlineButtonClass, "min-h-[44px] rounded-xl text-xs font-black text-[#4d47b6]")}>
            ล้างตัวกรอง
          </HotelResortButton>
        </div>

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

              return (
                <li key={b.id} className={cn(hotelResortContentCardClass, "relative overflow-hidden pl-5 pr-12 sm:pl-6 sm:pr-14")}>
                  <span className={hotelResortCardAccentBarClass(accent)} aria-hidden />

                  <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1 sm:right-3 sm:top-3">
                    <button
                      type="button"
                      className={hotelResortPlainIconActionClass}
                      onClick={() => openManage(b)}
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
                            {new Date(b.checkInAt).toLocaleDateString("th-TH")} – {new Date(b.checkOutAt).toLocaleDateString("th-TH")}
                          </p>
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
        footer={<FormModalFooterActions onCancel={() => setCreateOpen(false)} onSubmit={() => void createReservation()} submitLabel="บันทึก" loading={saving} />}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input className={hotelResortFieldClass} value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="ชื่อลูกค้า" />
          <input className={hotelResortFieldClass} value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="เบอร์โทร" />
          <select className={hotelResortFieldClass} value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            <option value="">เลือกห้อง</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>ห้อง {r.roomNumber} ({r.roomTypeName})</option>
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
        {manage.booking ? (() => {
          const mStatus = manage.booking.status as HotelResortBookingStatus;
          const mPayment = manage.booking.paymentStatus as keyof typeof HOTEL_PAYMENT_STATUS_LABELS;
          const mAllowed = HOTEL_BOOKING_ALLOWED[mStatus] ?? [];
          const due = Math.max(0, manage.booking.totalBaht - manage.booking.amountPaidBaht);

          return (
            <div className="space-y-4">
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
                  {new Date(manage.booking.checkInAt).toLocaleDateString("th-TH")} – {new Date(manage.booking.checkOutAt).toLocaleDateString("th-TH")}
                </p>
                <p className={cn("mt-2 text-xl font-black tabular-nums", hotelResortGradientPriceClass)}>
                  ฿{manage.booking.totalBaht.toLocaleString("th-TH")}
                </p>
              </div>

              {mAllowed.length > 0 ? (
                <div>
                  <p className={hotelResortFormLabelClass}>เปลี่ยนสถานะ</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      className={cn(hotelResortFieldClass, "min-w-0 flex-1 py-2")}
                      value={manage.statusPick}
                      onChange={(e) => setManage((prev) => ({ ...prev, statusPick: e.target.value as "" | HotelResortBookingStatus, error: null }))}
                    >
                      <option value="">เลือกสถานะใหม่…</option>
                      {mAllowed.map((s) => (
                        <option key={s} value={s}>{HOTEL_BOOKING_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                    <HotelResortButton
                      type="button"
                      disabled={!manage.statusPick || manage.statusBusy}
                      onClick={() => void applyManageStatus()}
                      className={cn("app-btn-primary min-h-[44px] shrink-0 rounded-xl px-4 text-sm font-black", "disabled:opacity-50")}
                    >
                      {manage.statusBusy ? "กำลังบันทึก…" : "บันทึก"}
                    </HotelResortButton>
                  </div>
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
                  className={cn(appTemplateOutlineButtonClass, "mt-3 min-h-[44px] rounded-xl px-4 text-sm font-black text-[#4d47b6]", "disabled:opacity-50")}
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
        })() : null}
      </FormModal>
    </div>
  );
}
