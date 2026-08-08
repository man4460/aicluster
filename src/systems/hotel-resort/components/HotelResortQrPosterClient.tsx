"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/cn";
import { hotelResortPublicPortalUrl } from "@/lib/hotel-resort/public-url";
import { HotelResortButton } from "@/systems/hotel-resort/components/HotelResortButton";
import { MassageQrPreviewFrame } from "@/systems/massage/components/MassageQrPreviewFrame";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";
import {
  lsQrHubPanelClass,
  lsQrHubPreviewImgClass,
  lsQrHubToolbarClass,
} from "@/systems/loyalty-stamp/loyalty-stamp-ui-tokens";

const TAGLINE = "สแกน ดูสถานะการจอง";

const toolbarBtnSoft =
  "min-h-[44px] rounded-xl border border-white/60 bg-white/80 px-4 text-sm font-bold text-[#4d47b6] disabled:opacity-45";

export function HotelResortQrPosterClient({
  ownerId,
  trialSessionId,
  baseUrl,
  hotelLabel,
  logoUrl = null,
  trialExportBlocked = false,
  compactForModal = false,
}: {
  ownerId: string;
  trialSessionId: string;
  baseUrl: string;
  hotelLabel: string;
  logoUrl?: string | null;
  trialExportBlocked?: boolean;
  compactForModal?: boolean;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [linkVisible, setLinkVisible] = useState(false);

  const portalUrl = useMemo(() => {
    if (!baseUrl.startsWith("http")) return "";
    return hotelResortPublicPortalUrl(baseUrl.replace(/\/$/, ""), ownerId, trialSessionId);
  }, [baseUrl, ownerId, trialSessionId]);

  const headline = hotelLabel.trim() || "โรงแรม / รีสอร์ท";
  const resolvedLogoUrl = useMemo(() => resolveAssetUrl(logoUrl, baseUrl), [logoUrl, baseUrl]);

  const copyLink = useCallback(async () => {
    if (!portalUrl) return;
    try {
      await navigator.clipboard.writeText(portalUrl);
    } catch {
      window.prompt("คัดลอกลิงก์", portalUrl);
      return;
    }
    if (compactForModal) {
      setCopyMsg("คัดลอกลิงก์แล้ว");
      window.setTimeout(() => setCopyMsg(null), 1800);
    }
  }, [portalUrl, compactForModal]);

  useEffect(() => {
    if (!portalUrl) return;
    void QRCode.toDataURL(portalUrl, { width: 232, margin: 2, errorCorrectionLevel: "M" })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [portalUrl]);

  useEffect(() => {
    if (!qrDataUrl) {
      setPosterPreviewUrl(null);
      return;
    }
    let cancelled = false;
    void createShopQrPosterDataUrl({
      qrDataUrl,
      shopLabel: headline,
      logoUrl: resolvedLogoUrl,
      tagline: TAGLINE,
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
  }, [qrDataUrl, headline, resolvedLogoUrl]);

  async function downloadPng() {
    if (!qrDataUrl || trialExportBlocked) return;
    setBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl,
        shopLabel: headline,
        logoUrl: resolvedLogoUrl,
        tagline: TAGLINE,
      });
      await downloadPosterPng(canvas, `hotel-resort-qr-${ownerId.slice(0, 8)}.png`);
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdf() {
    if (!qrDataUrl || trialExportBlocked) return;
    setBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl,
        shopLabel: headline,
        logoUrl: resolvedLogoUrl,
        tagline: TAGLINE,
      });
      await downloadPosterPdf(canvas, `hotel-resort-qr-a4-${ownerId.slice(0, 8)}.pdf`, "a4");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn(lsQrHubPanelClass, compactForModal && "border-0 bg-transparent p-0 shadow-none ring-0")}>
      {!compactForModal ? (
        <>
          <p className="text-left text-sm font-black text-[#1e1b4b]">QR พอร์ทัลสถานะการจอง</p>
          <p className="mt-1 text-left text-xs text-[#66638c]">{TAGLINE}</p>
        </>
      ) : (
        <p className="truncate text-xs font-semibold text-[#8b87ad]" title={headline}>
          {headline}
        </p>
      )}

      <div className={cn("space-y-3", compactForModal ? "mt-0" : "mt-4")}>
        {trialExportBlocked ? (
          <p className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-sm text-amber-950">
            โหมดทดลอง — ดาวน์โหลดปิดชั่วคราว
          </p>
        ) : null}

        {compactForModal ? (
          <>
            <div className="flex flex-wrap gap-2">
              <HotelResortButton
                type="button"
                onClick={() => void copyLink()}
                disabled={!portalUrl}
                className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] shadow-sm ring-1 ring-white/40 disabled:opacity-45"
                aria-label="คัดลอกลิงก์"
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <rect x="2" y="2" width="13" height="13" rx="2" />
                </svg>
                <span className="cw-btn-label">คัดลอกลิงก์</span>
              </HotelResortButton>
              <HotelResortButton
                type="button"
                onClick={() => setLinkVisible((v) => !v)}
                disabled={!portalUrl}
                className="cw-btn rounded-xl border border-white/55 bg-white/40 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md hover:bg-white/55 disabled:opacity-45"
                aria-label={linkVisible ? "ซ่อนลิงก์" : "แสดงลิงก์"}
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  {linkVisible ? (
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.84-2 2.2-3.75 3.94-5.06M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a10.96 10.96 0 0 1-4.07 5.09M1 1l22 22" />
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
                <span className="cw-btn-label">{linkVisible ? "ซ่อนลิงก์" : "แสดงลิงก์"}</span>
              </HotelResortButton>
              <HotelResortButton
                type="button"
                onClick={() => void downloadPdf()}
                disabled={busy || !qrDataUrl || trialExportBlocked}
                className="cw-btn app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
                aria-label="ดาวน์โหลด PDF (A4)"
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
                <span className="cw-btn-label">ดาวน์โหลด PDF (A4)</span>
              </HotelResortButton>
              <HotelResortButton
                type="button"
                onClick={() => void downloadPng()}
                disabled={busy || !qrDataUrl || trialExportBlocked}
                className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-60"
                aria-label="ดาวน์โหลด PNG"
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <span className="cw-btn-label">ดาวน์โหลด PNG</span>
              </HotelResortButton>
            </div>
            {copyMsg ? (
              <p className="rounded-xl border border-emerald-200/60 bg-emerald-50/70 px-3 py-2 text-xs font-medium text-emerald-900 backdrop-blur-sm">
                {copyMsg}
              </p>
            ) : null}
            {portalUrl ? (
              linkVisible ? (
                <p className="break-all rounded-xl border border-white/50 bg-white/45 px-3 py-2 text-xs font-medium text-[#4d47b6] backdrop-blur-md">
                  {portalUrl}
                </p>
              ) : (
                <p className="rounded-xl border border-dashed border-white/45 bg-white/25 px-3 py-2 text-xs font-medium text-slate-600 backdrop-blur-sm">
                  ลิงก์ถูกซ่อน — กด &quot;แสดงลิงก์&quot; หรือ &quot;คัดลอกลิงก์&quot; เมื่อต้องการ
                </p>
              )
            ) : null}
          </>
        ) : (
          <div className={lsQrHubToolbarClass}>
            <HotelResortButton
              type="button"
              onClick={() => void copyLink()}
              disabled={!portalUrl}
              className="app-btn-primary min-h-[44px] rounded-xl px-4 text-sm font-bold"
            >
              คัดลอกลิงก์
            </HotelResortButton>
            <HotelResortButton
              type="button"
              onClick={() => void downloadPng()}
              disabled={busy || !qrDataUrl || trialExportBlocked}
              className={toolbarBtnSoft}
            >
              ดาวน์โหลด PNG
            </HotelResortButton>
            <HotelResortButton
              type="button"
              onClick={() => void downloadPdf()}
              disabled={busy || !qrDataUrl || trialExportBlocked}
              className={toolbarBtnSoft}
            >
              PDF A4
            </HotelResortButton>
          </div>
        )}
      </div>

      <MassageQrPreviewFrame className={cn("shrink-0", compactForModal ? "mt-6" : "mt-4")}>
        {posterPreviewUrl ? (
          <img src={posterPreviewUrl} alt="ตัวอย่างโปสเตอร์ QR โรงแรมรีสอร์ท" className={lsQrHubPreviewImgClass} />
        ) : (
          <div
            className={cn(
              lsQrHubPreviewImgClass,
              "flex h-[min(56vh,520px)] items-center justify-center bg-white/25 text-sm text-[#66638c]",
            )}
          >
            {portalUrl ? "กำลังสร้างตัวอย่าง QR..." : "รอ URL พอร์ทัล"}
          </div>
        )}
      </MassageQrPreviewFrame>
    </div>
  );
}
