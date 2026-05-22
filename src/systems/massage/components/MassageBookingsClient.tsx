"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppIconCheck,
  AppIconClose,
  AppIconToolbarButton,
  AppIconUserX,
  AppSectionHeader,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { MassageDashboardBackLink } from "@/systems/massage/components/MassageDashboardBackLink";
import { MassageModalPortal } from "@/systems/massage/components/MassageModalPortal";
import {
  massageCardSurfaceRadiusClass,
  massageEmptyStateDashedPlainClass,
  massageIconToolbarGroupClass,
  massageInlineAlertErrorClass,
  massageInlineAlertSuccessClass,
  massageListRowCardClass,
  massageMutedLoadingNoticeClass,
  massageModalBackdropClass,
  massageModalCloseBtnClass,
  massageModalHeaderClass,
  massageModalPanelLgClass,
  massageModalSubtitleClass,
  massageModalTitleClass,
  massagePageStackClass,
  massageSectionActionsRowClass,
  massageSectionFirstClass,
} from "@/systems/massage/components/massage-ui-tokens";
import {
  scheduledAtLocalFromSlot,
  type SlotAvailabilityItem,
} from "@/lib/massage/booking-slot-availability";
import { MassageBookingStatusBadge } from "./MassageBookingStatusBadge";

type BookingRow = {
  id: number;
  phone: string;
  customerName: string | null;
  scheduledAt: string;
  status: string;
  massageCustomerId: number | null;
};

type DaySchedulePayload = {
  date?: string;
  openTime?: string;
  closeTime?: string;
  slotMinutes?: number;
  isClosed?: boolean;
  slotAvailability?: SlotAvailabilityItem[];
  availableCount?: number;
  error?: string;
};

export function MassageBookingsClient({
  initialDateKey,
  showDashboardBackLink = true,
  /** หน้า QR พนักงาน — การ์ดคิวเรียงแนวตั้งเหมือนมือถือ (ไม่จัดแถวซ้าย-ขวาบนจอใหญ่) */
  staffQrLanding = false,
}: {
  initialDateKey: string;
  /** ปิดเมื่อหน้าพนักงานมีปุ่มกลับแดชบอร์ดอยู่แล้ว */
  showDashboardBackLink?: boolean;
  staffQrLanding?: boolean;
}) {
  const [dateKey, setDateKey] = useState(initialDateKey);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [massageCustomerId, setMassageCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [bookingDateKey, setBookingDateKey] = useState(initialDateKey);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotAvailability, setSlotAvailability] = useState<SlotAvailabilityItem[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState("10:00");
  const [scheduleClose, setScheduleClose] = useState("21:00");
  const [scheduleSlotMinutes, setScheduleSlotMinutes] = useState(60);
  const [scheduleClosed, setScheduleClosed] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [patchingId, setPatchingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    setListLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/massage/bookings?date=${encodeURIComponent(dateKey)}`, {
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

  const closeAddModal = useCallback(() => {
    setAddOpen(false);
    setErr(null);
    setMsg(null);
  }, []);

  useEffect(() => {
    if (!addOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAddModal();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [addOpen, closeAddModal]);

  const loadScheduleForBooking = useCallback(async (dk: string) => {
    setScheduleLoading(true);
    try {
      const res = await fetch(`/api/massage/day-schedules?date=${encodeURIComponent(dk)}`, {
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as DaySchedulePayload;
      if (!res.ok) {
        setErr(j.error ?? "โหลดตารางเวลาไม่สำเร็จ");
        setSlotAvailability([]);
        return;
      }
      setScheduleOpen(j.openTime ?? "10:00");
      setScheduleClose(j.closeTime ?? "21:00");
      setScheduleSlotMinutes(j.slotMinutes ?? 60);
      setScheduleClosed(Boolean(j.isClosed));
      const slots = j.slotAvailability ?? [];
      setSlotAvailability(slots);
      const firstFree = slots.find((s) => s.available);
      setSelectedSlot(firstFree?.time ?? "");
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  function openAddModal() {
    setErr(null);
    setMsg(null);
    setPhone("");
    setMassageCustomerId(null);
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

  async function onSearchPhone() {
    setErr(null);
    setMsg(null);
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setErr("กรอกเบอร์อย่างน้อย 9 หลักก่อนค้นหา");
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/massage/customers/search?phone=${encodeURIComponent(digits)}`, {
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as {
        customer?: { id: number; name: string | null; phone: string } | null;
        error?: string;
      };
      if (!res.ok) {
        setErr(j.error ?? "ค้นหาไม่สำเร็จ");
        return;
      }
      if (j.customer) {
        setMassageCustomerId(j.customer.id);
        setCustomerName(j.customer.name?.trim() || "");
        setMsg("พบลูกค้าในระบบ — ชื่อถูกเติมให้แล้ว (แก้ไขได้)");
      } else {
        setMassageCustomerId(null);
        setMsg("ยังไม่มีลูกค้าเบอร์นี้ — กรอกชื่อได้ถ้าต้องการ");
      }
    } finally {
      setSearchLoading(false);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setErr("กรอกเบอร์อย่างน้อย 9 หลัก");
      return;
    }
    if (scheduleClosed) {
      setErr("วันนี้ปิดรับจอง — ไปที่แท็บ「ตารางเวลา」เพื่อเปิดร้าน");
      return;
    }
    if (!selectedSlot) {
      setErr("เลือกช่วงเวลาจากตาราง (ช่องสีม่วง = ว่าง)");
      return;
    }
    const localKey = scheduledAtLocalFromSlot(bookingDateKey, selectedSlot);
    setSaving(true);
    try {
      const res = await fetch("/api/massage/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phone: digits,
          massageCustomerId,
          customerName: customerName.trim() || null,
          scheduledAtLocal: localKey,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; booking?: BookingRow };
      if (!res.ok) {
        setErr(j.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setMsg("บันทึกคิวแล้ว");
      if (j.booking) {
        const bk = j.booking;
        const bkLocalKey = new Date(bk.scheduledAt).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
        if (bkLocalKey === dateKey) {
          setBookings((prev) => [...prev, bk].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)));
        }
      } else {
        await load();
      }
      setSelectedSlot("");
      setAddOpen(false);
      if (bookingDateKey === dateKey) {
        await load();
      }
      setPhone("");
      setMassageCustomerId(null);
      setCustomerName("");
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
      const res = await fetch(`/api/massage/bookings/${id}`, {
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

  return (
    <div className={massagePageStackClass}>
      {err && !addOpen ? <p className={massageInlineAlertErrorClass}>{err}</p> : null}
      {msg && !addOpen ? <p className={massageInlineAlertSuccessClass}>{msg}</p> : null}

      <section className={massageSectionFirstClass} aria-label="คิวตามวัน">
        {staffQrLanding ?
          <div className="flex min-w-0 flex-nowrap items-center justify-between gap-2 border-b border-[#ecebff] pb-3">
            <h2 className="shrink-0 text-base font-bold leading-tight text-[#2e2a58] sm:text-lg">คิวตามวัน</h2>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <input
                type="date"
                value={dateKey}
                onChange={(e) => setDateKey(e.target.value)}
                aria-label="วันที่"
                className="app-input min-h-10 max-w-[min(100%,11.25rem)] flex-1 rounded-xl px-2.5 py-2 text-sm tabular-nums sm:max-w-[11.5rem] sm:flex-none"
              />
              <button
                type="button"
                suppressHydrationWarning
                onClick={openAddModal}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-md ring-1 ring-white/40 transition hover:opacity-95 active:scale-95"
                aria-label="เพิ่มคิว"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        : <AppSectionHeader
            tone="violet"
            title="คิวตามวัน"
            description="เลือกวันที่แล้วดูหรือเพิ่มคิว"
            actionWrapClassName="w-full min-w-0 sm:flex-1 sm:basis-0"
            action={
              <div className="flex w-full max-w-full flex-wrap items-end gap-2 sm:gap-3">
                <label className="mr-auto min-w-0 text-xs font-medium text-[#4d47b6]">
                  วันที่
                  <input
                    type="date"
                    value={dateKey}
                    onChange={(e) => setDateKey(e.target.value)}
                    className="app-input ml-0 mt-1 block min-h-[44px] w-full max-w-[11.5rem] rounded-[1.25rem] px-3 py-2 text-sm sm:ml-2 sm:mt-0 sm:inline-block sm:w-auto"
                  />
                </label>
                <div className={cn(massageSectionActionsRowClass, "shrink-0 justify-end")}>
                  {showDashboardBackLink ? <MassageDashboardBackLink /> : null}
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={openAddModal}
                    className={`app-btn-primary min-h-[44px] ${massageCardSurfaceRadiusClass} px-4 py-2.5 text-sm font-semibold`}
                  >
                    เพิ่มคิว
                  </button>
                </div>
              </div>
            }
          />
        }
        {listLoading ? (
          <p className={`${massageMutedLoadingNoticeClass} text-center`}>กำลังโหลด…</p>
        ) : bookings.length === 0 ? (
          <div className={`${massageEmptyStateDashedPlainClass} text-center text-sm text-[#66638c]`}>
            ไม่มีคิวในวันนี้
          </div>
        ) : (
          <ul className="space-y-2.5">
            {bookings.map((b) => (
              <li
                key={b.id}
                className={cn(
                  massageListRowCardClass,
                  !staffQrLanding && "sm:flex sm:items-start sm:justify-between sm:gap-4",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold leading-snug text-[#2e2a58]">{b.phone}</p>
                  <p className="mt-0.5 text-xs text-[#5f5a8a]">{b.customerName?.trim() || "—"}</p>
                  <p className="mt-1 text-xs font-medium tabular-nums text-[#4d47b6] sm:text-sm">
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
                <div
                  className={cn(
                    "mt-3 flex flex-col items-stretch gap-2",
                    !staffQrLanding && "sm:mt-0 sm:min-w-[140px] sm:items-end",
                  )}
                >
                  <MassageBookingStatusBadge status={b.status} scheduledAt={new Date(b.scheduledAt)} />
                  {b.status === "SCHEDULED" ||
                  b.status === "ARRIVED" ||
                  b.status === "IN_SERVICE" ? (
                    <div
                      className={cn(massageIconToolbarGroupClass, "justify-end")}
                      role="group"
                      aria-label="อัปเดตสถานะคิว"
                    >
                      {b.status === "SCHEDULED" ? (
                        <>
                          <AppIconToolbarButton
                            title="มาแล้ว"
                            ariaLabel="มาแล้ว"
                            disabled={patchingId === b.id}
                            onClick={() => void patchStatus(b.id, "ARRIVED")}
                            className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                          >
                            <AppIconCheck className="h-3.5 w-3.5" />
                          </AppIconToolbarButton>
                          <AppIconToolbarButton
                            title="ไม่มา"
                            ariaLabel="ไม่มา"
                            disabled={patchingId === b.id}
                            onClick={() => void patchStatus(b.id, "NO_SHOW")}
                            className="text-amber-800 hover:bg-amber-50"
                          >
                            <AppIconUserX className="h-3.5 w-3.5" />
                          </AppIconToolbarButton>
                          <AppIconToolbarButton
                            title="ยกเลิกคิว"
                            ariaLabel="ยกเลิกคิว"
                            disabled={patchingId === b.id}
                            onClick={() => void patchStatus(b.id, "CANCELLED")}
                            className="text-slate-600 hover:bg-slate-100"
                          >
                            <AppIconClose className="h-3.5 w-3.5" />
                          </AppIconToolbarButton>
                        </>
                      ) : null}
                      {b.status === "ARRIVED" ? (
                        <>
                          <AppIconToolbarButton
                            title="เริ่มนวด"
                            ariaLabel="เริ่มนวด"
                            disabled={patchingId === b.id}
                            onClick={() => void patchStatus(b.id, "IN_SERVICE")}
                            className="text-violet-700 hover:bg-violet-50"
                          >
                            <AppIconCheck className="h-3.5 w-3.5" />
                          </AppIconToolbarButton>
                          <AppIconToolbarButton
                            title="ยกเลิกคิว"
                            ariaLabel="ยกเลิกคิว"
                            disabled={patchingId === b.id}
                            onClick={() => void patchStatus(b.id, "CANCELLED")}
                            className="text-slate-600 hover:bg-slate-100"
                          >
                            <AppIconClose className="h-3.5 w-3.5" />
                          </AppIconToolbarButton>
                        </>
                      ) : null}
                      {b.status === "IN_SERVICE" ? (
                        <AppIconToolbarButton
                          title="นวดเสร็จ"
                          ariaLabel="นวดเสร็จ"
                          disabled={patchingId === b.id}
                          onClick={() => void patchStatus(b.id, "COMPLETED")}
                          className="text-emerald-700 hover:bg-emerald-50"
                        >
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
      </section>

      {addOpen ? (
        <MassageModalPortal>
          <div className={massageModalBackdropClass} role="presentation" onClick={() => closeAddModal()}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="massage-add-booking-title"
              className={massageModalPanelLgClass}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={massageModalHeaderClass}>
                <div className="min-w-0">
                  <h2 id="massage-add-booking-title" className={massageModalTitleClass}>
                    เพิ่มคิว
                  </h2>
                  <p className={massageModalSubtitleClass}>เลือกช่วงจากตารางเวลาร้าน — จองได้เฉพาะช่องว่าง</p>
                </div>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => closeAddModal()}
                  className={massageModalCloseBtnClass}
                  aria-label="ปิด"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={onSave} className="grid gap-3 px-5 py-5">
              {err ? (
                <p className="rounded-[1.25rem] bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100">{err}</p>
              ) : null}
              {msg ? (
                <p className="rounded-[1.25rem] bg-emerald-50 px-3 py-2 text-sm text-emerald-900 ring-1 ring-emerald-100">
                  {msg}
                </p>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="block flex-1 text-xs font-medium text-[#4d47b6]">
                  เบอร์โทร
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 15));
                      setMassageCustomerId(null);
                    }}
                    placeholder="0812345678"
                    className="app-input mt-1 min-h-[48px] w-full rounded-[1.25rem] px-3 text-base"
                  />
                </label>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => void onSearchPhone()}
                  disabled={searchLoading}
                  className={`app-btn-soft min-h-[48px] shrink-0 ${massageCardSurfaceRadiusClass} px-4 text-sm font-semibold disabled:opacity-50`}
                >
                  {searchLoading ? "กำลังค้นหา…" : "ค้นหาในระบบ"}
                </button>
              </div>
              <label className="block text-xs font-medium text-[#4d47b6]">
                ชื่อ (ไม่บังคับ)
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value.slice(0, 100))}
                  className="app-input mt-1 min-h-[48px] w-full rounded-[1.25rem] px-3 text-base"
                  placeholder="ชื่อลูกค้า"
                />
              </label>
              <div className="space-y-3">
                <label className="block text-xs font-medium text-[#4d47b6]">
                  วันที่จอง
                  <input
                    type="date"
                    value={bookingDateKey}
                    onChange={(e) => setBookingDateKey(e.target.value)}
                    className="app-input mt-1 min-h-[48px] w-full rounded-[1.25rem] px-3 text-base"
                  />
                </label>
                {scheduleLoading ? (
                  <p className={massageMutedLoadingNoticeClass}>กำลังโหลดตารางเวลา…</p>
                ) : scheduleClosed ? (
                  <p className="rounded-[1.25rem] bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-100">
                    วันนี้ปิดรับจอง — ตั้งค่าได้ที่แท็บ「ตารางเวลา」ในแดชบอร์ด
                  </p>
                ) : slotAvailability.length === 0 ? (
                  <p className="rounded-[1.25rem] bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-100">
                    ยังไม่มีช่วงเวลา — ไปที่แท็บ「ตารางเวลา」ตั้งเวลาเปิด–ปิดก่อน
                  </p>
                ) : (
                  <>
                    <p className="text-[11px] text-[#8b87ad]">
                      ตาราง {scheduleOpen}–{scheduleClose} · ทุก {scheduleSlotMinutes} นาที · เวลาไทย
                    </p>
                    <div
                      className="grid grid-cols-3 gap-2 sm:grid-cols-4"
                      role="listbox"
                      aria-label="เลือกช่วงเวลานัด"
                    >
                      {slotAvailability.map((s) => {
                        const active = selectedSlot === s.time;
                        return (
                          <button
                            key={s.time}
                            type="button"
                            disabled={!s.available}
                            role="option"
                            aria-selected={active}
                            aria-label={
                              s.available
                                ? `จองเวลา ${s.time}`
                                : `เวลา ${s.time} มีคิวแล้ว`
                            }
                            onClick={() => s.available && setSelectedSlot(s.time)}
                            className={cn(
                              "min-h-[44px] rounded-xl border px-2 py-2 text-sm font-bold tabular-nums transition",
                              s.available
                                ? active
                                  ? "border-[#5b61ff] bg-[#5b61ff] text-white shadow-md"
                                  : "border-violet-200/80 bg-white/80 text-[#4d47b6] hover:border-[#5b61ff]/50 hover:bg-violet-50"
                                : "cursor-not-allowed border-slate-200/80 bg-slate-100/80 text-slate-400 line-through",
                            )}
                          >
                            {s.time}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-[#8b87ad]">
                      ว่าง {slotAvailability.filter((s) => s.available).length} / {slotAvailability.length} ช่วง
                      {selectedSlot ? ` · เลือก ${selectedSlot}` : ""}
                    </p>
                  </>
                )}
              </div>
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => closeAddModal()}
                  className={`app-btn-soft min-h-[48px] ${massageCardSurfaceRadiusClass} px-4 py-3 text-sm font-semibold text-[#2e2a58]`}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  suppressHydrationWarning
                  disabled={saving}
                  className={`app-btn-primary min-h-[48px] ${massageCardSurfaceRadiusClass} px-4 py-3 text-sm font-semibold disabled:opacity-50`}
                >
                  {saving ? "กำลังบันทึก…" : "บันทึกคิว"}
                </button>
              </div>
            </form>
            </div>
          </div>
        </MassageModalPortal>
      ) : null}
    </div>
  );
}
