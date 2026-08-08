"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AppImageLightbox,
  AppImageThumb,
  AppPublicCheckInGlassPage,
  appPublicCheckInGlassCardClass,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";

type BookingDetail = {
  id: number;
  customerName: string;
  customerPhone: string;
  teamName: string;
  courtName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  finalPrice: number;
  amountPaidBaht: number;
  remainingBaht: number;
  paymentStatus: string;
  paymentStatusLabel: string;
  paymentMethod: string;
  paymentMethodLabel: string;
  paymentSlipDataUrl: string;
  status: string;
  statusLabel: string;
};

type PropertyInfo = {
  venueName: string;
  contactPhone: string | null;
  venueAddress: string | null;
  contactLine: string | null;
};

function formatMoney(value: number) {
  return `฿${value.toLocaleString("th-TH")}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#e4e0f5]/80 py-3 last:border-0">
      <span className="shrink-0 text-xs font-bold text-[#8b87b8]">{label}</span>
      <span className="text-right text-sm font-black text-[#1e1b4b]">{value}</span>
    </div>
  );
}

export function FootballTurfPortalBookingClient({
  ownerId,
  bookingId,
  phone,
  trialSessionId,
}: {
  ownerId: string;
  bookingId: string;
  phone: string;
  trialSessionId?: string;
}) {
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [property, setProperty] = useState<PropertyInfo | null>(null);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const lb = useAppImageLightbox();

  const homeHref =
    trialSessionId && trialSessionId !== "prod"
      ? `/football-turf/book/${ownerId}?t=${encodeURIComponent(trialSessionId)}`
      : `/football-turf/book/${ownerId}`;

  useEffect(() => {
    const q = new URLSearchParams({
      ownerId,
      bookingId,
      phone,
    });
    if (trialSessionId) q.set("t", trialSessionId);
    setBusy(true);
    setErr(null);
    void fetch(`/api/football-turf/public/booking?${q}`, { cache: "no-store" })
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as {
          property?: PropertyInfo;
          booking?: BookingDetail;
          error?: string;
        };
        if (!res.ok) throw new Error(j.error ?? "โหลดไม่สำเร็จ");
        setProperty(j.property ?? null);
        setBooking(j.booking ?? null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"))
      .finally(() => setBusy(false));
  }, [ownerId, bookingId, phone, trialSessionId]);

  const slipUrl = booking?.paymentSlipDataUrl?.trim() || null;

  return (
    <AppPublicCheckInGlassPage>
      <div className="relative mx-auto max-w-md space-y-4">
        {busy ? (
          <p className="py-16 text-center text-sm font-semibold text-[#66638c]">กำลังโหลด…</p>
        ) : err ? (
          <div className={cn(appPublicCheckInGlassCardClass, "p-6 text-center")}>
            <p className="text-sm font-semibold text-rose-600">{err}</p>
            <Link
              href={homeHref}
              className="app-btn-primary mt-4 inline-flex min-h-[44px] items-center rounded-[1rem] px-5 text-sm font-black"
            >
              กลับหน้าจอง
            </Link>
          </div>
        ) : booking && property ? (
          <>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#8b87b8]">การจอง</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-[#1e1b4b]">
                {property.venueName}
              </h1>
              <p className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                {booking.statusLabel}
              </p>
            </div>

            <section className={cn(appPublicCheckInGlassCardClass, "px-5 py-2 sm:px-6")}>
              <Row label="ผู้จอง" value={booking.customerName} />
              <Row label="เบอร์โทร" value={booking.customerPhone} />
              {booking.teamName ? <Row label="ทีม" value={booking.teamName} /> : null}
              <Row label="สนาม" value={booking.courtName} />
              <Row
                label="วันเวลา"
                value={`${booking.bookingDate} · ${booking.startTime}-${booking.endTime}`}
              />
              <Row label="ยอดจอง" value={formatMoney(booking.finalPrice)} />
              <Row
                label="ชำระแล้ว"
                value={`${formatMoney(booking.amountPaidBaht)} · ${booking.paymentStatusLabel}`}
              />
              {booking.remainingBaht > 0 ? (
                <Row label="คงเหลือ" value={formatMoney(booking.remainingBaht)} />
              ) : null}
              <Row label="วิธีชำระ" value={booking.paymentMethodLabel} />
            </section>

            {slipUrl ? (
              <section className={cn(appPublicCheckInGlassCardClass, "p-4")}>
                <p className="mb-1 text-xs font-bold text-[#8b87b8]">สลิปชำระ</p>
                <p className="mb-2 text-[11px] font-semibold text-[#66638c]">กดรูปเพื่อดูขนาดใหญ่</p>
                <AppImageThumb
                  src={slipUrl}
                  alt="สลิปชำระ"
                  onOpen={() => lb.open(slipUrl)}
                  className="h-24 w-24"
                />
              </section>
            ) : null}

            {property.contactPhone || property.venueAddress ? (
              <section
                className={cn(
                  appPublicCheckInGlassCardClass,
                  "space-y-1 px-5 py-4 text-sm font-semibold text-[#66638c]",
                )}
              >
                {property.contactPhone ? (
                  <p>
                    <a className="font-bold text-[#4d47b6]" href={`tel:${property.contactPhone}`}>
                      {property.contactPhone}
                    </a>
                  </p>
                ) : null}
                {property.venueAddress ? <p>{property.venueAddress}</p> : null}
              </section>
            ) : null}

            <Link
              href={homeHref}
              className="app-btn-primary flex min-h-[52px] w-full items-center justify-center rounded-[1rem] text-sm font-black"
            >
              กลับหน้าจอง
            </Link>
          </>
        ) : null}
      </div>
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />
    </AppPublicCheckInGlassPage>
  );
}
