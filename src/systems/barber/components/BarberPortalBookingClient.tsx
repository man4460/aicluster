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
import { barberPublicPortalUrl } from "@/lib/barber/public-url";

type BookingDetail = {
  id: number;
  customerName: string;
  customerPhone: string;
  packageName: string;
  stylistName: string | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priceBaht: number | null;
  amountPaidBaht?: number;
  remainingBaht?: number | null;
  paymentStatus?: string;
  paymentMethod?: string;
  depositAmountBaht?: number | null;
  depositSlipUrl?: string | null;
  paymentSlipUrl?: string | null;
  status: string;
  statusLabel: string;
};

type ShopInfo = {
  displayName: string;
  contactPhone: string | null;
  address: string | null;
  contactLine: string | null;
};

function formatMoney(value: number) {
  return `฿${value.toLocaleString("th-TH")}`;
}

function paymentStatusLabel(status?: string): string {
  if (status === "PAID") return "ชำระแล้ว";
  if (status === "PARTIAL") return "ชำระบางส่วน";
  if (status === "PENDING_REVIEW") return "รอตรวจสลิป";
  return "ยังไม่ชำระ";
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#e4e0f5]/80 py-3 last:border-0">
      <span className="shrink-0 text-xs font-bold text-[#8b87b8]">{label}</span>
      <span className="text-right text-sm font-black text-[#1e1b4b]">{value}</span>
    </div>
  );
}

export function BarberPortalBookingClient({
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
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const slipLb = useAppImageLightbox();

  const homeHref = barberPublicPortalUrl("", ownerId, trialSessionId || "prod");

  useEffect(() => {
    const q = new URLSearchParams({ ownerId, bookingId, phone });
    if (trialSessionId) q.set("t", trialSessionId);
    setBusy(true);
    setErr(null);
    void fetch(`/api/barber/public/portal/booking?${q}`, { cache: "no-store" })
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as {
          shop?: ShopInfo;
          booking?: BookingDetail;
          error?: string;
        };
        if (!res.ok) throw new Error(j.error ?? "โหลดไม่สำเร็จ");
        setShop(j.shop ?? null);
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
              กลับหน้าจอง
            </Link>
          </div>
        ) : booking && shop ? (
          <>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#8b87b8]">สรุปการจอง</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1e1b4b] sm:text-4xl">
                {shop.displayName}
              </h1>
              <p className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                {booking.statusLabel}
              </p>
            </div>

            <section className={cn(appPublicCheckInGlassCardClass, "px-5 py-2 sm:px-6")}>
              <Row label="ชื่อ" value={booking.customerName} />
              <Row label="เบอร์โทร" value={booking.customerPhone} />
              <Row label="บริการ" value={booking.packageName} />
              {booking.stylistName ? <Row label="ช่าง" value={booking.stylistName} /> : null}
              <Row label="วันที่" value={booking.bookingDate} />
              <Row label="เวลา" value={`${booking.startTime}–${booking.endTime}`} />
              <Row label="ระยะเวลา" value={`${booking.durationMinutes} นาที`} />
              {booking.priceBaht != null ? (
                <Row label="ราคา" value={formatMoney(booking.priceBaht)} />
              ) : null}
              {(booking.amountPaidBaht ?? 0) > 0 ? (
                <Row
                  label="ชำระแล้ว"
                  value={`${formatMoney(booking.amountPaidBaht ?? 0)} · ${paymentStatusLabel(booking.paymentStatus)}`}
                />
              ) : null}
              {booking.remainingBaht != null && booking.remainingBaht > 0 ? (
                <Row label="คงเหลือ" value={formatMoney(booking.remainingBaht)} />
              ) : null}
            </section>

            {booking.depositSlipUrl?.trim() || booking.paymentSlipUrl?.trim() ? (
              <section className={cn(appPublicCheckInGlassCardClass, "space-y-3 px-5 py-4")}>
                {booking.depositSlipUrl?.trim() ? (
                  <div>
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-[#8b87b8]">
                      สลิปมัดจำ
                    </p>
                    <AppImageThumb
                      src={booking.depositSlipUrl}
                      alt="สลิปมัดจำ"
                      onOpen={() => slipLb.open(booking.depositSlipUrl!.trim())}
                    />
                  </div>
                ) : null}
                {booking.paymentSlipUrl?.trim() ? (
                  <div>
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-[#8b87b8]">
                      สลิปชำระเพิ่ม
                    </p>
                    <AppImageThumb
                      src={booking.paymentSlipUrl}
                      alt="สลิปชำระเพิ่ม"
                      onOpen={() => slipLb.open(booking.paymentSlipUrl!.trim())}
                    />
                  </div>
                ) : null}
              </section>
            ) : null}

            {shop.contactPhone || shop.address ? (
              <section
                className={cn(
                  appPublicCheckInGlassCardClass,
                  "space-y-1 px-5 py-4 text-sm font-semibold text-[#66638c]",
                )}
              >
                {shop.contactPhone ? (
                  <p>
                    <a className="font-bold text-[#4d47b6]" href={`tel:${shop.contactPhone.replace(/\D/g, "")}`}>
                      {shop.contactPhone}
                    </a>
                  </p>
                ) : null}
                {shop.address ? <p>{shop.address}</p> : null}
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
      <AppImageLightbox src={slipLb.src} onClose={slipLb.close} alt="สลิป" />
    </AppPublicCheckInGlassPage>
  );
}
