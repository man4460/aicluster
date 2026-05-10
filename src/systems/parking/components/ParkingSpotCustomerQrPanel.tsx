"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";

const PARKING_CUSTOMER_QR_TAGLINE =
  "สแกนเพื่อเช็คอินฝากจอด — กรอกทะเบียนและหมายเหตุได้เอง";

/** QR + โปสเตอร์เหมือนโมดัล «QR ลูกค้า» ใน CarWashDashboard */
export function ParkingSpotCustomerQrPanel({
  checkInUrl,
  spotId,
  spotCode,
  zoneLabel,
  siteName,
  businessName,
  logoUrl,
  baseUrl,
}: {
  checkInUrl: string;
  spotId: number;
  spotCode: string;
  zoneLabel: string | null;
  siteName: string;
  businessName: string | null;
  logoUrl: string | null;
  baseUrl: string;
}) {
  const [portalQr, setPortalQr] = useState<string | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [qrLinkVisible, setQrLinkVisible] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);

  const resolvedLogoUrl = useMemo(() => resolveAssetUrl(logoUrl, baseUrl), [logoUrl, baseUrl]);

  const posterShopLabel = useMemo(() => {
    const business = businessName?.trim();
    if (business) return business;
    return siteName.trim() || "บริการรับฝากจอดรถ";
  }, [businessName, siteName]);

  const posterSubtitle = useMemo(() => {
    const z = zoneLabel?.trim();
    return [`ช่อง ${spotCode}`, z ? `โซน ${z}` : null].filter(Boolean).join(" · ");
  }, [spotCode, zoneLabel]);

  /** เมื่อหัวโปสเตอร์เป็นชื่อบริษัท — ใส่ชื่อลานด้านล่างให้รู้ว่าเป็น QR ลานไหน */
  const posterFooterText = useMemo(() => {
    const site = siteName.trim();
    const biz = businessName?.trim();
    if (!site || !biz || biz === site) return null;
    return `ลาน ${site}`;
  }, [businessName, siteName]);

  useEffect(() => {
    if (!checkInUrl.trim()) {
      setPortalQr(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(checkInUrl, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setPortalQr(url);
      })
      .catch(() => {
        if (!cancelled) setPortalQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [checkInUrl]);

  useEffect(() => {
    if (!portalQr) {
      setPosterPreviewUrl(null);
      return;
    }
    let cancelled = false;
    void createShopQrPosterDataUrl({
      qrDataUrl: portalQr,
      shopLabel: posterShopLabel,
      logoUrl: resolvedLogoUrl,
      tagline: PARKING_CUSTOMER_QR_TAGLINE,
      subtitle: posterSubtitle || null,
      footerText: posterFooterText,
    })
      .then((url) => {
        if (!cancelled) setPosterPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPosterPreviewUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [portalQr, posterShopLabel, posterSubtitle, resolvedLogoUrl, posterFooterText]);

  async function copyPortalLink() {
    if (!checkInUrl) return;
    try {
      await navigator.clipboard.writeText(checkInUrl);
      setCopyMsg("คัดลอกลิงก์แล้ว");
      window.setTimeout(() => setCopyMsg(null), 1800);
    } catch {
      setCopyMsg(null);
      window.prompt("คัดลอกลิงก์:", checkInUrl);
    }
  }

  async function downloadQrPng() {
    if (!checkInUrl || !portalQr) return;
    setQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: portalQr,
        shopLabel: posterShopLabel,
        logoUrl: resolvedLogoUrl,
        tagline: PARKING_CUSTOMER_QR_TAGLINE,
        subtitle: posterSubtitle || null,
        footerText: posterFooterText,
      });
      await downloadPosterPng(canvas, `parking-spot-${spotId}-qr-poster.png`);
    } finally {
      setQrBusy(false);
    }
  }

  async function downloadQrPdf() {
    if (!checkInUrl || !portalQr) return;
    setQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: portalQr,
        shopLabel: posterShopLabel,
        logoUrl: resolvedLogoUrl,
        tagline: PARKING_CUSTOMER_QR_TAGLINE,
        subtitle: posterSubtitle || null,
        footerText: posterFooterText,
      });
      await downloadPosterPdf(canvas, `parking-spot-${spotId}-qr-poster-a4.pdf`, "a4");
    } finally {
      setQrBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyPortalLink()}
          className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] shadow-sm ring-1 ring-white/40"
        >
          <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <rect x="2" y="2" width="13" height="13" rx="2" />
          </svg>
          <span className="cw-btn-label">คัดลอกลิงก์</span>
        </button>
        <button
          type="button"
          onClick={() => setQrLinkVisible((v) => !v)}
          className="cw-btn rounded-xl border border-white/55 bg-white/40 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md hover:bg-white/55"
        >
          <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            {qrLinkVisible ? (
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.84-2 2.2-3.75 3.94-5.06M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a10.96 10.96 0 0 1-4.07 5.09M1 1l22 22" />
            ) : (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
          <span className="cw-btn-label">{qrLinkVisible ? "ซ่อนลิงก์" : "แสดงลิงก์"}</span>
        </button>
        <button
          type="button"
          disabled={qrBusy || !checkInUrl || !portalQr}
          onClick={() => void downloadQrPdf()}
          className="cw-btn app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
        >
          <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
          <span className="cw-btn-label">ดาวน์โหลด PDF (A4)</span>
        </button>
        <button
          type="button"
          disabled={qrBusy || !checkInUrl || !portalQr}
          onClick={() => void downloadQrPng()}
          className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-60"
        >
          <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          <span className="cw-btn-label">ดาวน์โหลด PNG</span>
        </button>
      </div>

      {copyMsg ? (
        <p className="rounded-xl border border-emerald-200/60 bg-emerald-50/70 px-3 py-2 text-xs font-medium text-emerald-900 backdrop-blur-sm">
          {copyMsg}
        </p>
      ) : null}

      {qrLinkVisible ? (
        <p className="break-all rounded-xl border border-white/50 bg-white/45 px-3 py-2 text-xs font-medium text-[#4d47b6] backdrop-blur-md">
          {checkInUrl}
        </p>
      ) : (
        <p className="rounded-xl border border-dashed border-white/45 bg-white/25 px-3 py-2 text-xs font-medium text-slate-600 backdrop-blur-sm">
          ลิงก์ถูกซ่อน — กด &quot;แสดงลิงก์&quot; หรือ &quot;คัดลอกลิงก์&quot; เมื่อต้องการ
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-white/50 bg-white/30 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] backdrop-blur-md">
        {posterPreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterPreviewUrl}
            alt={`QR เช็คอิน ช่อง ${spotCode}`}
            className="mx-auto w-[340px] max-w-full rounded-3xl shadow-lg shadow-indigo-950/10"
          />
        ) : (
          <div className="mx-auto flex min-h-[280px] w-[340px] max-w-full items-center justify-center rounded-3xl border border-white/45 bg-white/40 text-xs font-medium text-slate-600 backdrop-blur-sm">
            กำลังเรนเดอร์ QR…
          </div>
        )}
      </div>
    </div>
  );
}
