"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  buildBookableStartSlots,
  carWashNormalizeDurationMinutes,
  carWashSlotsNeeded,
  scheduledAtLocalFromSlot,
  type SlotAvailabilityItem,
} from "@/lib/car-wash/booking-slot-availability";
import {
  carWashComputePortalPayDue,
  normalizeCarWashPortalPaymentMode,
  type CarWashPortalBookingPaymentMode,
} from "@/lib/car-wash/portal-booking";
import { bangkokDateKey } from "@/lib/time/bangkok";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { CarWashBookingStatusBadge } from "@/systems/car-wash/CarWashBookingStatusBadge";
import { CarWashPaymentPanel } from "@/systems/car-wash/CarWashPaymentPanel";
import type { CarWashPaymentMethod } from "@/systems/car-wash/lib/payment-method";

type BookingRow = {
  id: number;
  phone: string;
  plateNumber: string;
  customerName: string | null;
  packageId: number | null;
  packageName: string;
  durationMinutes: number;
  scheduledAt: string;
  status: string;
  visitId?: number | null;
  packagePrice?: number;
  depositAmountBaht?: number | null;
  amountPaidBaht?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentSlipUrl?: string;
};

function bookingSlotHm(iso: string): string {
  return new Date(iso).toLocaleTimeString("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

type ServicePackage = {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
  total_uses?: number;
  image_url?: string | null;
  description?: string;
  is_active?: boolean;
};

type MemberBundle = {
  id: number;
  customer_name: string;
  customer_phone: string;
  plate_number: string;
  package_id: number;
  package_name: string;
  total_uses: number;
  used_uses: number;
  is_active: boolean;
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
  onQueueChanged,
}: {
  initialDateKey?: string;
  staffQrLanding?: boolean;
  /** หลังเปลี่ยนสถานะคิว (เช่น มาแล้ว → เข้าลาน) ให้รีเฟรชลาน/รายการ */
  onQueueChanged?: () => void;
}) {
  const [dateKey, setDateKey] = useState(initialDateKey ?? bangkokDateKey());
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
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
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<BookingRow | null>(null);
  const [payMode, setPayMode] = useState<CarWashPortalBookingPaymentMode>("NONE");
  const [shopDeposit, setShopDeposit] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState<CarWashPaymentMethod>("CASH");
  const [paySlipUrl, setPaySlipUrl] = useState<string | null>(null);
  const [memberBusy, setMemberBusy] = useState(false);
  const [memberFound, setMemberFound] = useState<boolean | null>(null);
  const [memberBundles, setMemberBundles] = useState<MemberBundle[]>([]);
  const [memberPackageSelected, setMemberPackageSelected] = useState(false);
  const [memberDurationMinutes, setMemberDurationMinutes] = useState<number | null>(null);

  const singleVisitPackages = useMemo(
    () => packages.filter((p) => (p.total_uses ?? 1) === 1),
    [packages],
  );
  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );
  const effectiveDuration = useMemo(() => {
    if (memberPackageSelected && memberDurationMinutes != null) return memberDurationMinutes;
    return carWashNormalizeDurationMinutes(selectedPackage?.duration_minutes, scheduleSlotMinutes);
  }, [
    memberPackageSelected,
    memberDurationMinutes,
    selectedPackage?.duration_minutes,
    scheduleSlotMinutes,
  ]);
  const slotsNeeded = useMemo(
    () => carWashSlotsNeeded(effectiveDuration, scheduleSlotMinutes),
    [effectiveDuration, scheduleSlotMinutes],
  );
  const payDue = useMemo(() => {
    if (memberPackageSelected) return null;
    return carWashComputePortalPayDue({
      mode: payMode,
      depositAmountBaht: shopDeposit,
      totalBaht: selectedPackage?.price ?? 0,
    });
  }, [memberPackageSelected, payMode, shopDeposit, selectedPackage?.price]);
  const bookableSlots = useMemo(
    () => buildBookableStartSlots(slotAvailability, scheduleSlotMinutes, effectiveDuration),
    [slotAvailability, scheduleSlotMinutes, effectiveDuration],
  );

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/car-wash/session/booking-payment", { credentials: "include" });
        const j = (await res.json().catch(() => ({}))) as {
          bookingPayment?: { portalBookingPaymentMode?: string; depositAmountBaht?: number | null };
        };
        if (!res.ok || cancelled) return;
        setPayMode(normalizeCarWashPortalPaymentMode(j.bookingPayment?.portalBookingPaymentMode));
        setShopDeposit(j.bookingPayment?.depositAmountBaht ?? null);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPackagesLoading(true);
      try {
        const res = await fetch("/api/car-wash/session/packages", { credentials: "include" });
        const j = (await res.json().catch(() => ({}))) as { packages?: ServicePackage[]; error?: string };
        if (!res.ok) {
          if (!cancelled) setErr(j.error ?? "โหลดบริการไม่สำเร็จ");
          return;
        }
        if (!cancelled) setPackages((j.packages ?? []).filter((p) => p.is_active !== false));
      } finally {
        if (!cancelled) setPackagesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    setSelectedPackageId(null);
    setBookingDateKey(dateKey);
    setSelectedSlot("");
    setPayMethod("CASH");
    setPaySlipUrl(null);
    setMemberFound(null);
    setMemberBundles([]);
    setMemberPackageSelected(false);
    setMemberDurationMinutes(null);
    setEditing(null);
    setEditOpen(false);
    setAddOpen(true);
    void loadScheduleForBooking(dateKey);
  }

  function selectSingleVisitPackage(pkg: ServicePackage) {
    setSelectedPackageId(pkg.id);
    setMemberPackageSelected(false);
    setMemberDurationMinutes(null);
    setSelectedSlot("");
  }

  function selectMemberBundle(b: MemberBundle) {
    setSelectedPackageId(b.package_id);
    setMemberPackageSelected(true);
    const pkg = packages.find((p) => p.id === b.package_id);
    setMemberDurationMinutes(
      carWashNormalizeDurationMinutes(pkg?.duration_minutes, scheduleSlotMinutes),
    );
    setCustomerName((prev) => prev.trim() || b.customer_name || "");
    setPlateNumber((prev) => prev.trim() || b.plate_number || "");
    setSelectedSlot("");
  }

  async function lookupMember() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setErr("กรอกเบอร์อย่างน้อย 9 หลักก่อนค้นหา");
      return;
    }
    setMemberBusy(true);
    setErr(null);
    setMemberFound(null);
    setMemberBundles([]);
    setMemberPackageSelected(false);
    try {
      const res = await fetch("/api/car-wash/session/bundles", { credentials: "include" });
      const j = (await res.json().catch(() => ({}))) as { bundles?: MemberBundle[]; error?: string };
      if (!res.ok) {
        setErr(j.error ?? "ค้นหาสมาชิกไม่สำเร็จ");
        return;
      }
      const hits = (j.bundles ?? []).filter((b) => {
        if (!b.is_active) return false;
        if (b.used_uses >= b.total_uses) return false;
        const ph = String(b.customer_phone ?? "").replace(/\D/g, "");
        return ph === digits || ph.endsWith(digits) || digits.endsWith(ph);
      });
      setMemberFound(true);
      setMemberBundles(hits);
      if (hits.length === 1) {
        selectMemberBundle(hits[0]!);
      } else if (hits.length === 0) {
        setMsg("ยังไม่มีลูกค้าเบอร์นี้ — เลือกเมนูรายครั้งแล้วจองได้");
      }
    } finally {
      setMemberBusy(false);
    }
  }

  function openEditModal(b: BookingRow) {
    setErr(null);
    setMsg(null);
    setEditing(b);
    setPhone(b.phone);
    setPlateNumber(b.plateNumber);
    setCustomerName(b.customerName ?? "");
    setSelectedPackageId(b.packageId);
    setMemberPackageSelected(false);
    setMemberDurationMinutes(null);
    setMemberFound(null);
    setMemberBundles([]);
    const dk = new Date(b.scheduledAt).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    const hm = bookingSlotHm(b.scheduledAt);
    setBookingDateKey(dk);
    setSelectedSlot(hm);
    setAddOpen(false);
    setEditOpen(true);
    void loadScheduleForBooking(dk);
  }

  async function deleteBooking(b: BookingRow) {
    if (!window.confirm(`ลบคิว ${b.phone}${b.plateNumber ? ` · ${b.plateNumber}` : ""} ?`)) return;
    setPatchingId(b.id);
    setErr(null);
    try {
      const res = await fetch(`/api/car-wash/bookings/${b.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "ลบไม่สำเร็จ");
        return;
      }
      setMsg("ลบคิวแล้ว");
      await load();
      onQueueChanged?.();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("car-wash-queue-changed"));
      }
    } finally {
      setPatchingId(null);
    }
  }

  useEffect(() => {
    if (!addOpen && !editOpen) return;
    void loadScheduleForBooking(bookingDateKey);
  }, [addOpen, editOpen, bookingDateKey, loadScheduleForBooking]);

  useEffect(() => {
    if ((!addOpen && !editOpen) || selectedPackageId == null) return;
    const active = bookableSlots.find((s) => s.time === selectedSlot && s.available);
    if (active) return;
    setSelectedSlot(bookableSlots.find((s) => s.available)?.time ?? "");
  }, [addOpen, editOpen, selectedPackageId, bookableSlots, selectedSlot]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setErr("กรอกเบอร์อย่างน้อย 9 หลัก");
      return;
    }
    if (selectedPackageId == null) {
      setErr("เลือกบริการก่อนเลือกช่วงเวลา");
      return;
    }
    if (scheduleClosed || !selectedSlot) {
      setErr(scheduleClosed ? "วันนี้ปิดรับจอง" : "เลือกช่วงเวลาจากตาราง");
      return;
    }
    if (payDue != null && payDue > 0 && !editOpen) {
      if ((payMethod === "PROMPTPAY" || payMethod === "TRANSFER") && !paySlipUrl) {
        setErr(payMode === "FULL" ? "แนบสลิปชำระเต็มยอด" : "แนบสลิปมัดจำ");
        return;
      }
    }
    setSaving(true);
    try {
      if (editOpen && editing) {
        const res = await fetch(`/api/car-wash/bookings/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            phone: digits,
            plateNumber: plateNumber.trim() || null,
            customerName: customerName.trim() || null,
            packageId: selectedPackageId,
            scheduledAtLocal: scheduledAtLocalFromSlot(bookingDateKey, selectedSlot),
          }),
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setErr(j.error ?? "แก้ไขไม่สำเร็จ");
          return;
        }
        setMsg("แก้ไขคิวแล้ว");
        setEditOpen(false);
        setEditing(null);
        await load();
        onQueueChanged?.();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("car-wash-queue-changed"));
        }
        return;
      }

      const useMemberPay = memberPackageSelected;
      const res = await fetch("/api/car-wash/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phone: digits,
          plateNumber: plateNumber.trim() || null,
          customerName: customerName.trim() || null,
          packageId: selectedPackageId,
          scheduledAtLocal: scheduledAtLocalFromSlot(bookingDateKey, selectedSlot),
          paymentMethod: !useMemberPay && payDue != null && payDue > 0 ? payMethod : "UNPAID",
          amountPaidBaht: !useMemberPay && payDue != null && payDue > 0 ? payDue : 0,
          paymentSlipUrl: !useMemberPay ? paySlipUrl : null,
          forcePaymentMode: useMemberPay ? "NONE" : null,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; booking?: BookingRow };
      if (!res.ok) {
        setErr(j.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setMsg(
        bookingDateKey === bangkokDateKey()
          ? "บันทึกคิวแล้ว"
          : `บันทึกคิวล่วงหน้าแล้ว — ดูที่จัดการคิววันที่ ${bookingDateKey}`,
      );
      setAddOpen(false);
      if (bookingDateKey !== dateKey) setDateKey(bookingDateKey);
      await load();
      onQueueChanged?.();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("car-wash-queue-changed"));
      }
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
        setBookings((prev) =>
          prev.map((b) =>
            b.id === id
              ? {
                  ...b,
                  ...j.booking!,
                  visitId: j.booking!.visitId ?? b.visitId ?? null,
                }
              : b,
          ),
        );
      } else {
        await load();
      }
      onQueueChanged?.();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("car-wash-queue-changed"));
      }
    } finally {
      setPatchingId(null);
    }
  }

  const bookingsByRound = useMemo(() => {
    const sorted = [...bookings].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    const map = new Map<string, BookingRow[]>();
    for (const b of sorted) {
      const hm = bookingSlotHm(b.scheduledAt);
      const list = map.get(hm) ?? [];
      list.push(b);
      map.set(hm, list);
    }
    return Array.from(map.entries()).map(([timeHm, rows]) => ({ timeHm, rows }));
  }, [bookings]);

  const listInner = (
    <>
      {listLoading ? (
        <p className="text-center text-sm text-[#66638c]">กำลังโหลด…</p>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/60 p-6 text-center text-sm text-[#66638c]">
          ไม่มีคิวในวันนี้ — จองจากลิงก์ลูกค้าหรือกด「เพิ่มคิว」จะขึ้นที่นี่ชุดเดียวกัน
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-[#66638c]">
            เรียงตามรอบเวลา · คิวจากลิงก์ลูกค้าและเพิ่มคิวในร้านใช้ข้อมูลชุดเดียวกัน
          </p>
          {bookingsByRound.map(({ timeHm, rows }) => (
            <section key={timeHm} className="space-y-2" aria-label={`รอบ ${timeHm}`}>
              <div className="flex items-center gap-2">
                <span className="inline-flex min-h-8 items-center rounded-full bg-gradient-to-r from-[#5b61ff] to-[#8d64ff] px-3 text-xs font-black text-white shadow-sm">
                  รอบ {timeHm}
                </span>
                <span className="text-[11px] font-bold tabular-nums text-[#8b87ad]">{rows.length} คิว</span>
                <span className="h-px flex-1 bg-[#ecebff]" aria-hidden />
              </div>
              <ul className="space-y-2.5">
                {rows.map((b) => (
                  <li key={b.id} className={cn(rowCard, !staffQrLanding && "sm:flex sm:justify-between sm:gap-4")}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-sm font-semibold text-[#2e2a58]">{b.phone}</p>
                        {b.visitId != null ? (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-900">
                            เข้าลานแล้ว #{b.visitId}
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#ecebff] px-2 py-0.5 text-[10px] font-bold text-[#4d47b6]">
                            คิวจอง
                          </span>
                        )}
                      </div>
                      {b.plateNumber ? (
                        <p className="mt-0.5 text-xs font-bold uppercase text-[#4d47b6]">{b.plateNumber}</p>
                      ) : null}
                      <p className="mt-0.5 text-xs text-[#5f5a8a]">{b.customerName?.trim() || "—"}</p>
                      {b.packageName ? (
                        <p className="mt-0.5 text-xs font-semibold text-[#4d47b6]">
                          {b.packageName} · {b.durationMinutes} นาที
                        </p>
                      ) : null}
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
                      {b.paymentStatus && b.paymentStatus !== "UNPAID" ? (
                        <p className="mt-1 text-[11px] font-semibold text-emerald-800">
                          ชำระ {b.paymentStatus}
                          {b.amountPaidBaht != null && b.amountPaidBaht > 0
                            ? ` · ฿${b.amountPaidBaht.toLocaleString("th-TH")}`
                            : ""}
                        </p>
                      ) : b.depositAmountBaht != null && b.depositAmountBaht > 0 ? (
                        <p className="mt-1 text-[11px] font-semibold text-amber-800">
                          ค้างมัดจำ ฿{b.depositAmountBaht.toLocaleString("th-TH")}
                        </p>
                      ) : null}
                    </div>
                    <div className={cn("mt-3 flex flex-col gap-2", !staffQrLanding && "sm:mt-0 sm:items-end")}>
                      <CarWashBookingStatusBadge status={b.status} scheduledAt={b.scheduledAt} />
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className={assetRowEditIconButtonClass}
                          aria-label={`แก้ไขคิว ${b.phone}`}
                          title="แก้ไข"
                          disabled={patchingId === b.id}
                          onClick={() => openEditModal(b)}
                        >
                          <IconRowEdit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={assetRowRemoveIconButtonClass}
                          aria-label={`ลบคิว ${b.phone}`}
                          title="ลบ"
                          disabled={patchingId === b.id}
                          onClick={() => void deleteBooking(b)}
                        >
                          <IconRowRemove className="h-4 w-4" />
                        </button>
                      </div>
                      {b.status === "SCHEDULED" || b.status === "ARRIVED" || b.status === "IN_SERVICE" ? (
                        <div className="flex justify-end gap-1" role="group" aria-label="อัปเดตสถานะคิว">
                          {b.status === "SCHEDULED" ? (
                            <>
                              <AppIconToolbarButton
                                title="มาแล้ว · เข้าลาน"
                                ariaLabel="มาแล้ว เข้าลาน"
                                disabled={patchingId === b.id}
                                onClick={() => void patchStatus(b.id, "ARRIVED")}
                                className="text-emerald-700"
                              >
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
            </section>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {err && !addOpen && !editOpen ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p> : null}
      {msg && !addOpen && !editOpen ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{msg}</p> : null}

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
        open={addOpen || editOpen}
        onClose={() => {
          setAddOpen(false);
          setEditOpen(false);
          setEditing(null);
        }}
        title={editOpen ? "แก้ไขคิว" : "เพิ่มคิว"}
        size="lg"
      >
        <form onSubmit={onSave} className="grid max-h-[min(78vh,720px)] gap-3 overflow-y-auto">
          {err ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p> : null}
          {msg && (addOpen || editOpen) ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{msg}</p>
          ) : null}
          {!editOpen ? (
            <p className="text-xs font-semibold text-[#5f5a8a]">
              เลือกบริการและเวลาเหมือนลิงก์ลูกค้า
              {payMode !== "NONE"
                ? ` · จอง: ${payMode === "FULL" ? "ชำระเต็มยอด" : "มัดจำ"}${
                    payMode === "DEPOSIT" && shopDeposit != null
                      ? ` ${shopDeposit.toLocaleString("th-TH")} บาท`
                      : ""
                  }`
                : ""}
            </p>
          ) : null}

          <label className="block text-xs font-medium text-[#4d47b6]">
            วันที่
            <input
              type="date"
              required
              value={bookingDateKey}
              min={bangkokDateKey()}
              onChange={(e) => setBookingDateKey(e.target.value)}
              className="app-input mt-1 min-h-[48px] w-full rounded-xl px-3"
            />
          </label>

          <div className="space-y-2">
            <p className="text-xs font-medium text-[#4d47b6]">เลือกบริการรายครั้ง</p>
            {packagesLoading ? (
              <p className="text-sm text-[#66638c]">กำลังโหลดบริการ…</p>
            ) : singleVisitPackages.length === 0 ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">ยังไม่มีเมนูรายครั้ง</p>
            ) : (
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {singleVisitPackages.map((pkg) => {
                  const active = selectedPackageId === pkg.id && !memberPackageSelected;
                  return (
                    <li key={pkg.id} className="min-h-0 h-full">
                      <button
                        type="button"
                        onClick={() => selectSingleVisitPackage(pkg)}
                        className={cn(
                          "flex h-full w-full flex-col overflow-hidden rounded-xl border text-left transition",
                          active
                            ? "border-[#5b61ff] bg-[#5b61ff]/10 ring-2 ring-[#5b61ff]/35"
                            : "border-[#e8e6f4] bg-white hover:border-[#5b61ff]/40",
                        )}
                      >
                        {pkg.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={pkg.image_url} alt="" className="aspect-square w-full object-cover" />
                        ) : (
                          <div className="flex aspect-square items-center justify-center bg-[#ecebff] text-[10px] font-bold text-[#4d47b6]">
                            บริการ
                          </div>
                        )}
                        <div className="space-y-0.5 p-1.5">
                          <p className="line-clamp-2 min-h-[2rem] text-[10px] font-black leading-tight text-[#1e1b4b]">
                            {pkg.name}
                          </p>
                          <p className="text-[9px] font-semibold text-[#66638c]">
                            {carWashNormalizeDurationMinutes(pkg.duration_minutes, scheduleSlotMinutes)} นาที
                          </p>
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
                  setMemberFound(null);
                  setMemberBundles([]);
                  setMemberPackageSelected(false);
                }}
                className="app-input mt-1 min-h-[48px] w-full rounded-xl px-3"
                autoComplete="tel"
              />
            </label>
            {!editOpen ? (
              <button
                type="button"
                disabled={memberBusy}
                onClick={() => void lookupMember()}
                className="app-btn-soft inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
              >
                {memberBusy ? "กำลังค้นหา…" : "ค้นหาสมาชิก"}
              </button>
            ) : null}
          </div>

          <label className="block text-xs font-medium text-[#4d47b6]">
            ทะเบียนรถ (ไม่บังคับ)
            <input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.slice(0, 64))}
              className="app-input mt-1 min-h-[48px] w-full rounded-xl px-3 uppercase"
              placeholder="เช่น กข 1234"
            />
          </label>

          {!editOpen && memberFound === true && memberBundles.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#4d47b6]">แพ็กเกจสมาชิก (ใช้แทนเมนูรายครั้งได้)</p>
              <div className="flex flex-wrap gap-2">
                {memberBundles.map((b) => {
                  const active = selectedPackageId === b.package_id && memberPackageSelected;
                  const remain = Math.max(0, b.total_uses - b.used_uses);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => selectMemberBundle(b)}
                      className={cn(
                        "inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3 text-xs font-bold",
                        active
                          ? "bg-[#5b61ff] text-white"
                          : "border border-[#e8e6f4] bg-white text-[#4d47b6]",
                      )}
                    >
                      {b.package_name} · เหลือ {remain}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {!editOpen && memberFound === true && memberBundles.length === 0 ? (
            <p className="text-xs font-semibold text-[#66638c]">ไม่พบแพ็กที่เหลือใช้ — เลือกเมนูรายครั้ง</p>
          ) : null}
          {!editOpen && memberFound === false ? (
            <p className="text-xs font-semibold text-[#66638c]">ไม่พบสมาชิก — เลือกเมนูรายครั้งแล้วจองได้</p>
          ) : null}

          <div className="space-y-2">
            <p className="text-xs font-medium text-[#4d47b6]">
              เวลา · ต้องการ {slotsNeeded} สล็อต
              {selectedSlot
                ? ` · เลือก ${selectedSlot}${
                    slotsNeeded > 1
                      ? ` (${slotsNeeded} ช่องติดกัน)`
                      : ""
                  }`
                : ""}
            </p>
            {scheduleLoading ? (
              <p className="text-sm text-[#66638c]">กำลังโหลดตาราง…</p>
            ) : scheduleClosed ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">วันนี้ปิดรับจอง</p>
            ) : selectedPackageId == null ? (
              <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-3 text-xs font-semibold text-amber-900">
                เลือกบริการรายครั้ง (หรือแพ็กสมาชิก) ก่อน จึงเลือกช่วงเวลาได้
              </p>
            ) : (
              <>
                <p className="text-[11px] text-[#8b87ad]">
                  {scheduleOpen}–{scheduleClose} · ทุก {scheduleSlotMinutes} นาที · เวลาไทย
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="listbox" aria-label="เลือกช่วงเวลา">
                  {bookableSlots.map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      disabled={!s.available && s.time !== selectedSlot}
                      onClick={() => (s.available || s.time === selectedSlot) && setSelectedSlot(s.time)}
                      className={cn(
                        "min-h-[44px] rounded-xl border text-sm font-bold tabular-nums",
                        s.available || s.time === selectedSlot
                          ? selectedSlot === s.time
                            ? "border-[#5b61ff] bg-[#5b61ff] text-white"
                            : "border-violet-200 bg-white text-[#4d47b6]"
                          : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through",
                      )}
                    >
                      <span>{s.time}</span>
                      {!s.available && s.status === "PAST" ? (
                        <span className="ml-1 text-[10px] font-semibold normal-case">เลยเวลา</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <label className="block text-xs font-medium text-[#4d47b6]">
            ชื่อ (ไม่บังคับ)
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value.slice(0, 160))}
              className="app-input mt-1 min-h-[48px] w-full rounded-xl px-3"
              autoComplete="name"
            />
          </label>

          {!editOpen && payDue != null && payDue > 0 ? (
            <CarWashPaymentPanel
              amountBaht={payDue}
              method={payMethod}
              slipUrl={paySlipUrl}
              onMethodChange={setPayMethod}
              onSlipUrlChange={setPaySlipUrl}
              disabled={saving}
            />
          ) : null}
          {!editOpen && memberPackageSelected ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
              ใช้แพ็กเหมา — ไม่ต้องชำระตอนจอง
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="app-btn-soft min-h-[48px] rounded-xl px-4"
              onClick={() => {
                setAddOpen(false);
                setEditOpen(false);
                setEditing(null);
              }}
            >
              ยกเลิก
            </button>
            <button type="submit" disabled={saving} className="app-btn-primary min-h-[48px] rounded-xl px-4 disabled:opacity-50">
              {saving ? "กำลังบันทึก…" : editOpen ? "บันทึกการแก้ไข" : "บันทึกคิว"}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
