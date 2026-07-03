"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/cn";
import { hotelResortPublicPortalUrl } from "@/lib/hotel-resort/public-url";
import { HotelResortButton } from "@/systems/hotel-resort/components/HotelResortButton";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";

const TAGLINE = "สแกน ดูสถานะการจอง";

export function HotelResortQrPosterClient({
  ownerId,
  trialSessionId,
  baseUrl,
  hotelLabel,
  logoUrl = null,
  compactForModal = false,
}: {
  ownerId: string;
  trialSessionId: string;
  baseUrl: string;
  hotelLabel: string;
  logoUrl?: string | null;
  compactForModal?: boolean;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const portalUrl = useMemo(() => {
    if (!baseUrl.startsWith("http")) return "";
    return hotelResortPublicPortalUrl(baseUrl.replace(/\/$/, ""), ownerId, trialSessionId);
  }, [baseUrl, ownerId, trialSessionId]);

  const headline = hotelLabel.trim() || "โรงแรม / รีสอร์ท";
  const resolvedLogoUrl = useMemo(() => resolveAssetUrl(logoUrl, baseUrl), [logoUrl, baseUrl]);

  const copyLink = useCallback(async () => {
    if (!portalUrl) return;
    await navigator.clipboard.writeText(portalUrl).catch(() => window.prompt("คัดลอกลิงก์", portalUrl));
  }, [portalUrl]);

  useEffect(() => {
    if (!portalUrl) return;
    void QRCode.toDataURL(portalUrl, { width: 232, margin: 2, errorCorrectionLevel: "M" }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [portalUrl]);

  useEffect(() => {
    if (!qrDataUrl) return;
    let cancelled = false;
    void createShopQrPosterDataUrl({ qrDataUrl, shopLabel: headline, logoUrl: resolvedLogoUrl, tagline: TAGLINE })
      .then((url) => !cancelled && setPosterPreviewUrl(url))
      .catch(() => !cancelled && setPosterPreviewUrl(null));
    return () => {
      cancelled = true;
    };
  }, [qrDataUrl, headline, resolvedLogoUrl]);

  async function downloadPng() {
    if (!qrDataUrl) return;
    setBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({ qrDataUrl, shopLabel: headline, logoUrl: resolvedLogoUrl, tagline: TAGLINE });
      await downloadPosterPng(canvas, `hotel-resort-qr-${ownerId.slice(0, 8)}.png`);
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdf() {
    if (!qrDataUrl) return;
    setBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({ qrDataUrl, shopLabel: headline, logoUrl: resolvedLogoUrl, tagline: TAGLINE });
      await downloadPosterPdf(canvas, `hotel-resort-qr-a4-${ownerId.slice(0, 8)}.pdf`, "a4");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("space-y-3 rounded-[2rem] border border-white/55 bg-white/35 p-4 backdrop-blur-xl sm:p-5", compactForModal && "border-0 bg-transparent p-0")}>
      {!compactForModal ? (
        <>
          <p className="text-left text-sm font-black text-[#1e1b4b]">QR พอร์ทัลสถานะการจอง</p>
          <p className="text-left text-xs text-[#66638c]">{portalUrl}</p>
        </>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <HotelResortButton type="button" onClick={() => void copyLink()} className="app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold">
          คัดลอกลิงก์
        </HotelResortButton>
        <HotelResortButton type="button" onClick={() => void downloadPng()} disabled={busy || !qrDataUrl} className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-40">
          ดาวน์โหลด PNG
        </HotelResortButton>
        <HotelResortButton type="button" onClick={() => void downloadPdf()} disabled={busy || !qrDataUrl} className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-40">
          ดาวน์โหลด PDF
        </HotelResortButton>
      </div>
      {posterPreviewUrl ? (
        <img src={posterPreviewUrl} alt="ตัวอย่างโปสเตอร์ QR โรงแรมรีสอร์ท" className="w-full rounded-2xl border border-white/60 bg-white/70 p-2" />
      ) : (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/50 bg-white/30 text-sm text-[#66638c]">
          {portalUrl ? "กำลังสร้างตัวอย่าง QR..." : "รอ URL พอร์ทัล"}
        </div>
      )}
    </div>
  );
}
