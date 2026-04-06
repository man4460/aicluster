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
import { BarberDashboardBackLink } from "@/systems/barber/components/BarberDashboardBackLink";
import {
  barberIconToolbarGroupClass,
  barberInlineAlertErrorClass,
  barberInlineAlertSuccessClass,
  barberListRowCardClass,
  barberPageStackClass,
  barberSectionActionsRowClass,
  barberSectionFirstClass,
} from "@/systems/barber/components/barber-ui-tokens";
import { BarberBookingStatusBadge } from "./BarberBookingStatusBadge";

type BookingRow = {
  id: number;
  phone: string;
  customerName: string | null;
  scheduledAt: string;
  status: string;
  barberCustomerId: number | null;
};

function defaultNextSlotBangkok(): string {
  const d = new Date(Date.now() + 30 * 60 * 1000);
  const ymd = d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${ymd}T${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

export function BarberBookingsClient({
  initialDateKey,
  showDashboardBackLink = true,
}: {
  initialDateKey: string;
  /** ปิดเมื่อหน้าพนักงานมีปุ่มกลับแดชบอร์ดอยู่แล้ว */
  showDashboardBackLink?: boolean;
}) {
  const [dateKey, setDateKey] = useState(initialDateKey);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [barberCustomerId, setBarberCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [scheduledAtLocal, setScheduledAtLocal] = useState(defaultNextSlotBangkok);
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
    setScheduledAtLocal(defaultNextSlotBangkok());
    setAddOpen(true);
  }

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
        error?: string;
      };
      if (!res.ok) {
        setErr(j.error ?? "ค้นหาไม่สำเร็จ");
        return;
      }
      if (j.customer) {
        setBarberCustomerId(j.customer.id);
        setCustomerName(j.customer.name?.trim() || "");
        setMsg("พบลูกค้าในระบบ — ชื่อถูกเติมให้แล้ว (แก้ไขได้)");
      } else {
        setBarberCustomerId(null);
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
      setScheduledAtLocal(defaultNextSlotBangkok());
      setAddOpen(false);
      setPhone("");
      setBarberCustomerId(null);
      setCustomerName("");
    } finally {
      setSaving(false);
    }
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
    <div className={barberPageStackClass}>
      {err && !addOpen ? <p className={barberInlineAlertErrorClass}>{err}</p> : null}
      {msg && !addOpen ? <p className={barberInlineAlertSuccessClass}>{msg}</p> : null}

      <section className={barberSectionFirstClass} aria-label="คิวตามวัน">
        <AppSectionHeader
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
                  className="app-input ml-0 mt-1 block min-h-[44px] w-full max-w-[11.5rem] rounded-xl px-3 py-2 text-sm sm:ml-2 sm:mt-0 sm:inline-block sm:w-auto"
                />
              </label>
              <div className={cn(barberSectionActionsRowClass, "shrink-0 justify-end")}>
                {showDashboardBackLink ? <BarberDashboardBackLink /> : null}
                <button
                  type="button"
                  onClick={openAddModal}
                  className="app-btn-primary min-h-[44px] rounded-xl px-4 py-2.5 text-sm font-semibold"
                >
                  เพิ่มคิว
                </button>
              </div>
            </div>
          }
        />
        {listLoading ? (
          <p className="rounded-lg bg-[#f8f7ff] px-4 py-3 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#dcd8f0] py-10 text-center text-sm text-[#66638c]">
            ไม่มีคิวในวันนี้
          </div>
        ) : (
          <ul className="space-y-2.5">
            {bookings.map((b) => (
              <li
                key={b.id}
                className={cn(barberListRowCardClass, "sm:flex sm:items-start sm:justify-between sm:gap-4")}
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
                <div className="mt-3 flex flex-col items-stretch gap-2 sm:mt-0 sm:min-w-[140px] sm:items-end">
                  <BarberBookingStatusBadge status={b.status} scheduledAt={new Date(b.scheduledAt)} />
                  {b.status === "SCHEDULED" ? (
                    <div
                      className={cn(barberIconToolbarGroupClass, "justify-end")}
                      role="group"
                      aria-label="อัปเดตสถานะคิว"
                    >
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
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {addOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={() => closeAddModal()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="barber-add-booking-title"
            className="max-h-[min(92vh,640px)] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[#ecebff] bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-[#ecebff] bg-white px-5 py-4">
              <div>
                <h2 id="barber-add-booking-title" className="text-lg font-bold text-[#2e2a58]">
                  เพิ่มคิว
                </h2>
                <p className="mt-1 text-xs text-[#66638c]">กรอกเบอร์ วันเวลานัด แล้วบันทึก</p>
              </div>
              <button
                type="button"
                onClick={() => closeAddModal()}
                className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-[#66638c] hover:bg-[#f4f3fb] hover:text-[#2e2a58]"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>
            <form onSubmit={onSave} className="grid gap-3 px-5 py-4">
              {err ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100">{err}</p>
              ) : null}
              {msg ? (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 ring-1 ring-emerald-100">
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
                      setBarberCustomerId(null);
                    }}
                    placeholder="0812345678"
                    className="app-input mt-1 min-h-[48px] w-full rounded-xl px-3 text-base"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void onSearchPhone()}
                  disabled={searchLoading}
                  className="app-btn-soft min-h-[48px] shrink-0 rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
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
                  className="app-input mt-1 min-h-[48px] w-full rounded-xl px-3 text-base"
                  placeholder="ชื่อลูกค้า"
                />
              </label>
              <div>
                <label className="block text-xs font-medium text-[#4d47b6]">
                  วันและเวลานัด
                  <input
                    type="datetime-local"
                    value={scheduledAtLocal}
                    onChange={(e) => setScheduledAtLocal(e.target.value)}
                    className="app-input mt-1 min-h-[48px] w-full rounded-xl px-3 text-base"
                  />
                </label>
                <p className="mt-1 text-[11px] text-[#8b87ad]">บันทึกเป็นเวลาไทย — ตั้งค่าเครื่องให้ตรงร้าน</p>
              </div>
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => closeAddModal()}
                  className="app-btn-soft min-h-[48px] rounded-xl px-4 py-3 text-sm font-semibold text-[#2e2a58]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="app-btn-primary min-h-[48px] rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? "กำลังบันทึก…" : "บันทึกคิว"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
