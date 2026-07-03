"use client";

import { useState, type FormEvent } from "react";
import { AppPublicCheckInGlassPage, appPublicCheckInGlassCardClass } from "@/components/app-templates";

type PortalBooking = {
  id: string;
  roomNumber: string | null;
  checkInAt: string;
  checkOutAt: string;
  status: string;
  guestName: string;
};

export function HotelResortPortalClient({ ownerId, trialSessionId }: { ownerId: string; trialSessionId?: string }) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<PortalBooking[]>([]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/hotel-resort/public/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, trialSessionId, phone: phone.trim() }),
      });
      const j = (await res.json().catch(() => ({}))) as { bookings?: PortalBooking[]; error?: string };
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      setBookings(j.bookings ?? []);
    } catch (e2) {
      setBookings([]);
      setError(e2 instanceof Error ? e2.message : "ค้นหาไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppPublicCheckInGlassPage>
      <div className="relative mx-auto max-w-md space-y-4">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-black tracking-tight text-[#1e1b4b]">ตรวจสอบสถานะการจอง</h1>
          <p className="mt-1 text-sm text-[#6b6894]">กรอกเบอร์โทรเพื่อดูรายการจองของคุณ</p>
        </div>
        <form onSubmit={submit} className={appPublicCheckInGlassCardClass}>
          <div className="px-5 py-5 sm:px-6">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-2xl border border-white/70 bg-white/60 px-4 py-3.5 text-sm font-semibold text-[#1e1b4b] outline-none focus:border-[#5b61ff]/50 focus:ring-2 focus:ring-[#5b61ff]/15"
              placeholder="เบอร์โทรที่ใช้จอง"
              autoComplete="tel"
              required
            />
            <button type="submit" disabled={busy} className="app-btn-primary mt-3 min-h-[52px] w-full rounded-2xl text-base font-black">
              {busy ? "กำลังค้นหา..." : "ค้นหาการจอง"}
            </button>
          </div>
        </form>
        {error ? <p className="text-center text-sm font-semibold text-rose-600">{error}</p> : null}
        <div className="space-y-2">
          {bookings.map((b) => (
            <article key={b.id} className={appPublicCheckInGlassCardClass}>
              <div className="px-5 py-4 sm:px-6">
                <p className="text-sm font-black text-[#1e1b4b]">ห้อง {b.roomNumber ?? "-"}</p>
                <p className="mt-1 text-xs font-semibold text-[#66638c]">{new Date(b.checkInAt).toLocaleDateString("th-TH")} - {new Date(b.checkOutAt).toLocaleDateString("th-TH")}</p>
                <p className="mt-2 inline-flex rounded-full border border-white/60 bg-white/70 px-2.5 py-1 text-[11px] font-black text-[#4d47b6]">{b.status}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppPublicCheckInGlassPage>
  );
}
