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
  id: string;
  guestName: string;
  guestPhone: string;
  roomNumber: string | null;
  floor: number | null;
  roomTypeName: string | null;
  checkInAt: string;
  checkOutAt: string;
  status: string;
  statusLabel: string;
  totalBaht: number;
  amountPaidBaht: number;
  depositAmountBaht: number | null;
  paymentStatus: string;
  paymentStatusLabel: string;
  paymentMethod: string;
  paymentSlipUrl: string | null;
  depositSlipUrl: string | null;
  note: string | null;
};

type PropertyInfo = {
  propertyName: string;
  logoUrl: string | null;
  contactPhone: string | null;
  address: string | null;
  checkInTime: string;
  checkOutTime: string;
  lineId: string | null;
};

function formatThDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
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

export function HotelResortPortalBookingClient({
  ownerId,
  bookingId,
  phone,
  trialSessionId,
}: {
  ownerId: string;
  bookingId: string;
  phone: string;
  trialSessionId?: string;
  baseUrl?: string;
}) {
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [property, setProperty] = useState<PropertyInfo | null>(null);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const lb = useAppImageLightbox();

  const homeHref =
    trialSessionId && trialSessionId !== "prod"
      ? `/hotel-resort/${ownerId}?t=${encodeURIComponent(trialSessionId)}`
      : `/hotel-resort/${ownerId}`;

  useEffect(() => {
    const q = new URLSearchParams({
      ownerId,
      bookingId,
      phone,
    });
    if (trialSessionId) q.set("t", trialSessionId);
    setBusy(true);
    setErr(null);
    void fetch(`/api/hotel-resort/public/portal/booking?${q}`, { cache: "no-store" })
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
                {property.propertyName}
              </h1>
              <p className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                {booking.statusLabel}
              </p>
            </div>

            <section className={cn(appPublicCheckInGlassCardClass, "px-5 py-2 sm:px-6")}>
              <Row label="ผู้จอง" value={booking.guestName} />
              <Row label="เบอร์โทร" value={booking.guestPhone} />
              <Row
                label="ห้อง"
                value={[
                  booking.roomTypeName,
                  booking.roomNumber ? `ห้อง ${booking.roomNumber}` : null,
                  booking.floor != null ? `ชั้น ${booking.floor}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "-"}
              />
              <Row label="เช็คอิน" value={`${formatThDate(booking.checkInAt)} · ${property.checkInTime}`} />
              <Row label="เช็คเอาต์" value={`${formatThDate(booking.checkOutAt)} · ${property.checkOutTime}`} />
              <Row label="ยอดพัก" value={`฿${booking.totalBaht.toLocaleString("th-TH")}`} />
              <Row
                label="ชำระแล้ว"
                value={`฿${booking.amountPaidBaht.toLocaleString("th-TH")} · ${booking.paymentStatusLabel}`}
              />
              {booking.amountPaidBaht < booking.totalBaht ? (
                <Row
                  label="คงเหลือ"
                  value={`฿${Math.max(0, booking.totalBaht - booking.amountPaidBaht).toLocaleString("th-TH")}`}
                />
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

            {property.contactPhone || property.address ? (
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
                {property.address ? <p>{property.address}</p> : null}
              </section>
            ) : null}

            <Link
              href={homeHref}
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
