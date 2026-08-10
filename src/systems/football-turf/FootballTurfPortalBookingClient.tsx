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
  depositAmountBaht?: number | null;
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

type SummaryInfo = {
  slotCount: number;
  totalFinalBaht: number;
  totalPaidBaht: number;
  remainingBaht: number;
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
  extraIds = [],
}: {
  ownerId: string;
  bookingId: string;
  phone: string;
  trialSessionId?: string;
  extraIds?: string[];
}) {
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [property, setProperty] = useState<PropertyInfo | null>(null);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [summary, setSummary] = useState<SummaryInfo | null>(null);
  const lb = useAppImageLightbox();
  const extraIdsKey = extraIds.join(",");

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
    const ids = [bookingId, ...extraIdsKey.split(",").filter(Boolean)];
    if (ids.length > 1) q.set("ids", ids.join(","));
    setBusy(true);
    setErr(null);
    void fetch(`/api/football-turf/public/booking?${q}`, { cache: "no-store" })
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as {
          property?: PropertyInfo;
          booking?: BookingDetail;
          bookings?: BookingDetail[];
          summary?: SummaryInfo;
          error?: string;
        };
        if (!res.ok) throw new Error(j.error ?? "โหลดไม่สำเร็จ");
        setProperty(j.property ?? null);
        setBooking(j.booking ?? null);
        setBookings(j.bookings?.length ? j.bookings : j.booking ? [j.booking] : []);
        setSummary(j.summary ?? null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"))
      .finally(() => setBusy(false));
  }, [ownerId, bookingId, phone, trialSessionId, extraIdsKey]);

  const slipUrl = bookings.find((b) => b.paymentSlipDataUrl?.trim())?.paymentSlipDataUrl?.trim() || null;
  const primary = booking;
  const slipIsDeposit =
    primary != null &&
    primary.depositAmountBaht != null &&
    primary.depositAmountBaht > 0 &&
    (summary?.totalFinalBaht ?? primary.finalPrice) > primary.depositAmountBaht;
  const teamLabel = primary?.teamName?.trim() || "ทีม";
  const totalFinal = summary?.totalFinalBaht ?? primary?.finalPrice ?? 0;
  const totalPaid = summary?.totalPaidBaht ?? primary?.amountPaidBaht ?? 0;
  const remaining = summary?.remainingBaht ?? primary?.remainingBaht ?? 0;

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
        ) : primary && property ? (
          <>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#8b87b8]">การจอง</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1e1b4b] sm:text-4xl">
                {property.venueName}
              </h1>
              <p className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                {primary.statusLabel}
              </p>
            </div>

            <section className={cn(appPublicCheckInGlassCardClass, "px-5 py-2 sm:px-6")}>
              <Row label="ทีม" value={teamLabel} />
              <Row label="สนาม" value={primary.courtName} />
              <Row label="วันที่" value={primary.bookingDate} />
              {bookings.length > 1 ? (
                <div className="border-b border-[#e4e0f5]/80 py-3">
                  <p className="text-xs font-bold text-[#8b87b8]">ช่วงเวลา ({bookings.length} รอบ)</p>
                  <ul className="mt-2 space-y-1.5">
                    {bookings.map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center justify-between gap-2 text-sm font-black text-[#1e1b4b]"
                      >
                        <span>
                          {b.startTime}–{b.endTime}
                        </span>
                        <span className="text-xs font-bold text-[#66638c]">{formatMoney(b.finalPrice)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Row label="เวลา" value={`${primary.startTime}-${primary.endTime}`} />
              )}
              <Row label="ยอดจอง" value={formatMoney(totalFinal)} />
              <Row
                label="ชำระแล้ว"
                value={`${formatMoney(totalPaid)} · ${primary.paymentStatusLabel}`}
              />
              {remaining > 0 ? <Row label="คงเหลือ" value={formatMoney(remaining)} /> : null}
              <Row label="วิธีชำระ" value={primary.paymentMethodLabel} />
            </section>

            {slipUrl ? (
              <section className={cn(appPublicCheckInGlassCardClass, "p-4")}>
                <p className="mb-1 text-xs font-bold text-[#8b87b8]">
                  {slipIsDeposit ? "สลิปมัดจำ" : "สลิปชำระ"}
                </p>
                <AppImageThumb
                  src={slipUrl}
                  alt={slipIsDeposit ? "สลิปมัดจำ" : "สลิปชำระ"}
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
