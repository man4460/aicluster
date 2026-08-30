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

type Detail = {
  id: number;
  licensePlate: string;
  customerName: string | null;
  customerPhone: string | null;
  siteName: string;
  spotCode: string | null;
  zoneLabel: string | null;
  sortFloor: number | null;
  scheduledStart: string;
  scheduledEnd: string | null;
  days: number;
  statusLabel: string;
  totalBaht: number;
  amountPaidBaht: number;
  remainingBaht: number;
  depositAmountBaht: number;
  paymentStatusLabel: string;
  paymentMethodLabel: string | null;
  paymentSlipUrl: string | null;
  depositSlipUrl: string | null;
};

type Property = {
  name: string;
  logoUrl: string | null;
  contactPhone: string | null;
  address: string | null;
  lineId: string | null;
};

function formatMoney(value: number) {
  return `฿${value.toLocaleString("th-TH")}`;
}

function formatThDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#e4e0f5]/80 py-3 last:border-0">
      <span className="shrink-0 text-xs font-bold text-[#8b87b8]">{label}</span>
      <span className="text-right text-sm font-black text-[#1e1b4b]">{value}</span>
    </div>
  );
}

export function ParkingPortalBookingClient({
  ownerId,
  bookingId,
  phone,
  trialSessionId,
}: {
  ownerId: string;
  bookingId: string;
  phone: string;
  trialSessionId: string;
}) {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Detail | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const lb = useAppImageLightbox();
  const home =
    trialSessionId !== "prod"
      ? `/parking/${ownerId}?t=${encodeURIComponent(trialSessionId)}`
      : `/parking/${ownerId}`;

  useEffect(() => {
    const q = new URLSearchParams({ ownerId, bookingId, phone });
    if (trialSessionId !== "prod") q.set("t", trialSessionId);
    setBusy(true);
    setError(null);
    void fetch(`/api/parking/public/portal/booking?${q}`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as {
          booking?: Detail;
          property?: Property;
          error?: string;
        };
        if (!res.ok || !data.booking || !data.property) {
          throw new Error(data.error || "โหลดไม่สำเร็จ");
        }
        setBooking(data.booking);
        setProperty(data.property);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "โหลดไม่สำเร็จ"))
      .finally(() => setBusy(false));
  }, [bookingId, ownerId, phone, trialSessionId]);

  return (
    <AppPublicCheckInGlassPage>
      <div className="relative mx-auto max-w-md space-y-4">
        {busy ? (
          <p className="py-16 text-center text-sm font-semibold text-[#66638c]">กำลังโหลด…</p>
        ) : error ? (
          <div className={cn(appPublicCheckInGlassCardClass, "p-6 text-center")}>
            <p className="text-sm font-semibold text-rose-600">{error}</p>
            <Link
              href={home}
              className="app-btn-primary mt-4 inline-flex min-h-[44px] items-center rounded-[1rem] px-5 text-sm font-black"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        ) : booking && property ? (
          <>
            <div className="text-center">
              {property.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={property.logoUrl}
                  alt=""
                  className="mx-auto mb-3 h-14 w-14 rounded-full object-cover ring-2 ring-white/70"
                />
              ) : null}
              <p className="text-xs font-bold uppercase tracking-widest text-[#8b87b8]">การจอง</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-[#1e1b4b]">
                {property.name}
              </h1>
              <p className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                {booking.statusLabel}
              </p>
            </div>

            <section className={cn(appPublicCheckInGlassCardClass, "px-5 py-2 sm:px-6")}>
              <Row label="ผู้จอง" value={booking.customerName || "—"} />
              <Row label="เบอร์โทร" value={booking.customerPhone || phone || "—"} />
              <Row label="ทะเบียนรถ" value={booking.licensePlate} />
              <Row
                label="ช่องจอด"
                value={
                  [
                    booking.spotCode ? `ช่อง ${booking.spotCode}` : null,
                    booking.siteName,
                    booking.zoneLabel,
                    booking.sortFloor ? `ชั้น ${booking.sortFloor}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"
                }
              />
              <Row label="วันเริ่มจอด" value={formatThDate(booking.scheduledStart)} />
              <Row
                label="วันสิ้นสุด"
                value={booking.scheduledEnd ? formatThDate(booking.scheduledEnd) : "—"}
              />
              <Row label="จำนวนวัน" value={`${booking.days} วัน`} />
              <Row label="ยอดจอง" value={formatMoney(booking.totalBaht)} />
              <Row
                label="ชำระแล้ว"
                value={`${formatMoney(booking.amountPaidBaht)} · ${booking.paymentStatusLabel}`}
              />
              {booking.paymentMethodLabel ? (
                <Row label="ช่องทาง" value={booking.paymentMethodLabel} />
              ) : null}
              {booking.remainingBaht > 0 ? (
                <Row label="คงเหลือ" value={formatMoney(booking.remainingBaht)} />
              ) : null}
            </section>

            {booking.depositSlipUrl || booking.paymentSlipUrl ? (
              <section className={cn(appPublicCheckInGlassCardClass, "space-y-4 p-4")}>
                {booking.depositSlipUrl ? (
                  <div>
                    <p className="mb-1 text-xs font-bold text-[#8b87b8]">สลิปมัดจำ / ชำระตอนจอง</p>
                    <p className="mb-2 text-[11px] font-semibold text-[#66638c]">กดรูปเพื่อดูขนาดใหญ่</p>
                    <AppImageThumb
                      src={booking.depositSlipUrl}
                      alt="สลิปมัดจำ / ชำระตอนจอง"
                      onOpen={() => lb.open(booking.depositSlipUrl!)}
                      className="h-24 w-24"
                    />
                  </div>
                ) : null}
                {booking.paymentSlipUrl ? (
                  <div>
                    <p className="mb-1 text-xs font-bold text-[#8b87b8]">สลิปชำระเพิ่ม</p>
                    <p className="mb-2 text-[11px] font-semibold text-[#66638c]">กดรูปเพื่อดูขนาดใหญ่</p>
                    <AppImageThumb
                      src={booking.paymentSlipUrl}
                      alt="สลิปชำระเพิ่ม"
                      onOpen={() => lb.open(booking.paymentSlipUrl!)}
                      className="h-24 w-24"
                    />
                  </div>
                ) : null}
              </section>
            ) : null}

            {property.contactPhone || property.address || property.lineId ? (
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
                {property.lineId ? <p>LINE: {property.lineId}</p> : null}
                {property.address ? <p>{property.address}</p> : null}
              </section>
            ) : null}

            <Link
              href={home}
              className="app-btn-primary flex min-h-[52px] w-full items-center justify-center rounded-[1rem] text-sm font-black"
            >
              กลับหน้าหลัก
            </Link>
          </>
        ) : null}
      </div>
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />
    </AppPublicCheckInGlassPage>
  );
}
