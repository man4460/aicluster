"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppIconCheck,
  AppIconClose,
  AppIconToolbarButton,
  AppIconUserX,
  AppSectionHeader,
} from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { scheduledAtLocalFromSlot, type SlotAvailabilityItem } from "@/lib/car-wash/booking-slot-availability";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { CarWashBookingStatusBadge } from "@/systems/car-wash/CarWashBookingStatusBadge";

type BookingRow = {
  id: number;
  phone: string;
  plateNumber: string;
  customerName: string | null;
  scheduledAt: string;
  status: string;
};

type DaySchedulePayload = {
  openTime?: string;
  closeTime?: string;
  slotMinutes?: number;
  isClosed?: boolean;
  slotAvailability?: SlotAvailabilityItem[];
  error?: string;
};

const rowCard =
  "rounded-2xl border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/50";

export function CarWashBookingsClient({
  initialDateKey,
  staffQrLanding = false,
}: {
  initialDateKey?: string;
  staffQrLanding?: boolean;
}) {
  const [dateKey, setDateKey] = useState(initialDateKey ?? bangkokDateKey());
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [bookingDateKey, setBookingDateKey] = useState(dateKey);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotAvailability, setSlotAvailability] = useState<SlotAvailabilityItem[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState("08:00");
  const [scheduleClose, setScheduleClose] = useState("20:00");
  const [scheduleSlotMinutes, setScheduleSlotMinutes] = useState(30);
  const [scheduleClosed, setScheduleClosed] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [patchingId, setPatchingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    setListLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/car-wash/bookings?date=${encodeURIComponent(dateKey)}`, {
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as { bookings?: BookingRow[]; error?: string };
      if (!res.ok) {
        setErr(j.error ?? "โหลดรายการไม่สำเร็จ");
        setBookings([]);
        return;
      }
      setBookings(j.bookings ?? []);
    } finally {
      setListLoading(false);
    }
  }, [dateKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadScheduleForBooking = useCallback(async (dk: string) => {
    setScheduleLoading(true);
    try {
      const res = await fetch(`/api/car-wash/day-schedules?date=${encodeURIComponent(dk)}`, {
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as DaySchedulePayload;
      if (!res.ok) {
        setErr(j.error ?? "โหลดตารางเวลาไม่สำเร็จ");
        setSlotAvailability([]);
        return;
      }
      setScheduleOpen(j.openTime ?? "08:00");
      setScheduleClose(j.closeTime ?? "20:00");
      setScheduleSlotMinutes(j.slotMinutes ?? 30);
      setScheduleClosed(Boolean(j.isClosed));
      const slots = j.slotAvailability ?? [];
      setSlotAvailability(slots);
      setSelectedSlot(slots.find((s) => s.available)?.time ?? "");
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  function openAddModal() {
    setErr(null);
    setMsg(null);
    setPhone("");
    setPlateNumber("");
    setCustomerName("");
    setBookingDateKey(dateKey);
    setSelectedSlot("");
    setAddOpen(true);
    void loadScheduleForBooking(dateKey);
  }

  useEffect(() => {
    if (!addOpen) return;
    void loadScheduleForBooking(bookingDateKey);
  }, [addOpen, bookingDateKey, loadScheduleForBooking]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setErr("กรอกเบอร์อย่างน้อย 9 หลัก");
      return;
    }
    if (scheduleClosed || !selectedSlot) {
      setErr(scheduleClosed ? "วันนี้ปิดรับจอง" : "เลือกช่วงเวลาจากตาราง");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/car-wash/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phone: digits,
          plateNumber: plateNumber.trim() || null,
          customerName: customerName.trim() || null,
          scheduledAtLocal: scheduledAtLocalFromSlot(bookingDateKey, selectedSlot),
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; booking?: BookingRow };
      if (!res.ok) {
        setErr(j.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setMsg("บันทึกคิวแล้ว");
      setAddOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function patchStatus(
    id: number,
    status: "ARRIVED" | "IN_SERVICE" | "COMPLETED" | "NO_SHOW" | "CANCELLED",
  ) {
    setErr(null);
    setPatchingId(id);
    try {
      const res = await fetch(`/api/car-wash/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; booking?: BookingRow };
      if (!res.ok) {
        setErr(j.error ?? "อัปเดตไม่สำเร็จ");
        return;
      }
      if (j.booking) {
        setBookings((prev) => prev.map((b) => (b.id === id ? j.booking! : b)));
      }
    } finally {
      setPatchingId(null);
    }
  }

  const listInner = (
    <>
      {listLoading ? (
        <p className="text-center text-sm text-[#66638c]">กำลังโหลด…</p>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/60 p-6 text-center text-sm text-[#66638c]">
          ไม่มีคิวในวันนี้
        </div>
      ) : (
        <ul className="space-y-2.5">
          {bookings.map((b) => (
            <li key={b.id} className={cn(rowCard, !staffQrLanding && "sm:flex sm:justify-between sm:gap-4")}>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-semibold text-[#2e2a58]">{b.phone}</p>
                {b.plateNumber ? (
                  <p className="mt-0.5 text-xs font-bold uppercase text-[#4d47b6]">{b.plateNumber}</p>
                ) : null}
                <p className="mt-0.5 text-xs text-[#5f5a8a]">{b.customerName?.trim() || "—"}</p>
                <p className="mt-1 text-xs font-medium tabular-nums text-[#4d47b6]">
                  {new Date(b.scheduledAt).toLocaleString("th-TH", {
                    timeZone: "Asia/Bangkok",
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className={cn("mt-3 flex flex-col gap-2", !staffQrLanding && "sm:mt-0 sm:items-end")}>
                <CarWashBookingStatusBadge status={b.status} scheduledAt={b.scheduledAt} />
                {b.status === "SCHEDULED" || b.status === "ARRIVED" || b.status === "IN_SERVICE" ? (
                  <div className="flex justify-end gap-1" role="group" aria-label="อัปเดตสถานะคิว">
                    {b.status === "SCHEDULED" ? (
                      <>
                        <AppIconToolbarButton title="มาแล้ว" ariaLabel="มาแล้ว" disabled={patchingId === b.id} onClick={() => void patchStatus(b.id, "ARRIVED")} className="text-emerald-700">
                          <AppIconCheck className="h-3.5 w-3.5" />
                        </AppIconToolbarButton>
                        <AppIconToolbarButton title="ไม่มา" ariaLabel="ไม่มา" disabled={patchingId === b.id} onClick={() => void patchStatus(b.id, "NO_SHOW")} className="text-amber-800">
                          <AppIconUserX className="h-3.5 w-3.5" />
                        </AppIconToolbarButton>
                        <AppIconToolbarButton title="ยกเลิก" ariaLabel="ยกเลิกคิว" disabled={patchingId === b.id} onClick={() => void patchStatus(b.id, "CANCELLED")}>
                          <AppIconClose className="h-3.5 w-3.5" />
                        </AppIconToolbarButton>
                      </>
                    ) : null}
                    {b.status === "ARRIVED" ? (
                      <>
                        <AppIconToolbarButton title="เริ่มล้าง" ariaLabel="เริ่มล้าง" disabled={patchingId === b.id} onClick={() => void patchStatus(b.id, "IN_SERVICE")}>
                          <AppIconCheck className="h-3.5 w-3.5" />
                        </AppIconToolbarButton>
                        <AppIconToolbarButton title="ยกเลิก" ariaLabel="ยกเลิกคิว" disabled={patchingId === b.id} onClick={() => void patchStatus(b.id, "CANCELLED")}>
                          <AppIconClose className="h-3.5 w-3.5" />
                        </AppIconToolbarButton>
                      </>
                    ) : null}
                    {b.status === "IN_SERVICE" ? (
                      <AppIconToolbarButton title="เสร็จแล้ว" ariaLabel="ล้างเสร็จ" disabled={patchingId === b.id} onClick={() => void patchStatus(b.id, "COMPLETED")}>
                        <AppIconCheck className="h-3.5 w-3.5" />
                      </AppIconToolbarButton>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {err && !addOpen ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p> : null}
      {msg && !addOpen ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{msg}</p> : null}

      <AppDashboardSection tone="violet">
        {staffQrLanding ? (
          <div className="mb-4 flex flex-nowrap items-center justify-between gap-2 border-b border-[#ecebff] pb-3">
            <h2 className="text-base font-bold text-[#2e2a58]">คิวตามวัน</h2>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateKey}
                onChange={(e) => setDateKey(e.target.value)}
                className="app-input min-h-10 rounded-xl px-2.5 py-2 text-sm"
                aria-label="วันที่"
              />
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white"
                aria-label="เพิ่มคิว"
              >
                <span className="text-xl font-bold">+</span>
              </button>
            </div>
          </div>
        ) : (
          <AppSectionHeader
            tone="violet"
            title="คิวตามวัน"
            description="จองล่วงหน้าและอัปเดตสถานะเมื่อลูกค้ามาใช้บริการ"
            className="flex flex-row items-start justify-between gap-3 sm:items-center"
            actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
            action={
              <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
                <input
                  type="date"
                  value={dateKey}
                  onChange={(e) => setDateKey(e.target.value)}
                  className="app-input min-h-[40px] max-w-[11rem] rounded-xl px-2 py-2 text-sm sm:min-h-[44px]"
                  aria-label="วันที่"
                />
                <button
                  type="button"
                  onClick={openAddModal}
                  className="app-btn-primary min-h-[40px] min-w-[40px] rounded-xl px-3 sm:min-h-[44px] sm:min-w-0 sm:px-4"
                  aria-label="เพิ่มคิว"
                >
                  <span className="sm:hidden">+</span>
                  <span className="hidden sm:inline">+ เพิ่มคิว</span>
                </button>
              </div>
            }
          />
        )}
        {listInner}
      </AppDashboardSection>

      <FormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="เพิ่มคิว"
        description="เลือกช่วงจากตารางเวลาร้าน"
        size="lg"
      >
        <form onSubmit={onSave} className="grid gap-3">
          {err ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p> : null}
          <label className="block text-xs font-medium text-[#4d47b6]">
            เบอร์โทร
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
              className="app-input mt-1 min-h-[48px] w-full rounded-xl px-3"
            />
          </label>
          <label className="block text-xs font-medium text-[#4d47b6]">
            ทะเบียน (ไม่บังคับ)
            <input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.slice(0, 64))}
              className="app-input mt-1 min-h-[48px] w-full rounded-xl px-3 uppercase"
            />
          </label>
          <label className="block text-xs font-medium text-[#4d47b6]">
            ชื่อ (ไม่บังคับ)
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value.slice(0, 160))}
              className="app-input mt-1 min-h-[48px] w-full rounded-xl px-3"
            />
          </label>
          <label className="block text-xs font-medium text-[#4d47b6]">
            วันที่จอง
            <input
              type="date"
              value={bookingDateKey}
              onChange={(e) => setBookingDateKey(e.target.value)}
              className="app-input mt-1 min-h-[48px] w-full rounded-xl px-3"
            />
          </label>
          {scheduleLoading ? (
            <p className="text-sm text-[#66638c]">กำลังโหลดตาราง…</p>
          ) : scheduleClosed ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">วันนี้ปิดรับจอง</p>
          ) : (
            <>
              <p className="text-[11px] text-[#8b87ad]">
                {scheduleOpen}–{scheduleClose} · ทุก {scheduleSlotMinutes} นาที
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="listbox" aria-label="เลือกช่วงเวลา">
                {slotAvailability.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    onClick={() => s.available && setSelectedSlot(s.time)}
                    className={cn(
                      "min-h-[44px] rounded-xl border text-sm font-bold tabular-nums",
                      s.available
                        ? selectedSlot === s.time
                          ? "border-[#5b61ff] bg-[#5b61ff] text-white"
                          : "border-violet-200 bg-white text-[#4d47b6]"
                        : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through",
                    )}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button type="button" className="app-btn-soft min-h-[48px] rounded-xl px-4" onClick={() => setAddOpen(false)}>
              ยกเลิก
            </button>
            <button type="submit" disabled={saving} className="app-btn-primary min-h-[48px] rounded-xl px-4 disabled:opacity-50">
              {saving ? "กำลังบันทึก…" : "บันทึกคิว"}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
