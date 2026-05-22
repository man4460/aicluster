"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { scheduledAtLocalFromSlot } from "@/lib/car-wash/booking-slot-availability";
import { carWashStatusLabelTh, normalizeCarWashServiceStatus } from "@/lib/car-wash/service-status";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { useMounted } from "@/lib/use-mounted";
import { FormModal } from "@/components/ui/FormModal";
import { AppPublicCheckInGlassPage, appPublicCheckInGlassCardClass } from "@/components/app-templates";
import {
  CarWashPublicSlotPicker,
  type PublicSlotItem,
} from "@/systems/car-wash/CarWashPublicSlotPicker";
import type { WashBundle } from "@/systems/car-wash/car-wash-service";

export type CarWashPublicVisitRow = {
  id: number;
  visit_at: string;
  service_status: string;
  package_name: string;
  plate_number: string;
  bundle_id: number | null;
  final_price: number;
};

type UpcomingBooking = {
  id: number;
  status: string;
  dateLabel: string;
  timeLabel: string;
};

type PortalSection = "book" | "package";

type SlotsPayload = {
  date?: string;
  openTime?: string;
  closeTime?: string;
  slotMinutes?: number;
  isClosed?: boolean;
  slotAvailability?: PublicSlotItem[];
  error?: string;
};

function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 9) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return d;
}

function isVisitOpenInLane(statusRaw: string): boolean {
  const s = normalizeCarWashServiceStatus(statusRaw);
  return s !== "PAID";
}

function PortalInteractiveSkeleton() {
  return (
    <>
      <div className={appPublicCheckInGlassCardClass} aria-hidden>
        <div className="flex items-stretch gap-2 px-5 py-5 sm:px-6">
          <div className="h-[52px] min-w-0 flex-1 animate-pulse rounded-2xl bg-white/50" />
          <div className="h-[52px] w-[52px] shrink-0 animate-pulse rounded-2xl bg-white/50" />
        </div>
      </div>
      <div className="h-12 animate-pulse rounded-2xl bg-white/30" aria-hidden />
      <div className={appPublicCheckInGlassCardClass} aria-hidden>
        <div className="space-y-3 px-5 py-5 sm:px-6">
          <div className="h-4 w-32 animate-pulse rounded bg-white/40" />
          <div className="h-12 animate-pulse rounded-2xl bg-white/50" />
          <div className="h-12 animate-pulse rounded-2xl bg-white/50" />
        </div>
      </div>
      <div className="h-[52px] animate-pulse rounded-2xl bg-white/40" aria-hidden />
    </>
  );
}

export function CarWashCustomerPortalClient({
  ownerId,
  trialSessionId,
}: {
  ownerId?: string;
  trialSessionId?: string;
}) {
  const mounted = useMounted();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [bundles, setBundles] = useState<WashBundle[]>([]);
  const [recentVisits, setRecentVisits] = useState<CarWashPublicVisitRow[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [section, setSection] = useState<PortalSection>("book");
  const [selectedBundleId, setSelectedBundleId] = useState<number | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [laneVisitAckId, setLaneVisitAckId] = useState<number | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [plateInput, setPlateInput] = useState("");
  const [bookingDateKey, setBookingDateKey] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotAvailability, setSlotAvailability] = useState<PublicSlotItem[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState("08:00");
  const [scheduleClose, setScheduleClose] = useState("20:00");
  const [scheduleSlotMinutes, setScheduleSlotMinutes] = useState(30);
  const [scheduleClosed, setScheduleClosed] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookMsg, setBookMsg] = useState<string | null>(null);

  const queryDigits = useMemo(() => query.replace(/\D/g, ""), [query]);
  const queryPlate = useMemo(
    () => query.trim().toLowerCase().replace(/[^0-9a-zA-Zก-๙]/g, ""),
    [query],
  );

  const selected = useMemo(
    () => bundles.find((b) => b.id === selectedBundleId) ?? null,
    [bundles, selectedBundleId],
  );

  const primaryCustomer = bundles[0] ?? null;
  const customerBundleSummary = selected ?? bundles[0] ?? null;

  const phoneForBook = useMemo(() => {
    if (queryDigits.length >= 9) return queryDigits;
    const fromBundle = primaryCustomer?.customer_phone?.replace(/\D/g, "") ?? "";
    return fromBundle.length >= 9 ? fromBundle : "";
  }, [queryDigits, primaryCustomer?.customer_phone]);

  const phoneOk = phoneForBook.length >= 9;
  const hasBundles = bundles.length > 0;
  const showActions = phoneOk || hasBundles;

  const openLaneVisit = useMemo(() => {
    for (const v of recentVisits) {
      if (isVisitOpenInLane(v.service_status)) return v;
    }
    return null;
  }, [recentVisits]);

  useEffect(() => {
    setLaneVisitAckId(null);
  }, [openLaneVisit?.id]);

  useEffect(() => {
    setBookingDateKey(bangkokDateKey());
  }, []);

  const laneConfirmed = openLaneVisit != null && laneVisitAckId === openLaneVisit.id;
  const historyPreview = useMemo(() => recentVisits.slice(0, 6), [recentVisits]);

  const canPay =
    Boolean(selected) &&
    Boolean(openLaneVisit) &&
    laneConfirmed &&
    Boolean(selected?.is_active) &&
    (selected?.used_uses ?? 0) < (selected?.total_uses ?? 0) &&
    !checkInLoading;

  const loadSlots = useCallback(
    async (dk: string) => {
      if (!dk || !ownerId) return;
      setScheduleLoading(true);
      try {
        const res = await fetch(
          `/api/car-wash/public/slots?ownerId=${encodeURIComponent(ownerId)}&date=${encodeURIComponent(dk)}`,
        );
        const j = (await res.json().catch(() => ({}))) as SlotsPayload;
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
        const firstFree = slots.find((s) => s.available);
        setSelectedSlot(firstFree?.time ?? "");
      } finally {
        setScheduleLoading(false);
      }
    },
    [ownerId],
  );

  useEffect(() => {
    if (section !== "book" || !phoneOk || !bookingDateKey) return;
    void loadSlots(bookingDateKey);
  }, [section, phoneOk, bookingDateKey, loadSlots]);

  async function runLookup(
    raw: string,
    options?: { keepMessage?: boolean },
  ): Promise<{ ok: boolean; hasBundles: boolean }> {
    setErr(null);
    if (!options?.keepMessage) {
      setMsg(null);
      setBookMsg(null);
    }
    if (!ownerId) {
      setErr("ไม่พบข้อมูลเจ้าของร้าน");
      return { ok: false, hasBundles: false };
    }
    const res = await fetch("/api/car-wash/public/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId, query: raw, trialSessionId: trialSessionId ?? null }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      bundles?: WashBundle[];
      recent_visits?: CarWashPublicVisitRow[];
      upcoming_bookings?: {
        id: number;
        status: string;
        date_label: string;
        time_label: string;
      }[];
    };
    if (!res.ok) {
      setErr(data.error || "ค้นหาไม่สำเร็จ");
      if (!options?.keepMessage) {
        setBundles([]);
        setRecentVisits([]);
        setUpcomingBookings([]);
        setSelectedBundleId(null);
      }
      return { ok: false, hasBundles: false };
    }

    const found = data.bundles ?? [];
    setUpcomingBookings(
      (data.upcoming_bookings ?? []).map((b) => ({
        id: b.id,
        status: b.status,
        dateLabel: b.date_label,
        timeLabel: b.time_label,
      })),
    );
    setRecentVisits(Array.isArray(data.recent_visits) ? data.recent_visits : []);
    setHistoryModalOpen(false);

    if (found.length === 0) {
      setBundles([]);
      setSelectedBundleId(null);
      return { ok: true, hasBundles: false };
    }

    setBundles(found);
    const firstActive = found.find((b) => b.is_active && b.used_uses < b.total_uses) ?? found[0] ?? null;
    setSelectedBundleId(firstActive?.id ?? null);
    if (!plateInput.trim() && firstActive?.plate_number) {
      setPlateInput(firstActive.plate_number);
    }
    if (!customerName.trim() && firstActive?.customer_name) {
      setCustomerName(firstActive.customer_name);
    }
    return { ok: true, hasBundles: true };
  }

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const raw = query.trim();
    if (queryDigits.length < 9 && queryPlate.length < 2) {
      setErr("กรอกเบอร์โทรอย่างน้อย 9 หลัก หรือทะเบียนรถอย่างน้อย 2 ตัวอักษร");
      return;
    }
    setLoading(true);
    setErr(null);
    setBookMsg(null);
    try {
      const result = await runLookup(raw);
      if (!result.ok) return;
      if (!result.hasBundles) {
        if (queryDigits.length >= 9) {
          setSection("book");
        } else {
          setErr("ไม่พบแพ็กเกจ — จองคิวได้เมื่อกรอกเบอร์โทร 9 หลักขึ้นไป");
          setSection("book");
        }
        return;
      }
      setSection("package");
    } finally {
      setLoading(false);
    }
  }

  async function onBook() {
    setBookMsg(null);
    setErr(null);
    if (!phoneOk) {
      setErr("กรอกเบอร์โทรอย่างน้อย 9 หลักเพื่อจองคิว");
      return;
    }
    if (scheduleClosed) {
      setErr("วันนี้ปิดรับจอง — เลือกวันอื่น");
      return;
    }
    if (!selectedSlot) {
      setErr("เลือกช่วงเวลาจากตาราง");
      return;
    }
    const localKey = scheduledAtLocalFromSlot(bookingDateKey, selectedSlot);
    const plate =
      plateInput.trim() ||
      primaryCustomer?.plate_number?.trim() ||
      queryPlate ||
      null;
    setBookLoading(true);
    try {
      if (!ownerId) {
        setErr("ไม่พบข้อมูลเจ้าของร้าน");
        return;
      }
      const res = await fetch("/api/car-wash/public/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          phone: phoneForBook,
          plateNumber: plate,
          scheduledAtLocal: localKey,
          customerName: customerName.trim() || null,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
        booking?: { dateLabel: string; timeLabel: string };
      };
      if (!res.ok) {
        setErr(j.error ?? "จองไม่สำเร็จ");
        return;
      }
      if (j.ok && j.booking) {
        setBookMsg(`จองคิวแล้ว — ${j.booking.dateLabel} เวลา ${j.booking.timeLabel} น.`);
        void loadSlots(bookingDateKey);
        await runLookup(query.trim(), { keepMessage: true });
      }
    } finally {
      setBookLoading(false);
    }
  }

  async function onCheckIn() {
    setErr(null);
    setMsg(null);
    if (!selectedBundleId || !selected) {
      setErr("เลือกแพ็กเกจก่อน");
      return;
    }
    if (!openLaneVisit) {
      setErr("ยังไม่มีข้อมูลคิวในลาน — รอร้านรับรถก่อน");
      return;
    }
    if (!laneConfirmed) {
      setErr("แตะการ์ดคิวในลานด้านบนเพื่อยืนยัน ก่อนชำระ");
      return;
    }
    if (!selected.is_active || selected.used_uses >= selected.total_uses) {
      setErr("แพ็กเกจนี้หมดสิทธิ์หรือไม่พร้อมใช้งาน");
      return;
    }
    setCheckInLoading(true);
    try {
      if (!ownerId) {
        setErr("ไม่พบข้อมูลเจ้าของร้าน");
        return;
      }
      const res = await fetch("/api/car-wash/public/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, bundleId: selectedBundleId, trialSessionId: trialSessionId ?? null }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
        bundle?: WashBundle;
      };
      if (!res.ok || !data.ok || !data.bundle) {
        setErr(data.error || "ไม่สามารถหักสิทธิ์ได้");
        return;
      }
      const consumed = data.bundle;
      const remain = Math.max(0, consumed.total_uses - consumed.used_uses);
      setBundles((prev) => prev.map((b) => (b.id === consumed.id ? consumed : b)));
      setMsg(`ชำระและหักสิทธิ์แล้ว — คงเหลือ ${remain} ครั้ง จาก ${consumed.total_uses} ครั้ง`);
      await runLookup(query.trim(), { keepMessage: true });
    } finally {
      setCheckInLoading(false);
    }
  }

  return (
    <AppPublicCheckInGlassPage>
      <div className="relative mx-auto max-w-md space-y-4">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/70 bg-gradient-to-br from-white/80 to-violet-100/60 shadow-[0_8px_24px_-8px_rgba(91,97,255,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/70">
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7 text-[#5b61ff]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M19 17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3l2-2h4l2 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z" />
              <circle cx="12" cy="11" r="2.5" />
              <path d="m8 19 4-2 4 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1e1b4b]">คาร์แคร์</h1>
          <p className="mt-1 text-sm text-[#6b6894]">จองคิวล้างรถ หรือใช้แพ็กเหมา</p>
        </div>

        {!mounted ? (
          <PortalInteractiveSkeleton />
        ) : (
          <>
            <div className={appPublicCheckInGlassCardClass}>
              <div className="px-5 py-5 sm:px-6">
                <form onSubmit={onSearch} className="flex items-stretch gap-2">
                  <div className="relative min-w-0 flex-1">
                    {!query ? (
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9490c0]">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                          <circle cx="11" cy="11" r="7" />
                          <path d="m20 20-3.5-3.5" />
                        </svg>
                      </span>
                    ) : null}
                    <input
                      id="cw-member-query"
                      type="text"
                      suppressHydrationWarning
                      className={`w-full rounded-2xl border border-white/70 bg-white/60 py-3.5 ${query ? "pl-4" : "pl-11"} pr-4 text-sm font-semibold text-[#1e1b4b] shadow-[inset_0_1px_2px_rgba(30,27,75,0.06)] backdrop-blur-sm outline-none transition-all placeholder:text-[#a8a5cc] focus:border-[#5b61ff]/50 focus:bg-white/80 focus:ring-2 focus:ring-[#5b61ff]/15`}
                      placeholder="เบอร์โทร หรือ ทะเบียนรถ"
                      value={query}
                      onChange={(e) => setQuery(e.target.value.slice(0, 64))}
                      autoComplete="tel"
                    />
                  </div>
                  <button
                    type="submit"
                    suppressHydrationWarning
                    disabled={loading}
                    aria-label={loading ? "กำลังค้นหา" : "ค้นหาข้อมูล"}
                    className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-[#5b61ff]/30 bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-[0_12px_28px_-10px_rgba(91,97,255,0.65)] transition-all active:scale-[0.98] disabled:opacity-60"
                  >
                    {loading ? (
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-3.5-3.5" />
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {showActions ? (
              <div
                className="flex rounded-2xl border border-white/60 bg-white/40 p-1 backdrop-blur-md"
                role="tablist"
                aria-label="เลือกบริการ"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={section === "book"}
                  onClick={() => setSection("book")}
                  className={cn(
                    "min-h-[44px] flex-1 rounded-xl text-sm font-bold transition",
                    section === "book"
                      ? "bg-white/90 text-[#5b61ff] shadow-sm"
                      : "text-[#6b6894] hover:bg-white/50",
                  )}
                >
                  จองคิว
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={section === "package"}
                  disabled={!hasBundles}
                  onClick={() => hasBundles && setSection("package")}
                  className={cn(
                    "min-h-[44px] flex-1 rounded-xl text-sm font-bold transition",
                    section === "package"
                      ? "bg-white/90 text-[#5b61ff] shadow-sm"
                      : "text-[#6b6894] hover:bg-white/50 disabled:cursor-not-allowed disabled:opacity-45",
                  )}
                >
                  ใช้แพ็ก
                </button>
              </div>
            ) : null}

            {showActions && section === "book" ? (
              <>
                {upcomingBookings.length > 0 ? (
                  <div className={appPublicCheckInGlassCardClass}>
                    <div className="px-5 py-4 sm:px-6">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#9490c0]">คิวที่จองแล้ว</p>
                      <ul className="mt-2 grid grid-cols-1 gap-2">
                        {upcomingBookings.map((b) => (
                          <li
                            key={b.id}
                            className="rounded-2xl border border-white/70 bg-white/55 px-4 py-3 text-sm font-semibold text-[#1e1b4b]"
                          >
                            {b.dateLabel} · {b.timeLabel} น.
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}

                <div className={appPublicCheckInGlassCardClass}>
                  <div className="px-5 py-5 sm:px-6">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#9490c0]">จองล้างรถ</p>
                    {!hasBundles ? (
                      <p className="mb-3 text-xs text-[#6b6894]">
                        ยังไม่พบแพ็กในระบบ — จองคิวด้วยเบอร์นี้ได้เลย
                      </p>
                    ) : null}
                    <label className="mb-3 block text-xs font-semibold text-[#6b6894]">
                      ชื่อ (ไม่บังคับ)
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value.slice(0, 100))}
                        placeholder="ชื่อสำหรับจอง"
                        className="mt-1.5 w-full rounded-2xl border border-white/70 bg-white/60 px-4 py-3 text-sm font-semibold text-[#1e1b4b] outline-none focus:border-[#5b61ff]/50 focus:ring-2 focus:ring-[#5b61ff]/15"
                      />
                    </label>
                    <label className="mb-3 block text-xs font-semibold text-[#6b6894]">
                      ทะเบียนรถ (ไม่บังคับ)
                      <input
                        type="text"
                        value={plateInput}
                        onChange={(e) => setPlateInput(e.target.value.slice(0, 32))}
                        placeholder="เช่น กข 1234"
                        className="mt-1.5 w-full rounded-2xl border border-white/70 bg-white/60 px-4 py-3 text-sm font-semibold text-[#1e1b4b] outline-none focus:border-[#5b61ff]/50 focus:ring-2 focus:ring-[#5b61ff]/15"
                      />
                    </label>
                    <CarWashPublicSlotPicker
                      bookingDateKey={bookingDateKey}
                      onDateChange={setBookingDateKey}
                      selectedSlot={selectedSlot}
                      onSlotChange={setSelectedSlot}
                      slotAvailability={slotAvailability}
                      scheduleLoading={scheduleLoading}
                      scheduleClosed={scheduleClosed}
                      scheduleOpen={scheduleOpen}
                      scheduleClose={scheduleClose}
                      scheduleSlotMinutes={scheduleSlotMinutes}
                    />
                  </div>
                </div>

                {bookMsg ? (
                  <div className="overflow-hidden rounded-2xl border border-emerald-300/60 bg-gradient-to-br from-emerald-50/80 to-emerald-100/60 px-4 py-3.5 ring-1 ring-inset ring-emerald-200/50">
                    <p className="text-sm font-semibold text-emerald-900">{bookMsg}</p>
                  </div>
                ) : null}

                <button
                  type="button"
                  disabled={bookLoading || scheduleClosed || !selectedSlot || !phoneOk}
                  onClick={() => void onBook()}
                  aria-label={bookLoading ? "กำลังจอง" : "ยืนยันจองคิว"}
                  className={cn(
                    "flex min-h-[52px] w-full items-center justify-center rounded-2xl py-4 transition-all",
                    bookLoading || scheduleClosed || !selectedSlot || !phoneOk
                      ? "border border-white/60 bg-white/40 text-[#a8a5cc]"
                      : "border border-[#5b61ff]/30 bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-[0_14px_30px_-10px_rgba(91,97,255,0.45)] active:scale-[0.98]",
                  )}
                >
                  {bookLoading ? (
                    <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18M12 14v4M9 18h6" />
                    </svg>
                  )}
                </button>
              </>
            ) : null}

            {showActions && section === "package" && !hasBundles ? (
              <div className={appPublicCheckInGlassCardClass}>
                <p className="px-5 py-5 text-center text-sm text-[#6b6894] sm:px-6">
                  ไม่พบแพ็กเหมา — ค้นหาด้วยเบอร์หรือทะเบียนที่ลงทะเบียนไว้
                </p>
              </div>
            ) : null}

            {showActions && section === "package" && hasBundles ? (
              <div className={appPublicCheckInGlassCardClass}>
                <div className="border-b border-white/50 bg-gradient-to-r from-[#5b61ff]/8 via-transparent to-transparent px-5 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-gradient-to-br from-white/80 to-violet-100/60 shadow-sm backdrop-blur-sm">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#5b61ff]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <circle cx="12" cy="8" r="4" />
                        <path d="M6 20v-2a6 6 0 0 1 12 0v2" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-black text-[#1e1b4b]">{primaryCustomer?.customer_name}</p>
                      <p className="mt-0.5 text-xs text-[#6b6894]">
                        {formatPhoneDisplay(primaryCustomer?.customer_phone ?? "")}
                        {primaryCustomer?.plate_number ? (
                          <>
                            {" · "}
                            <span className="font-semibold text-[#4d47b6]">{primaryCustomer.plate_number}</span>
                          </>
                        ) : null}
                      </p>
                    </div>
                    {customerBundleSummary ? (
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] font-bold text-[#4d47b6]">{customerBundleSummary.package_name}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-[#6b6894]">
                          ใช้แล้ว {customerBundleSummary.used_uses}/{customerBundleSummary.total_uses}
                        </p>
                        <p className="mt-0.5 text-xs font-black text-emerald-700">
                          คงเหลือ {Math.max(0, customerBundleSummary.total_uses - customerBundleSummary.used_uses)} ครั้ง
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="px-5 py-4 sm:px-6">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#9490c0]">สถานะการล้าง (คิวในลาน)</p>
                    {historyPreview.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setHistoryModalOpen(true)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/55 text-[#5b61ff] shadow-sm backdrop-blur-sm transition hover:bg-white/75"
                        aria-label="เปิดประวัติการใช้งานล่าสุด"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                          <path d="M12 8v5l3 2" />
                          <path d="M3.05 11a9 9 0 1 1 .5 4" />
                          <path d="M3 4v5h5" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                  {openLaneVisit ? (
                    <button
                      type="button"
                      onClick={() => setLaneVisitAckId(openLaneVisit.id)}
                      className={cn(
                        "w-full rounded-2xl border px-4 py-3.5 text-left transition-all ring-offset-2 focus:outline-none focus:ring-2 focus:ring-[#4d47b6]/40",
                        laneConfirmed
                          ? "border-emerald-300/80 bg-gradient-to-br from-emerald-50/80 to-emerald-100/50 ring-2 ring-emerald-400/30 backdrop-blur-sm shadow-[0_4px_16px_-6px_rgba(16,185,129,0.25)]"
                          : "border-amber-300/70 bg-gradient-to-br from-amber-50/80 to-orange-50/60 backdrop-blur-sm shadow-[0_4px_16px_-6px_rgba(217,119,6,0.2)] hover:border-amber-400/80",
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-black text-[#1e1b4b]">{openLaneVisit.plate_number || "—"}</span>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1",
                            normalizeCarWashServiceStatus(openLaneVisit.service_status) === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
                              : "bg-sky-100 text-sky-800 ring-sky-200",
                          )}
                        >
                          {carWashStatusLabelTh(openLaneVisit.service_status)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-[#4d47b6]">{openLaneVisit.package_name}</p>
                      <p className="mt-0.5 text-[11px] tabular-nums text-[#8b87ad]">
                        {new Date(openLaneVisit.visit_at).toLocaleString("th-TH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      <div
                        className={cn(
                          "mt-2.5 flex items-center gap-1.5 border-t pt-2.5 text-[11px] font-semibold",
                          laneConfirmed
                            ? "border-emerald-200/60 text-emerald-700"
                            : "border-amber-200/60 text-amber-700",
                        )}
                      >
                        {laneConfirmed ? (
                          <>
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                            ยืนยันแล้ว — กดชำระด้านล่างได้เลย
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                              <path d="M12 9v4M12 17h.01" />
                              <circle cx="12" cy="12" r="9" />
                            </svg>
                            แตะที่นี่เพื่อยืนยันรถในลาน ก่อนกดชำระ
                          </>
                        )}
                      </div>
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-white/60 bg-white/40 px-4 py-4 text-center text-xs text-[#8b87ad] backdrop-blur-sm">
                      ไม่มีคิวค้างในลาน — หลังร้านรับรถ สถานะจะแสดงที่นี่
                    </div>
                  )}
                  <div className="mt-4 space-y-2 border-t border-white/50 pt-4">
                    <button
                      type="button"
                      onClick={() => void onCheckIn()}
                      disabled={!canPay}
                      aria-label={checkInLoading ? "กำลังบันทึก" : "ชำระและหักสิทธิ์ 1 ครั้ง"}
                      className={cn(
                        "flex min-h-[52px] w-full items-center justify-center rounded-2xl py-4 transition-all",
                        canPay
                          ? "border border-[#5b61ff]/30 bg-gradient-to-r from-[#5b61ff] to-[#6a63ff] text-white shadow-[0_14px_30px_-10px_rgba(91,97,255,0.65)] active:scale-[0.98]"
                          : "border border-white/60 bg-white/40 text-[#a8a5cc] backdrop-blur-sm",
                      )}
                    >
                      {checkInLoading ? (
                        <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                          <path d="M20 7 9 18l-5-5" />
                        </svg>
                      )}
                    </button>

                    {!openLaneVisit ? (
                      <p className="text-center text-xs text-amber-700">รอให้ร้านรับรถและมีคิวในลานก่อน จึงจะชำระได้</p>
                    ) : !laneConfirmed ? (
                      <p className="text-center text-xs text-[#8b87ad]">แตะการ์ดคิวด้านบนเพื่อยืนยัน ก่อนกดชำระ</p>
                    ) : selected && selected.is_active && selected.used_uses < selected.total_uses ? (
                      <p className="text-center text-xs text-[#6b6894]">
                        หลังชำระ สิทธิ์คงเหลือจะเป็น{" "}
                        <span className="font-bold text-[#4d47b6]">
                          {Math.max(0, selected.total_uses - selected.used_uses - 1)}
                        </span>{" "}
                        ครั้ง (จาก {selected.total_uses} ครั้ง)
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}

        {msg ? (
          <div className="overflow-hidden rounded-2xl border border-emerald-300/60 bg-gradient-to-br from-emerald-50/80 to-emerald-100/60 px-4 py-3.5 shadow-[0_8px_24px_-12px_rgba(16,185,129,0.3)] backdrop-blur-xl ring-1 ring-inset ring-emerald-200/50">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-emerald-900">{msg}</p>
            </div>
          </div>
        ) : null}
        {err ? (
          <div className="overflow-hidden rounded-2xl border border-red-300/60 bg-gradient-to-br from-red-50/80 to-rose-100/60 px-4 py-3.5 shadow-[0_8px_24px_-12px_rgba(220,38,38,0.2)] backdrop-blur-xl ring-1 ring-inset ring-red-200/50">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/15">
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-red-700" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                  <path d="M12 9v4M12 17h.01" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
              <p className="text-sm text-red-800">{err}</p>
            </div>
          </div>
        ) : null}

        <FormModal
          open={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          title="ประวัติการใช้งานล่าสุด"
          description="รายการเข้าใช้งานของลูกค้าจากการค้นหาครั้งนี้"
          appearance="glass"
          glassTint="violet"
        >
          <ul className="space-y-2">
            {historyPreview.map((v) => {
              const st = normalizeCarWashServiceStatus(v.service_status);
              return (
                <li
                  key={v.id}
                  className="flex flex-col gap-1.5 rounded-xl border border-white/65 bg-white/55 px-3 py-2.5 text-[11px] shadow-sm backdrop-blur-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0 font-semibold text-[#2e2a58]">{v.package_name}</span>
                    <span className="shrink-0 rounded-full bg-[#ede9fe] px-2 py-px text-[10px] font-bold text-[#4d47b6]">
                      {carWashStatusLabelTh(v.service_status)}
                    </span>
                  </div>
                  <span className="tabular-nums text-[#9490c0]">
                    {new Date(v.visit_at).toLocaleString("th-TH", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {st === "PAID" && v.final_price > 0 ? ` · ฿${v.final_price.toLocaleString("th-TH")}` : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </FormModal>
      </div>
    </AppPublicCheckInGlassPage>
  );
}
