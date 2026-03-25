"use client";

import { useCallback, useEffect, useState } from "react";
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

export function BarberBookingsClient({ initialDateKey }: { initialDateKey: string }) {
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
      setMsg("บันทึกการจองแล้ว");
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
    <div className="space-y-8">
      {err ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-100">{err}</p>
      ) : null}
      {msg ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-100">
          {msg}
        </p>
      ) : null}

      <form
        onSubmit={onSave}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-slate-900">เพิ่มการจอง</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-xs font-semibold text-slate-700">
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
              className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-200 px-3 text-base"
            />
          </label>
          <button
            type="button"
            onClick={() => void onSearchPhone()}
            disabled={searchLoading}
            className="min-h-[48px] shrink-0 rounded-xl border border-slate-300 bg-slate-100 px-4 text-sm font-bold text-slate-800 hover:bg-slate-200 disabled:opacity-50"
          >
            {searchLoading ? "กำลังค้นหา…" : "ค้นหาในระบบ"}
          </button>
        </div>
        <label className="block text-xs font-semibold text-slate-700">
          ชื่อแสดง (ไม่บังคับ)
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value.slice(0, 100))}
            className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-200 px-3 text-base"
            placeholder="ชื่อลูกค้า"
          />
        </label>
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            วันและเวลานัด
            <input
              type="datetime-local"
              value={scheduledAtLocal}
              onChange={(e) => setScheduledAtLocal(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-200 px-3 text-base"
            />
          </label>
          <p className="mt-1 text-[11px] text-slate-500">
            ระบบบันทึกเป็นวันเวลาไทย — ควรตั้งค่าเครื่องหรือเลือกเวลาให้ตรงกับเวลาที่ร้านใช้จริง
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="min-h-[48px] w-full rounded-xl bg-[#0000BF] px-4 py-3 text-sm font-bold text-white hover:bg-[#0000a6] disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก…" : "บันทึกการจอง"}
        </button>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">รายการจองตามวัน</h2>
          <label className="text-xs font-semibold text-slate-700">
            เลือกวัน
            <input
              type="date"
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
              className="ml-2 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
        {listLoading ? (
          <p className="py-8 text-center text-sm text-slate-500">กำลังโหลด…</p>
        ) : bookings.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">ไม่มีคิวในวันนี้</p>
        ) : (
          <ul className="space-y-3">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-3 sm:flex sm:items-start sm:justify-between sm:gap-4"
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-slate-900">{b.phone}</p>
                  <p className="text-sm text-slate-700">{b.customerName?.trim() || "—"}</p>
                  <p className="mt-1 text-sm font-medium text-[#0000BF]">
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
                <div className="mt-3 flex flex-col items-stretch gap-2 sm:mt-0 sm:min-w-[200px] sm:items-end">
                  <BarberBookingStatusBadge status={b.status} scheduledAt={new Date(b.scheduledAt)} />
                  {b.status === "SCHEDULED" ? (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button
                        type="button"
                        disabled={patchingId === b.id}
                        onClick={() => void patchStatus(b.id, "ARRIVED")}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        มาแล้ว
                      </button>
                      <button
                        type="button"
                        disabled={patchingId === b.id}
                        onClick={() => void patchStatus(b.id, "NO_SHOW")}
                        className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-950 hover:bg-amber-100 disabled:opacity-50"
                      >
                        ไม่มา
                      </button>
                      <button
                        type="button"
                        disabled={patchingId === b.id}
                        onClick={() => void patchStatus(b.id, "CANCELLED")}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
