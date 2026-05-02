"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/cn";
import { BarberDashboardBackLink } from "@/systems/barber/components/BarberDashboardBackLink";
import { BarberQrPreviewFrame } from "@/systems/barber/components/BarberQrPreviewFrame";
import {
  barberCardBodyPaddingXClass,
  barberCardSurfaceRadiusClass,
  barberPageStackClass,
  barberQrHubPanelClass,
  barberQrHubPreviewImgClass,
  barberQrHubToolbarClass,
} from "@/systems/barber/components/barber-ui-tokens";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";

type Props = {
  ownerId: string;
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  /** โหมดทดลอง — ปิดดาวน์โหลด PDF/PNG */
  trialExportBlocked?: boolean;
  /** ใช้ในหน้ารวม QR — ไม่มีปุ่มกลับและไม่ห่อด้วย stack ชั้นนอก */
  embedded?: boolean;
};

function IconCustomerQrBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-900/20",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h7v7h-7zM17 17h1v1h-1z" strokeLinecap="round" />
      </svg>
    </span>
  );
}

const toolbarBtnSoft = cn(
  barberCardSurfaceRadiusClass,
  "inline-flex min-h-[44px] items-center justify-center px-3 py-2 text-sm font-semibold text-[#2e2a58]",
  "border border-[#e8e6f4] bg-white/70 shadow-sm transition hover:bg-white active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45",
);

const toolbarBtnPrimary = cn(
  barberCardSurfaceRadiusClass,
  "app-btn-primary inline-flex min-h-[44px] items-center justify-center px-3 py-2 text-sm font-semibold text-white disabled:opacity-45",
);

export function BarberQrPosterClient({
  ownerId,
  shopLabel,
  logoUrl,
  baseUrl,
  trialExportBlocked = false,
  embedded = false,
}: Props) {
  const portalUrl =
    baseUrl.startsWith("http://") || baseUrl.startsWith("https://")
      ? `${baseUrl.replace(/\/$/, "")}/m/${ownerId}`
      : "";
  const headline = shopLabel.trim() || "ร้านตัดผม";
  const logoSrc = useMemo(() => resolveAssetUrl(logoUrl, baseUrl), [logoUrl, baseUrl]);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPortalLink = useCallback(async () => {
    if (!portalUrl) return;
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = portalUrl;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
      } catch {
        return;
      }
    }
    window.setTimeout(() => setCopied(false), 2000);
  }, [portalUrl]);

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
      tagline: "สแกน กรอกเบอร์ — หักแพ็กอัตโนมัติ",
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
        tagline: "สแกน กรอกเบอร์ — หักแพ็กอัตโนมัติ",
      });
      await downloadPosterPng(canvas, `qr-store-${ownerId.slice(0, 8)}.png`);
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
        tagline: "สแกน กรอกเบอร์ — หักแพ็กอัตโนมัติ",
      });
      await downloadPosterPdf(canvas, `qr-poster-${format}-${ownerId.slice(0, 8)}.pdf`, format);
    } finally {
      setBusy(false);
    }
  }

  const panel = (
    <div className={barberQrHubPanelClass}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="flex min-w-0 gap-3.5">
          <IconCustomerQrBadge />
          <div className="min-w-0 pt-0.5">
            <h3 className="text-lg font-black tracking-tight sm:text-xl">
              <span className="bg-gradient-to-r from-emerald-700 via-teal-600 to-[#3730a3] bg-clip-text text-transparent">
                พอร์ทัลลูกค้า
              </span>
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[#66638c]">
              สแกนเข้าหน้าลูกค้า · เช็กแพ็กได้เอง
            </p>
            <p className="mt-2 truncate text-xs font-semibold text-[#8b87ad]" title={headline}>
              {headline}
            </p>
          </div>
        </div>
        {!embedded ?
          <div className="shrink-0 sm:pt-1">
            <BarberDashboardBackLink />
          </div>
        : null}
      </div>

      <div className="mt-6 space-y-3">
        {!portalUrl ?
          <p
            className={`${barberCardSurfaceRadiusClass} border border-amber-200/90 bg-amber-50/95 ${barberCardBodyPaddingXClass} py-3 text-sm leading-snug text-amber-950`}
          >
            ตั้งค่า <code className="rounded-md bg-white/90 px-1.5 py-px text-xs">NEXT_PUBLIC_APP_URL</code>{" "}
            เป็น URL จริง
          </p>
        : trialExportBlocked ?
          <p
            className={`${barberCardSurfaceRadiusClass} border border-amber-200/90 bg-amber-50/95 ${barberCardBodyPaddingXClass} py-3 text-sm text-amber-950`}
          >
            โหมดทดลอง — ดาวน์โหลดปิดชั่วคราว
          </p>
        : null}

        <div className={barberQrHubToolbarClass}>
          <button
            type="button"
            disabled={!portalUrl}
            onClick={() => void copyPortalLink()}
            className={cn(toolbarBtnSoft, "w-full sm:w-auto sm:min-w-[11rem]")}
            aria-label="คัดลอกลิงก์พอร์ทัลลูกค้า"
          >
            {copied ? "คัดลอกแล้ว ✓" : "คัดลอกลิงก์"}
          </button>
          <button
            type="button"
            disabled={busy || !portalUrl || trialExportBlocked}
            onClick={() => downloadPdf("a4")}
            className={cn(toolbarBtnPrimary, "min-w-0 flex-1 sm:min-w-[5.75rem]")}
          >
            PDF · A4
          </button>
          <button
            type="button"
            disabled={busy || !portalUrl || trialExportBlocked}
            onClick={() => downloadPdf("a5")}
            className={cn(toolbarBtnSoft, "min-w-0 flex-1 sm:min-w-[5.75rem]")}
          >
            PDF · A5
          </button>
          <button
            type="button"
            disabled={busy || !portalUrl || trialExportBlocked}
            onClick={downloadPng}
            className={cn(toolbarBtnSoft, "min-w-0 flex-1 sm:min-w-[4.5rem]")}
          >
            PNG
          </button>
        </div>
      </div>

      <BarberQrPreviewFrame className="mt-8" accent="customer">
        {!portalUrl ?
          <p className="px-2 text-center text-sm text-[#66638c]">ตั้งค่า URL แล้วจะมีตัวอย่างโปสเตอร์</p>
        : posterPreviewUrl ?
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterPreviewUrl}
            alt="ตัวอย่างโปสเตอร์ QR พอร์ทัลลูกค้า"
            className={barberQrHubPreviewImgClass}
          />
        : <div
            className={cn(
              barberQrHubPreviewImgClass,
              "flex h-[min(56vh,520px)] items-center justify-center bg-white/25 text-sm text-slate-500 backdrop-blur-[2px]",
            )}
          >
            กำลังเรนเดอร์ตัวอย่าง…
          </div>
        }
      </BarberQrPreviewFrame>
    </div>
  );

  const section = (
    <section className="min-w-0" aria-label="ป้าย QR ลูกค้า">
      {panel}
    </section>
  );

  if (embedded) return section;
  return <div className={barberPageStackClass}>{section}</div>;
}
