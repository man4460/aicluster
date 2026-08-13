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
import type { DrinkPosPortalCartItem } from "@/lib/drink-pos/portal-booking";

type ReservationDetail = {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  tablePreference: string | null;
  visitDateKey: string;
  visitTimeHm: string;
  items: DrinkPosPortalCartItem[];
  itemsTotalBaht: number;
  paymentMode: string;
  payDueBaht: number;
  amountPaidBaht: number;
  paymentMethod: string | null;
  paymentSlipUrl: string | null;
  status: string;
  statusLabel: string;
  note: string | null;
};

type ShopInfo = {
  shopName: string;
  logoUrl: string | null;
  contactPhone: string | null;
  address: string | null;
  contactLine: string | null;
  openTime: string;
  closeTime: string;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#e4e0f5]/80 py-3 last:border-0">
      <span className="shrink-0 text-xs font-bold text-[#8b87b8]">{label}</span>
      <span className="text-right text-sm font-black text-[#1e1b4b]">{value}</span>
    </div>
  );
}

export function DrinkPosPortalReservationClient({
  ownerId,
  reservationId,
  phone,
  trialSessionId,
}: {
  ownerId: string;
  reservationId: string;
  phone: string;
  trialSessionId?: string;
}) {
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const lb = useAppImageLightbox();

  const homeHref =
    trialSessionId && trialSessionId !== "prod"
      ? `/drink-pos/${ownerId}?t=${encodeURIComponent(trialSessionId)}`
      : `/drink-pos/${ownerId}`;

  useEffect(() => {
    const q = new URLSearchParams({ ownerId, id: reservationId, phone });
    if (trialSessionId) q.set("t", trialSessionId);
    setBusy(true);
    setErr(null);
    void fetch(`/api/drink-pos/public/portal/reservation?${q}`, { cache: "no-store" })
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as {
          shop?: ShopInfo;
          reservation?: ReservationDetail;
          error?: string;
        };
        if (!res.ok) throw new Error(j.error ?? "โหลดไม่สำเร็จ");
        setShop(j.shop ?? null);
        setReservation(j.reservation ?? null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"))
      .finally(() => setBusy(false));
  }, [ownerId, reservationId, phone, trialSessionId]);

  const remaining = reservation
    ? Math.max(0, reservation.itemsTotalBaht - reservation.amountPaidBaht)
    : 0;

  return (
    <AppPublicCheckInGlassPage>
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />
      <div className="relative mx-auto max-w-md space-y-4">
        {busy ? (
          <p className="py-16 text-center text-sm font-semibold text-[#66638c]">กำลังโหลด…</p>
        ) : err ? (
          <div className={cn(appPublicCheckInGlassCardClass, "p-6 text-center")}>
            <p className="text-sm font-semibold text-rose-600">{err}</p>
            <Link href={homeHref} className="mt-4 inline-block text-sm font-bold text-[#4d47b6]">
              กลับหน้าจอง
            </Link>
          </div>
        ) : reservation && shop ? (
          <>
            <div className={cn(appPublicCheckInGlassCardClass, "p-5")}>
              <div className="flex items-center gap-3">
                {shop.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shop.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : null}
                <div>
                  <h1 className="text-lg font-black text-[#1e1b4b]">{shop.shopName}</h1>
                  <p className="text-xs font-bold text-[#4d47b6]">{reservation.statusLabel}</p>
                </div>
              </div>
              <div className="mt-4">
                <Row label="ชื่อ" value={reservation.customerName} />
                <Row label="เบอร์" value={reservation.phone} />
                <Row label="จำนวนคน" value={String(reservation.partySize)} />
                <Row label="วัน" value={reservation.visitDateKey} />
                <Row label="เวลา" value={reservation.visitTimeHm} />
                {reservation.itemsTotalBaht > 0 ? (
                  <Row label="ยอดพรีออเดอร์" value={`฿${reservation.itemsTotalBaht.toLocaleString()}`} />
                ) : null}
                {reservation.amountPaidBaht > 0 ? (
                  <Row label="ชำระแล้ว" value={`฿${reservation.amountPaidBaht.toLocaleString()}`} />
                ) : null}
                {reservation.itemsTotalBaht > 0 && remaining > 0 ? (
                  <Row label="คงเหลือ" value={`฿${remaining.toLocaleString()}`} />
                ) : null}
              </div>
              {reservation.items.length > 0 ? (
                <ul className="mt-3 space-y-1 border-t border-[#ecebff] pt-3 text-sm">
                  {reservation.items.map((it) => (
                    <li key={it.productId} className="flex justify-between gap-2 font-semibold text-[#1e1b4b]">
                      <span>
                        {it.name} × {it.qty}
                      </span>
                      <span>฿{(it.unitPrice * it.qty).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {reservation.paymentSlipUrl ? (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-bold text-[#4d47b6]">สลิปชำระ</p>
                  <AppImageThumb
                    src={reservation.paymentSlipUrl}
                    alt="สลิป"
                    onOpen={() => lb.open(reservation.paymentSlipUrl!)}
                  />
                </div>
              ) : null}
            </div>
            <Link
              href={homeHref}
              className="app-btn-primary flex min-h-12 items-center justify-center rounded-xl text-sm font-black"
            >
              กลับหน้าจอง
            </Link>
          </>
        ) : null}
      </div>
    </AppPublicCheckInGlassPage>
  );
}
