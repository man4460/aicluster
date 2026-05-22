"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/cn";
import { appointmentQueuePublicBookingUrl } from "@/lib/appointment-queue/public-url";
import { MassageQrPreviewFrame } from "@/systems/massage/components/MassageQrPreviewFrame";
import {
  aqCardBodyPaddingXClass,
  aqCardSurfaceRadiusClass,
  aqQrHubPanelClass,
  aqQrHubPreviewImgClass,
  aqQrHubToolbarClass,
} from "@/systems/appointment-queue/appointment-queue-ui-tokens";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";

const TAGLINE = "สแกน จองเวลา · เลือกบริการเอง";

type Props = {
  ownerId: string;
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  trialSessionId: string;
  trialExportBlocked?: boolean;
  compactForModal?: boolean;
};

function IconCustomerQrBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-900/20",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h7v7h-7z" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function AppointmentQueueQrPosterClient({
  ownerId,
  shopLabel,
  logoUrl,
  baseUrl,
  trialSessionId,
  trialExportBlocked = false,
  compactForModal = false,
}: Props) {
  const portalUrl = useMemo(() => {
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) return "";
    return appointmentQueuePublicBookingUrl(baseUrl.replace(/\/$/, ""), ownerId, trialSessionId);
  }, [baseUrl, ownerId, trialSessionId]);

  const headline = shopLabel.trim() || "จองคิวออนไลน์";
  const logoSrc = useMemo(() => resolveAssetUrl(logoUrl, baseUrl), [logoUrl, baseUrl]);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [linkVisible, setLinkVisible] = useState(false);

  const copyPortalLink = useCallback(async () => {
    if (!portalUrl) return;
    try {
      await navigator.clipboard.writeText(portalUrl);
      if (compactForModal) {
        setCopyMsg("คัดลอกลิงก์แล้ว");
        window.setTimeout(() => setCopyMsg(null), 1800);
      } else {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      window.prompt("คัดลอกลิงก์จอง:", portalUrl);
    }
  }, [portalUrl, compactForModal]);

  useEffect(() => {
    if (!portalUrl) return;
    QRCode.toDataURL(portalUrl, {
      width: 232,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
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
      logoUrl: logoSrc,
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
  }, [qrDataUrl, headline, logoSrc]);

  async function downloadPng() {
    if (!portalUrl || trialExportBlocked || !qrDataUrl) return;
    setBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl,
        shopLabel: headline,
        logoUrl: logoSrc,
        tagline: TAGLINE,
      });
      await downloadPosterPng(canvas, `aq-customer-qr-${ownerId.slice(0, 8)}.png`);
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdf(format: "a4" | "a5") {
    if (!portalUrl || trialExportBlocked || !qrDataUrl) return;
    setBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl,
        shopLabel: headline,
        logoUrl: logoSrc,
        tagline: TAGLINE,
      });
      await downloadPosterPdf(canvas, `aq-customer-qr-${format}-${ownerId.slice(0, 8)}.pdf`, format);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={aqQrHubPanelClass}>
      {!compactForModal ? (
        <div className="flex min-w-0 gap-3.5">
          <IconCustomerQrBadge />
          <div className="min-w-0 pt-0.5">
            <h3 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">QR ลูกค้า</h3>
            <p className="mt-1 text-sm text-[#66638c]">สแกนจองเวลา · เลือกบริการ · แนบสลิปมัดจำ</p>
            <p className="mt-2 truncate text-xs font-semibold text-[#8b87ad]" title={headline}>
              {headline}
            </p>
          </div>
        </div>
      ) : (
        <p className="truncate text-xs font-semibold text-[#8b87ad]" title={headline}>
          {headline}
        </p>
      )}

      <div className={cn("space-y-3", compactForModal ? "mt-0" : "mt-6")}>
        {copyMsg ? <p className="text-sm font-medium text-[#5b61ff]">{copyMsg}</p> : null}
        {compactForModal ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!portalUrl}
              onClick={() => void copyPortalLink()}
              className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-45"
              aria-label="คัดลอกลิงก์จองคิว"
            >
              <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <rect x="2" y="2" width="13" height="13" rx="2" />
              </svg>
              <span className="cw-btn-label">คัดลอกลิงก์</span>
            </button>
            <button
              type="button"
              disabled={!portalUrl}
              onClick={() => setLinkVisible((v) => !v)}
              className="cw-btn rounded-xl border border-white/55 bg-white/40 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-45"
              aria-label={linkVisible ? "ซ่อนลิงก์" : "แสดงลิงก์"}
            >
              <span className="cw-btn-label">{linkVisible ? "ซ่อนลิงก์" : "แสดงลิงก์"}</span>
            </button>
            <button
              type="button"
              disabled={busy || !qrDataUrl || trialExportBlocked}
              onClick={() => void downloadPdf("a4")}
              className="cw-btn app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
              aria-label="ดาวน์โหลด PDF A4"
            >
              <span className="cw-btn-label">PDF A4</span>
            </button>
            <button
              type="button"
              disabled={busy || !qrDataUrl || trialExportBlocked}
              onClick={() => void downloadPng()}
              className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-60"
              aria-label="ดาวน์โหลด PNG"
            >
              <span className="cw-btn-label">PNG</span>
            </button>
          </div>
        ) : (
          <div className={aqQrHubToolbarClass}>
            <button
              type="button"
              disabled={!portalUrl}
              onClick={() => void copyPortalLink()}
              className="app-btn-primary min-h-[44px] rounded-xl px-4 text-sm font-semibold disabled:opacity-45"
            >
              {copied ? "คัดลอกแล้ว ✓" : "คัดลอกลิงก์"}
            </button>
            <button
              type="button"
              disabled={busy || !qrDataUrl || trialExportBlocked}
              onClick={() => void downloadPdf("a4")}
              className="app-btn-soft min-h-[44px] rounded-xl px-4 text-sm font-semibold disabled:opacity-45"
            >
              ดาวน์โหลด PDF (A4)
            </button>
            <button
              type="button"
              disabled={busy || !qrDataUrl || trialExportBlocked}
              onClick={() => void downloadPng()}
              className="app-btn-soft min-h-[44px] rounded-xl px-4 text-sm font-semibold disabled:opacity-45"
            >
              ดาวน์โหลด PNG
            </button>
          </div>
        )}

        {linkVisible && portalUrl ? (
          <p className="break-all rounded-xl border border-dashed border-[#dcd8f0] bg-white/50 px-3 py-2 text-xs text-[#66638c]">
            {portalUrl}
          </p>
        ) : compactForModal ? (
          <p className="rounded-xl border border-dashed border-[#dcd8f0] px-3 py-2 text-xs text-[#8b87ad]">
            ลิงก์ถูกซ่อน — กด &quot;แสดงลิงก์&quot; หรือ &quot;คัดลอกลิงก์&quot;
          </p>
        ) : null}

        <MassageQrPreviewFrame className={compactForModal ? "mt-4" : "mt-6"} accent="customer">
          {posterPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterPreviewUrl}
              alt="ตัวอย่างโปสเตอร์ QR จองคิว"
              className={aqQrHubPreviewImgClass}
            />
          ) : (
            <div className={cn(aqQrHubPreviewImgClass, "flex min-h-[200px] items-center justify-center bg-white/40 text-sm text-[#8b87ad]")}>
              กำลังสร้างตัวอย่าง…
            </div>
          )}
        </MassageQrPreviewFrame>
      </div>
    </div>
  );
}
