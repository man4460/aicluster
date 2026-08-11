"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppIconCheck,
  AppIconClose,
  AppIconToolbarButton,
  AppIconUserX,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { BarberDashboardBackLink } from "@/systems/barber/components/BarberDashboardBackLink";
import { BarberDashboardHeaderTrailing } from "@/systems/barber/components/BarberDashboardHeaderTrailing";
import { BarberModalPortal } from "@/systems/barber/components/BarberModalPortal";
import {
  BarberQueueCheckInModal,
  type BarberQueueCheckInSeed,
} from "@/systems/barber/components/BarberQueueCheckInModal";
import {
  barberCardSurfaceRadiusClass,
  barberDashboardSegmentBtnClass,
  barberDashboardSegmentShellClass,
  barberEmptyStateDashedPlainClass,
  barberIconToolbarGroupClass,
  barberInlineAlertErrorClass,
  barberListRowCardClass,
  barberMutedLoadingNoticeClass,
  barberModalBackdropClass,
  barberModalCloseBtnClass,
  barberModalHeaderClass,
  barberModalPanelLgClass,
  barberModalSubtitleClass,
  barberModalTitleClass,
  barberPageStackClass,
  barberSectionFirstClass,
} from "@/systems/barber/components/barber-ui-tokens";
import {
  barberFindFirstFreeRun,
  barberNormalizeDurationMinutes,
  barberNormalizeSlotMinutes,
  barberParseHmToMinutes,
  barberSlotsNeeded,
} from "@/systems/barber/lib/booking-slots";
import { barberFormatWorkWeekdaysLabel } from "@/systems/barber/lib/stylist-schedule";
import { BarberBookingStatusBadge } from "./BarberBookingStatusBadge";

function bookingCardToneClass(status: string) {
  if (status === "ARRIVED") {
    return "border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30";
  }
  if (status === "NO_SHOW") {
    return "border-amber-200/80 bg-gradient-to-br from-white via-amber-50/40 to-orange-50/30";
  }
  if (status === "CANCELLED") {
    return "border-rose-200/70 bg-gradient-to-br from-white via-rose-50/35 to-pink-50/25";
  }
  // SCHEDULED / default
  return "border-indigo-200/70 bg-gradient-to-br from-white via-violet-50/35 to-sky-50/30";
}

function bookingCardAccentClass(status: string) {
  if (status === "ARRIVED") return "from-emerald-500 via-teal-500 to-cyan-500";
  if (status === "NO_SHOW") return "from-amber-500 via-orange-500 to-rose-400";
  if (status === "CANCELLED") return "from-rose-500 via-pink-500 to-fuchsia-500";
  return "from-indigo-500 via-[#5b61ff] to-violet-500";
}

function bookingCardGlowClass(status: string) {
  if (status === "ARRIVED") return "bg-emerald-300/35";
  if (status === "NO_SHOW") return "bg-amber-300/35";
  if (status === "CANCELLED") return "bg-rose-300/35";
  return "bg-indigo-300/30";
}

function IconCheckIn({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconCalendarToday({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
type BookingRow = {
  id: number;
  phone: string;
  customerName: string | null;
  scheduledAt: string;
  status: string;
  barberCustomerId: number | null;
  durationMinutes?: number;
  stylistId?: number | null;
  packageId?: number | null;
  packageName?: string | null;
  stylistName?: string | null;
};

type ServicePkg = {
  id: number;
  name: string;
  price: number;
  totalSessions: number;
  imageUrl: string | null;
  durationMinutes: number;
};

type StylistOpt = {
  id: number;
  name: string;
  photoUrl: string | null;
  workStartTime?: string;
  workEndTime?: string;
  workWeekdays?: number[];
};

type MemberSub = {
  id: number;
  packageId: number;
  packageName: string;
  remainingSessions: number;
  durationMinutes: number;
  imageUrl: string | null;
};

type AvailSlot = { startTime: string; available: boolean };

function runIsFree(slots: AvailSlot[], startIndex: number, need: number): string[] | null {
  if (need < 1 || startIndex < 0 || startIndex + need > slots.length) return null;
  const run: string[] = [];
  for (let i = 0; i < need; i++) {
    const s = slots[startIndex + i];
    if (!s?.available) return null;
    run.push(s.startTime);
  }
  return run;
}

export function BarberBookingsClient({
  initialDateKey,
  showDashboardBackLink = true,
  /** หน้า QR พนักงาน — การ์ดคิวเรียงแนวตั้งเหมือนมือถือ (ไม่จัดแถวซ้าย-ขวาบนจอใหญ่) */
  staffQrLanding = false,
  /** บนภาพรวมแดชบอร์ด — คิววันนี้ + เพิ่ม/อัปเดตสถานะ (ไม่เลือกวัน) */
  todayOverview = false,
  /** แสดงแถบแท็บแดชบอร์ดชิดขวา (คู่กับปุ่มกรองซ้าย) */
  showHubToolbar = false,
}: {
  initialDateKey: string;
  /** ปิดเมื่อหน้าพนักงานมีปุ่มกลับแดชบอร์ดอยู่แล้ว */
  showDashboardBackLink?: boolean;
  staffQrLanding?: boolean;
  todayOverview?: boolean;
  showHubToolbar?: boolean;
}) {
  const [dateKey, setDateKey] = useState(initialDateKey);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [barberCustomerId, setBarberCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [bookDate, setBookDate] = useState(() => bangkokDateKey());
  const [stylists, setStylists] = useState<StylistOpt[]>([]);
  const [stylistId, setStylistId] = useState<number | null>(null);
  const [packages, setPackages] = useState<ServicePkg[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [slotMinutes, setSlotMinutes] = useState<30 | 60>(30);
  const [availSlots, setAvailSlots] = useState<AvailSlot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [availBusy, setAvailBusy] = useState(false);
  const [stylistDayOff, setStylistDayOff] = useState(false);
  const [memberSubs, setMemberSubs] = useState<MemberSub[]>([]);
  const [memberFound, setMemberFound] = useState<boolean | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [patchingId, setPatchingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgFading, setMsgFading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [checkInSeed, setCheckInSeed] = useState<BarberQueueCheckInSeed | null>(null);
  const todayKey = bangkokDateKey();
  const dateFilterDirty = !todayOverview && dateKey !== todayKey;

  const singleVisitPackages = useMemo(
    () => packages.filter((p) => p.totalSessions === 1),
    [packages],
  );
  const memberPackageSelected =
    selectedPackageId != null && memberSubs.some((m) => m.packageId === selectedPackageId);
  const serviceSelected = selectedPackageId != null;
  const slotsNeeded = barberSlotsNeeded(durationMinutes, slotMinutes);
  const selectedSet = useMemo(() => new Set(selectedSlots), [selectedSlots]);

  function applyDurationAndAutoSelect(nextDuration: number, slots: AvailSlot[] = availSlots) {
    const dur = barberNormalizeDurationMinutes(nextDuration, slotMinutes);
    setDurationMinutes(dur);
    const need = barberSlotsNeeded(dur, slotMinutes);
    const times = slots.map((s) => s.startTime);
    const busy: Array<{ startMin: number; endMin: number }> = [];
    for (const s of slots) {
      if (s.available) continue;
      const sm = barberParseHmToMinutes(s.startTime);
      if (sm == null) continue;
      busy.push({ startMin: sm, endMin: sm + slotMinutes });
    }
    const run = barberFindFirstFreeRun(times, busy, need, slotMinutes);
    setSelectedSlots(run ?? []);
  }

  useEffect(() => {
    if (!todayOverview) return;
    setDateKey(todayKey);
  }, [todayOverview, todayKey]);

  useEffect(() => {
    if (!msg) {
      setMsgFading(false);
      return;
    }
    setMsgFading(false);
    const fadeTimer = window.setTimeout(() => setMsgFading(true), 2200);
    const clearTimer = window.setTimeout(() => setMsg(null), 2900);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(clearTimer);
    };
  }, [msg]);

  const load = useCallback(async () => {
    setListLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/barber/bookings?date=${encodeURIComponent(dateKey)}`, {
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

  function openAddModal() {
    setErr(null);
    setMsg(null);
    setPhone("");
    setBarberCustomerId(null);
    setCustomerName("");
    setBookDate(todayOverview ? todayKey : dateKey || bangkokDateKey());
    setStylistId(null);
    setSelectedPackageId(null);
    setDurationMinutes(30);
    setAvailSlots([]);
    setSelectedSlots([]);
    setMemberSubs([]);
    setMemberFound(null);
    setAddOpen(true);
  }

  useEffect(() => {
    if (!addOpen) return;
    let cancelled = false;
    void (async () => {
      try {
        const [pkgRes, stRes] = await Promise.all([
          fetch("/api/barber/packages", { credentials: "include" }),
          fetch("/api/barber/stylists", { credentials: "include" }),
        ]);
        const pkgJ = (await pkgRes.json().catch(() => ({}))) as {
          packages?: ServicePkg[];
          error?: string;
        };
        const stJ = (await stRes.json().catch(() => ({}))) as {
          stylists?: StylistOpt[];
          error?: string;
        };
        if (cancelled) return;
        if (pkgRes.ok) {
          setPackages(
            (pkgJ.packages ?? []).map((p) => ({
              ...p,
              durationMinutes: barberNormalizeDurationMinutes(p.durationMinutes ?? 30, 30),
            })),
          );
        }
        if (stRes.ok) {
          const list = (stJ.stylists ?? []).map((s) => ({
            id: s.id,
            name: s.name,
            photoUrl: s.photoUrl ?? null,
            workStartTime: s.workStartTime,
            workEndTime: s.workEndTime,
            workWeekdays: s.workWeekdays,
          }));
          setStylists(list);
          if (list.length === 1) setStylistId(list[0]!.id);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [addOpen]);

  useEffect(() => {
    if (!addOpen) return;
    const needStylist = stylists.length > 0;
    if (needStylist && stylistId == null) {
      setAvailSlots([]);
      setSelectedSlots([]);
      setStylistDayOff(false);
      return;
    }
    let cancelled = false;
    setAvailBusy(true);
    const q = new URLSearchParams({ date: bookDate });
    if (stylistId != null) q.set("stylistId", String(stylistId));
    void fetch(`/api/barber/bookings/availability?${q}`, { credentials: "include", cache: "no-store" })
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as {
          slots?: AvailSlot[];
          slotMinutes?: number;
          stylistDayOff?: boolean;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setErr(j.error ?? "โหลดสล็อตไม่สำเร็จ");
          setAvailSlots([]);
          setSelectedSlots([]);
          setStylistDayOff(false);
          return;
        }
        const slots = j.slots ?? [];
        const sm = barberNormalizeSlotMinutes(j.slotMinutes ?? 30);
        setSlotMinutes(sm);
        setStylistDayOff(Boolean(j.stylistDayOff));
        setAvailSlots(slots);
        if (selectedPackageId != null) {
          applyDurationAndAutoSelect(durationMinutes, slots);
        } else {
          setSelectedSlots([]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAvailSlots([]);
          setSelectedSlots([]);
          setStylistDayOff(false);
        }
      })
      .finally(() => {
        if (!cancelled) setAvailBusy(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reload when day/stylist changes
  }, [addOpen, bookDate, stylistId, stylists.length]);

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
      const res = await fetch(`/api/barber/customers/search?phone=${encodeURIComponent(digits)}`, {
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as {
        customer?: { id: number; name: string | null; phone: string } | null;
        subscriptions?: Array<{
          id: number;
          packageId: number;
          packageName: string;
          remainingSessions: number;
          durationMinutes?: number;
          imageUrl?: string | null;
        }>;
        error?: string;
      };
      if (!res.ok) {
        setErr(j.error ?? "ค้นหาไม่สำเร็จ");
        return;
      }
      if (j.customer) {
        setBarberCustomerId(j.customer.id);
        setCustomerName(j.customer.name?.trim() || "");
        setMemberFound(true);
        setMemberSubs(
          (j.subscriptions ?? []).map((s) => ({
            id: s.id,
            packageId: s.packageId,
            packageName: s.packageName,
            remainingSessions: s.remainingSessions,
            durationMinutes: barberNormalizeDurationMinutes(s.durationMinutes ?? 30, 30),
            imageUrl: s.imageUrl ?? null,
          })),
        );
        setMsg(
          (j.subscriptions?.length ?? 0) > 0
            ? "พบสมาชิก — เลือกแพ็กสมาชิกหรือเมนูรายครั้งได้"
            : "พบลูกค้าในระบบ — ยังไม่มีแพ็กเหลือ",
        );
      } else {
        setBarberCustomerId(null);
        setMemberFound(false);
        setMemberSubs([]);
        setMsg("ยังไม่มีลูกค้าเบอร์นี้ — เลือกเมนูรายครั้งแล้วจองได้");
      }
    } finally {
      setSearchLoading(false);
    }
  }

  function onClickSlot(startTime: string) {
    const idx = availSlots.findIndex((s) => s.startTime === startTime);
    if (idx < 0) return;
    const slot = availSlots[idx];
    if (!slot?.available) return;
    const run = runIsFree(availSlots, idx, slotsNeeded);
    if (!run) {
      setErr(`ต้องว่างติดกัน ${slotsNeeded} สล็อต`);
      return;
    }
    setErr(null);
    setSelectedSlots(run);
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
    if (stylists.length > 0 && stylistId == null) {
      setErr("กรุณาเลือกช่าง");
      return;
    }
    if (selectedPackageId == null) {
      setErr("เลือกบริการก่อน");
      return;
    }
    if (selectedSlots.length < 1) {
      setErr("เลือกสล็อตเวลา");
      return;
    }
    const scheduledAtLocal = `${bookDate}T${selectedSlots[0]!}`;
    setSaving(true);
    try {
      const res = await fetch("/api/barber/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phone: digits,
          barberCustomerId,
          customerName: customerName.trim() || null,
          scheduledAtLocal,
          packageId: selectedPackageId,
          stylistId: stylistId ?? null,
          durationMinutes,
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
        const bkLocalKey = new Date(bk.scheduledAt).toLocaleDateString("en-CA", {
          timeZone: "Asia/Bangkok",
        });
        if (bkLocalKey === dateKey) {
          setBookings((prev) =>
            [...prev, bk].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
          );
        }
      } else {
        await load();
      }
      setAddOpen(false);
      setPhone("");
      setBarberCustomerId(null);
      setCustomerName("");
      setSelectedPackageId(null);
      setSelectedSlots([]);
      setMemberSubs([]);
      setMemberFound(null);
    } finally {
      setSaving(false);
    }
  }

  function openWalkInCheckIn(fromAddForm = false) {
    const digits = phone.replace(/\D/g, "");
    setCheckInSeed({
      phone: fromAddForm && digits.length >= 9 ? digits : "",
      customerName: fromAddForm ? customerName : null,
      bookingId: null,
    });
    if (fromAddForm) {
      setAddOpen(false);
      setErr(null);
      setMsg(null);
    }
  }

  function openBookingCheckIn(b: BookingRow) {
    setCheckInSeed({
      phone: b.phone,
      customerName: b.customerName,
      bookingId: b.id,
    });
  }

  async function patchStatus(id: number, status: "ARRIVED" | "NO_SHOW" | "CANCELLED") {
    setErr(null);
    setPatchingId(id);
    try {
      const res = await fetch(`/api/barber/bookings/${id}`, {
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
    <div className={todayOverview ? "min-w-0" : barberPageStackClass}>
      {err && !addOpen ? <p className={barberInlineAlertErrorClass}>{err}</p> : null}
      {msg && !addOpen ? (
        <p
          role="status"
          className={cn(
            "px-0.5 text-xs font-semibold leading-snug text-emerald-700 transition-opacity duration-500",
            msgFading ? "opacity-0" : "opacity-100",
          )}
        >
          {msg}
        </p>
      ) : null}

      <section
        className={barberSectionFirstClass}
        aria-label={todayOverview ? "คิววันนี้" : "คิวตามวัน"}
      >
        {todayOverview ? (
          <div className="flex min-w-0 flex-row items-center justify-between gap-2 sm:gap-3">
            <h2 className="min-w-0 text-base font-black leading-none tracking-tight text-[#1e1b4b] sm:text-lg">
              คิววันนี้
            </h2>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => openWalkInCheckIn(false)}
                aria-label="เช็กอิน Walk-in"
                className="inline-flex h-10 min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-[1rem] border border-emerald-300/80 bg-emerald-50 px-0 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-100 sm:min-w-0 sm:px-3.5"
              >
                <IconCheckIn className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">เช็กอิน</span>
              </button>
              <button
                type="button"
                suppressHydrationWarning
                onClick={openAddModal}
                aria-label="เพิ่มคิว"
                className="app-btn-primary inline-flex h-10 min-h-10 min-w-10 shrink-0 items-center justify-center gap-1.5 rounded-[1rem] px-0 text-sm font-semibold sm:min-w-0 sm:px-4"
              >
                <IconPlus className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">เพิ่มคิว</span>
              </button>
            </div>
          </div>
        ) : staffQrLanding ? (
          <div className="flex min-w-0 flex-nowrap items-center justify-between gap-2 border-b border-[#ecebff] pb-3">
            <h2 className="shrink-0 text-base font-bold leading-tight text-[#2e2a58] sm:text-lg">คิวตามวัน</h2>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <input
                type="date"
                value={dateKey}
                onChange={(e) => setDateKey(e.target.value)}
                aria-label="วันที่"
                className="app-input h-10 min-h-10 max-w-[min(100%,11.25rem)] flex-1 rounded-[1rem] px-2.5 text-sm tabular-nums sm:max-w-[11.5rem] sm:flex-none"
              />
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => openWalkInCheckIn(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border border-emerald-300/90 bg-emerald-50 text-emerald-900 shadow-sm transition hover:bg-emerald-100 active:scale-95"
                aria-label="เช็กอิน Walk-in"
              >
                <IconCheckIn className="h-5 w-5" />
              </button>
              <button
                type="button"
                suppressHydrationWarning
                onClick={openAddModal}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-md ring-1 ring-white/40 transition hover:opacity-95 active:scale-95"
                aria-label="เพิ่มคิว"
              >
                <IconPlus className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-col gap-2.5">
            <div className="flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <h2 className="shrink-0 text-base font-black leading-none tracking-tight text-[#1e1b4b] sm:text-lg">
                คิวตามวัน
              </h2>

              {showHubToolbar ? (
                <BarberDashboardHeaderTrailing className="w-full sm:w-auto">
                  {/* เดสก์ท็อป: ชุดกรองอยู่ซ้ายของเมนูในแถวเดียวกัน */}
                  {filterOpen ? (
                    <label
                      className={cn(
                        barberDashboardSegmentBtnClass(false),
                        "hidden cursor-pointer gap-1.5 px-2 sm:inline-flex sm:px-2.5",
                      )}
                    >
                      <IconCalendarToday className="h-4 w-4 shrink-0 text-slate-400" />
                      <input
                        type="date"
                        value={dateKey}
                        onChange={(e) => setDateKey(e.target.value)}
                        aria-label="วันที่"
                        id="barber-bookings-filter-date"
                        className="h-8 min-w-0 max-w-[9.5rem] border-0 bg-transparent p-0 text-xs font-bold leading-none tabular-nums text-[#2e2a58] outline-none sm:max-w-[10.5rem]"
                      />
                    </label>
                  ) : null}
                  {filterOpen && dateFilterDirty ? (
                    <button
                      type="button"
                      onClick={() => setDateKey(todayKey)}
                      className={cn(barberDashboardSegmentBtnClass(false), "hidden sm:inline-flex")}
                      aria-label="รีเซ็ตวันที่เป็นวันนี้"
                    >
                      <IconCalendarToday className="h-4 w-4 shrink-0" />
                      <span>วันนี้</span>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setFilterOpen((o) => !o)}
                    aria-expanded={filterOpen}
                    aria-controls="barber-bookings-filter-panel"
                    aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                    title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                    className={cn(
                      barberDashboardSegmentBtnClass(filterOpen),
                      "relative",
                      dateFilterDirty && !filterOpen && "ring-1 ring-amber-300/80",
                    )}
                  >
                    <IconFilter className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                    {dateFilterDirty ? (
                      <span
                        className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                  {showDashboardBackLink ? <BarberDashboardBackLink /> : null}
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={openAddModal}
                    className={barberDashboardSegmentBtnClass(true)}
                    aria-label="เพิ่มคิว"
                  >
                    <IconPlus className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">เพิ่มคิว</span>
                  </button>
                </BarberDashboardHeaderTrailing>
              ) : (
                <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                  {filterOpen ? (
                    <>
                      <label className="flex h-10 min-h-10 shrink-0 items-center gap-2 rounded-[1rem] border border-white/60 bg-white/80 px-2.5 shadow-sm">
                        <span className="hidden text-[10px] font-black uppercase tracking-wider text-[#66638c] sm:inline">
                          วันที่
                        </span>
                        <input
                          type="date"
                          value={dateKey}
                          onChange={(e) => setDateKey(e.target.value)}
                          aria-label="วันที่"
                          id="barber-bookings-filter-date"
                          className="h-8 min-w-0 max-w-[10.5rem] border-0 bg-transparent p-0 text-sm font-semibold tabular-nums text-[#2e2a58] outline-none sm:max-w-[11rem]"
                        />
                      </label>
                      {dateFilterDirty ? (
                        <button
                          type="button"
                          onClick={() => setDateKey(todayKey)}
                          className={barberDashboardSegmentBtnClass(false)}
                          aria-label="รีเซ็ตวันที่เป็นวันนี้"
                        >
                          <IconCalendarToday className="h-4 w-4 shrink-0" />
                          วันนี้
                        </button>
                      ) : null}
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setFilterOpen((o) => !o)}
                    aria-expanded={filterOpen}
                    aria-controls="barber-bookings-filter-panel"
                    aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                    className={barberDashboardSegmentBtnClass(filterOpen)}
                  >
                    <IconFilter className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                  </button>
                  {showDashboardBackLink ? <BarberDashboardBackLink /> : null}
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={openAddModal}
                    className={barberDashboardSegmentBtnClass(true)}
                    aria-label="เพิ่มคิว"
                  >
                    <IconPlus className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">เพิ่มคิว</span>
                  </button>
                </div>
              )}
            </div>

            {/* มือถือ: ชุดกรองเต็มแถว ใต้แถบเมนู */}
            {showHubToolbar && filterOpen ? (
              <div
                id="barber-bookings-filter-panel"
                className={cn(barberDashboardSegmentShellClass, "w-full justify-start sm:hidden")}
                role="group"
                aria-label="ตัวกรองวันที่"
              >
                <label
                  className={cn(
                    barberDashboardSegmentBtnClass(false),
                    "min-w-0 flex-1 cursor-pointer justify-start gap-1.5 px-2.5",
                  )}
                >
                  <IconCalendarToday className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type="date"
                    value={dateKey}
                    onChange={(e) => setDateKey(e.target.value)}
                    aria-label="วันที่"
                    className="h-8 min-w-0 flex-1 border-0 bg-transparent p-0 text-xs font-bold leading-none tabular-nums text-[#2e2a58] outline-none"
                  />
                </label>
                {dateFilterDirty ? (
                  <button
                    type="button"
                    onClick={() => setDateKey(todayKey)}
                    className={barberDashboardSegmentBtnClass(false)}
                    aria-label="รีเซ็ตวันที่เป็นวันนี้"
                  >
                    <IconCalendarToday className="h-4 w-4 shrink-0" />
                    วันนี้
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
        {listLoading ? (
          <p className={`${barberMutedLoadingNoticeClass} text-center`}>กำลังโหลด…</p>
        ) : bookings.length === 0 ? (
          <div className={`${barberEmptyStateDashedPlainClass} text-center text-sm text-[#66638c]`}>
            {todayOverview ? "ยังไม่มีคิววันนี้" : "ไม่มีคิวในวันนี้"}
          </div>
        ) : (
          <ul className="space-y-2.5">
            {bookings.map((b) => (
              <li
                key={b.id}
                className={cn(
                  barberListRowCardClass,
                  "relative overflow-hidden",
                  bookingCardToneClass(b.status),
                  !staffQrLanding && "sm:flex sm:items-start sm:justify-between sm:gap-4",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute bottom-2.5 left-0 top-2.5 w-1 rounded-r-full bg-gradient-to-b opacity-90",
                    bookingCardAccentClass(b.status),
                  )}
                />
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-70",
                    bookingCardGlowClass(b.status),
                  )}
                />
                <div className="relative min-w-0 flex-1 pl-1.5">
                  <p className="font-mono text-sm font-semibold leading-snug text-[#2e2a58]">{b.phone}</p>
                  <p className="mt-0.5 text-xs text-[#5f5a8a]">{b.customerName?.trim() || "—"}</p>
                  {(b.packageName || b.stylistName) && (
                    <p className="mt-0.5 text-[11px] font-semibold text-[#66638c]">
                      {[b.packageName, b.stylistName ? `ช่าง ${b.stylistName}` : null, b.durationMinutes ? `${b.durationMinutes} นาที` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  <p className="mt-1 text-xs font-medium tabular-nums text-[#4d47b6] sm:text-sm">
                    {todayOverview
                      ? new Date(b.scheduledAt).toLocaleTimeString("th-TH", {
                          timeZone: "Asia/Bangkok",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : new Date(b.scheduledAt).toLocaleString("th-TH", {
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
                    "relative mt-3 flex flex-col items-stretch gap-2",
                    !staffQrLanding && "sm:mt-0 sm:min-w-[140px] sm:items-end",
                  )}
                >
                  <BarberBookingStatusBadge status={b.status} scheduledAt={new Date(b.scheduledAt)} />
                  {b.status === "SCHEDULED" ? (
                    <div
                      className={cn(barberIconToolbarGroupClass, "justify-end")}
                      role="group"
                      aria-label="เช็กอินและอัปเดตสถานะคิว"
                    >
                      <AppIconToolbarButton
                        title="เช็กอิน"
                        ariaLabel={`เช็กอิน ${b.phone}`}
                        disabled={patchingId === b.id}
                        onClick={() => openBookingCheckIn(b)}
                        className="text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900"
                      >
                        <IconCheckIn className="h-3.5 w-3.5" />
                      </AppIconToolbarButton>
                      <AppIconToolbarButton
                        title="มาแล้ว (สถานะอย่างเดียว)"
                        ariaLabel="มาแล้ว โดยไม่หักแพ็กหรือรับชำระ"
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
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {addOpen ? (
        <BarberModalPortal>
          <div className={barberModalBackdropClass} role="presentation" onClick={() => closeAddModal()}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="barber-add-booking-title"
              className={barberModalPanelLgClass}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={barberModalHeaderClass}>
                <div className="min-w-0">
                  <h2 id="barber-add-booking-title" className={barberModalTitleClass}>
                    เพิ่มคิว
                  </h2>
                  <p className={barberModalSubtitleClass}>
                    เลือกบริการและเวลาเหมือนลิงก์ลูกค้า — หรือกด «เช็กอิน Walk-in» ถ้ามาใช้ทันที
                  </p>
                </div>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => closeAddModal()}
                  className={barberModalCloseBtnClass}
                  aria-label="ปิด"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={(e) => void onSave(e)} className="grid max-h-[min(78vh,720px)] gap-3 overflow-y-auto px-5 py-5">
              {err ? (
                <p className="rounded-[1.25rem] bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100">{err}</p>
              ) : null}
              {msg ? (
                <p className="rounded-[1.25rem] bg-emerald-50 px-3 py-2 text-sm text-emerald-900 ring-1 ring-emerald-100">
                  {msg}
                </p>
              ) : null}

              <label className="block text-xs font-medium text-[#4d47b6]">
                วันที่
                <input
                  type="date"
                  required
                  value={bookDate}
                  min={bangkokDateKey()}
                  onChange={(e) => setBookDate(e.target.value)}
                  className="app-input mt-1 h-12 w-full rounded-[1.25rem] px-3 text-sm font-semibold"
                />
              </label>

              {stylists.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[#4d47b6]">ช่าง</p>
                  <div className="flex flex-wrap gap-2">
                    {stylists.map((s) => {
                      const active = stylistId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setStylistId(s.id)}
                          className={cn(
                            "inline-flex min-h-[40px] items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold",
                            active
                              ? "border-[#5b61ff] bg-[#5b61ff] text-white"
                              : "border-white/70 bg-white/80 text-[#4d47b6]",
                          )}
                        >
                          {s.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.photoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                          ) : null}
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                  {(() => {
                    const selected = stylists.find((s) => s.id === stylistId);
                    if (!selected?.workStartTime || !selected.workEndTime) return null;
                    return (
                      <p className="text-[11px] font-semibold leading-relaxed text-[#66638c]">
                        รับคิว {selected.workStartTime}–{selected.workEndTime}
                        <span className="mx-1 text-[#c4c0e0]" aria-hidden>
                          ·
                        </span>
                        {barberFormatWorkWeekdaysLabel(selected.workWeekdays ?? [0, 1, 2, 3, 4, 5, 6])}
                      </p>
                    );
                  })()}
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-xs font-medium text-[#4d47b6]">เลือกบริการรายครั้ง</p>
                {singleVisitPackages.length === 0 ? (
                  <p className="text-xs font-semibold text-[#66638c]">ยังไม่มีเมนูรายครั้ง</p>
                ) : (
                  <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                    {singleVisitPackages.map((pkg) => {
                      const active = selectedPackageId === pkg.id && !memberPackageSelected;
                      return (
                        <li key={pkg.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPackageId(pkg.id);
                              applyDurationAndAutoSelect(pkg.durationMinutes);
                            }}
                            className={cn(
                              "flex h-full w-full flex-col overflow-hidden rounded-xl border text-left",
                              active
                                ? "border-[#5b61ff] bg-[#5b61ff]/10 ring-2 ring-[#5b61ff]/35"
                                : "border-[#e8e6f4] bg-white hover:border-[#5b61ff]/40",
                            )}
                          >
                            {pkg.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={pkg.imageUrl} alt="" className="aspect-square w-full object-cover" />
                            ) : (
                              <div className="flex aspect-square items-center justify-center bg-[#ecebff] text-[10px] font-bold text-[#4d47b6]">
                                บริการ
                              </div>
                            )}
                            <div className="space-y-0.5 p-1.5">
                              <p className="line-clamp-2 text-[10px] font-black leading-tight text-[#1e1b4b]">
                                {pkg.name}
                              </p>
                              <p className="text-[9px] font-semibold text-[#66638c]">{pkg.durationMinutes} นาที</p>
                              <p className="text-[10px] font-black text-[#4d47b6]">
                                ฿{pkg.price.toLocaleString("th-TH")}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="block flex-1 text-xs font-medium text-[#4d47b6]">
                  เบอร์โทร
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 15));
                      setBarberCustomerId(null);
                      setMemberFound(null);
                      setMemberSubs([]);
                    }}
                    placeholder="0812345678"
                    className="app-input mt-1 h-12 w-full rounded-[1.25rem] px-3 text-base"
                  />
                </label>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => void onSearchPhone()}
                  disabled={searchLoading}
                  className={`app-btn-soft inline-flex h-12 shrink-0 items-center justify-center gap-1.5 ${barberCardSurfaceRadiusClass} px-4 text-sm font-semibold disabled:opacity-50`}
                >
                  <IconSearch className="h-4 w-4 shrink-0" />
                  {searchLoading ? "กำลังค้นหา…" : "ค้นหาสมาชิก"}
                </button>
              </div>

              {memberFound === true && memberSubs.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[#4d47b6]">แพ็กเกจสมาชิก (ใช้แทนเมนูรายครั้งได้)</p>
                  <div className="flex flex-wrap gap-2">
                    {memberSubs.map((mp) => {
                      const active = selectedPackageId === mp.packageId && memberPackageSelected;
                      return (
                        <button
                          key={mp.id}
                          type="button"
                          onClick={() => {
                            setSelectedPackageId(mp.packageId);
                            applyDurationAndAutoSelect(mp.durationMinutes);
                          }}
                          className={cn(
                            "inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3 text-xs font-bold",
                            active
                              ? "bg-[#5b61ff] text-white"
                              : "border border-[#e8e6f4] bg-white text-[#4d47b6]",
                          )}
                        >
                          {mp.packageName} · เหลือ {mp.remainingSessions} · {mp.durationMinutes} นาที
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {memberFound === true && memberSubs.length === 0 ? (
                <p className="text-xs font-semibold text-[#66638c]">ไม่พบแพ็กที่เหลือใช้ — เลือกเมนูรายครั้ง</p>
              ) : null}
              {memberFound === false ? (
                <p className="text-xs font-semibold text-[#66638c]">ไม่พบสมาชิก — เลือกเมนูรายครั้งแล้วจองได้</p>
              ) : null}

              <div className="space-y-2">
                <p className="text-xs font-medium text-[#4d47b6]">
                  เวลา · ต้องการ {slotsNeeded} สล็อต
                  {selectedSlots.length > 0
                    ? ` · เลือก ${selectedSlots[0]}${selectedSlots.length > 1 ? `–${selectedSlots[selectedSlots.length - 1]}` : ""}`
                    : ""}
                </p>
                {!serviceSelected ? (
                  <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-3 text-xs font-semibold text-amber-900">
                    เลือกบริการรายครั้ง (หรือแพ็กสมาชิก) ก่อน จึงเลือกช่วงเวลาได้
                  </p>
                ) : availBusy ? (
                  <p className="text-xs font-semibold text-[#66638c]">กำลังโหลดสล็อต…</p>
                ) : stylists.length > 0 && stylistId == null ? (
                  <p className="text-xs font-semibold text-[#66638c]">เลือกช่างก่อน</p>
                ) : stylistDayOff ? (
                  <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-3 text-xs font-semibold text-amber-900">
                    ช่างไม่รับบริการวันนี้ — เลือกวันอื่นหรือช่างอื่น
                  </p>
                ) : availSlots.length === 0 ? (
                  <p className="text-xs font-semibold text-[#66638c]">ไม่มีสล็อตในวันนี้</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                    {availSlots.map((s) => {
                      const selected = selectedSet.has(s.startTime);
                      const disabled = !s.available;
                      return (
                        <button
                          key={s.startTime}
                          type="button"
                          disabled={disabled}
                          onClick={() => onClickSlot(s.startTime)}
                          className={cn(
                            "min-h-[44px] rounded-xl text-sm font-bold tabular-nums",
                            disabled && "cursor-not-allowed bg-slate-100 text-slate-400 line-through",
                            !disabled && !selected && "border border-[#e8e6f4] bg-white text-[#4d47b6]",
                            selected && "bg-[#5b61ff] text-white shadow-md",
                          )}
                        >
                          {s.startTime}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <label className="block text-xs font-medium text-[#4d47b6]">
                ชื่อ (ไม่บังคับ)
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value.slice(0, 100))}
                  className="app-input mt-1 h-12 w-full rounded-[1.25rem] px-3 text-base"
                  placeholder="ชื่อลูกค้า"
                />
              </label>
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => closeAddModal()}
                  className={`app-btn-soft inline-flex min-h-[48px] items-center justify-center gap-1.5 ${barberCardSurfaceRadiusClass} px-4 py-3 text-sm font-semibold text-[#2e2a58]`}
                >
                  <AppIconClose className="h-4 w-4 shrink-0" />
                  ยกเลิก
                </button>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => openWalkInCheckIn(true)}
                  className={`inline-flex min-h-[48px] items-center justify-center gap-1.5 ${barberCardSurfaceRadiusClass} border border-emerald-300/90 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-950`}
                  aria-label="เช็กอิน Walk-in ไม่จองคิว"
                >
                  <IconCheckIn className="h-4 w-4 shrink-0" />
                  เช็กอิน Walk-in
                </button>
                <button
                  type="submit"
                  suppressHydrationWarning
                  disabled={saving || !serviceSelected || selectedSlots.length < 1}
                  className={`app-btn-primary inline-flex min-h-[48px] items-center justify-center gap-1.5 ${barberCardSurfaceRadiusClass} px-4 py-3 text-sm font-semibold disabled:opacity-50`}
                >
                  <AppIconCheck className="h-4 w-4 shrink-0" />
                  {saving ? "กำลังบันทึก…" : "บันทึกคิว"}
                </button>
              </div>
            </form>
            </div>
          </div>
        </BarberModalPortal>
      ) : null}

      <BarberQueueCheckInModal
        open={Boolean(checkInSeed)}
        seed={checkInSeed}
        onClose={() => setCheckInSeed(null)}
        onSuccess={({ mode, bookingId }) => {
          setMsg(
            mode === "PACKAGE_USE"
              ? bookingId != null
                ? "เช็กอินแล้ว — หักแพ็กและอัปเดตคิวเป็นมาแล้ว"
                : "เช็กอินแล้ว — หัก 1 ครั้งจากแพ็ก"
              : bookingId != null
                ? "เช็กอินแล้ว — รับชำระและอัปเดตคิวเป็นมาแล้ว"
                : "เช็กอิน Walk-in แล้ว — บันทึกการชำระเรียบร้อย",
          );
          if (bookingId != null) {
            setBookings((prev) =>
              prev.map((b) => (b.id === bookingId ? { ...b, status: "ARRIVED" } : b)),
            );
          }
          void load();
        }}
      />
    </div>
  );
}
