"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/cn";
import { MassageDashboardBackLink } from "@/systems/massage/components/MassageDashboardBackLink";
import { MassageQrPreviewFrame } from "@/systems/massage/components/MassageQrPreviewFrame";
import {
  massageCardBodyPaddingXClass,
  massageCardSurfaceRadiusClass,
  massagePageStackClass,
  massageQrHubPanelClass,
  massageQrHubPreviewImgClass,
  massageQrHubToolbarClass,
} from "@/systems/massage/components/massage-ui-tokens";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";
import { massagePublicPortalUrl } from "@/lib/massage/public-url";

type Props = {
  ownerId: string;
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  trialSessionId?: string;
  /** โหมดทดลอง — ปิดดาวน์โหลด PDF/PNG */
  trialExportBlocked?: boolean;
  /** ใช้ในหน้ารวม QR — ไม่มีปุ่มกลับและไม่ห่อด้วย stack ชั้นนอก */
  embedded?: boolean;
  /** ใน FormModal — ซ่อนหัวการ์ดซ้ำกับชื่อโมดัล + มีปุ่มแสดง/ซ่อนลิงก์ (แบบคาร์แคร์) */
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
        <path d="M14 14h7v7h-7zM17 17h1v1h-1z" strokeLinecap="round" />
      </svg>
    </span>
  );
}

const toolbarBtnSoft = cn(
  massageCardSurfaceRadiusClass,
  "inline-flex min-h-[44px] items-center justify-center px-3 py-2 text-sm font-semibold text-[#2e2a58]",
  "border border-[#e8e6f4] bg-white/70 shadow-sm transition hover:bg-white active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45",
);

const toolbarBtnPrimary = cn(
  massageCardSurfaceRadiusClass,
  "app-btn-primary inline-flex min-h-[44px] items-center justify-center px-3 py-2 text-sm font-semibold text-white disabled:opacity-45",
);

export function MassageQrPosterClient({
  ownerId,
  shopLabel,
  logoUrl,
  baseUrl,
  trialSessionId = "prod",
  trialExportBlocked = false,
  embedded = false,
  compactForModal = false,
}: Props) {
  const portalUrl =
    baseUrl.startsWith("http://") || baseUrl.startsWith("https://")
      ? massagePublicPortalUrl(baseUrl, ownerId, trialSessionId)
      : "";
  const headline = shopLabel.trim() || "ร้านนวด";
  const logoSrc = useMemo(() => resolveAssetUrl(logoUrl, baseUrl), [logoUrl, baseUrl]);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [linkVisible, setLinkVisible] = useState(false);

  const copyPortalLink = useCallback(async () => {
    if (!portalUrl) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(portalUrl);
      ok = true;
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
        ok = true;
      } catch {
        return;
      }
    }
    if (!ok) return;
    if (compactForModal) {
      setCopyMsg("คัดลอกลิงก์แล้ว");
      window.setTimeout(() => setCopyMsg(null), 1800);
    } else {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
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
      tagline: "สแกน จองคิว · ใช้แพ็กได้เอง",
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
        tagline: "สแกน จองคิว · ใช้แพ็กได้เอง",
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
        tagline: "สแกน จองคิว · ใช้แพ็กได้เอง",
      });
      await downloadPosterPdf(canvas, `qr-poster-${format}-${ownerId.slice(0, 8)}.pdf`, format);
    } finally {
      setBusy(false);
    }
  }

  const panel = (
    <div className={massageQrHubPanelClass}>
      {!compactForModal ?
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
                สแกนเข้าหน้าลูกค้า · จองคิว · ใช้แพ็ก
              </p>
              <p className="mt-2 truncate text-xs font-semibold text-[#8b87ad]" title={headline}>
                {headline}
              </p>
            </div>
          </div>
          {!embedded ?
            <div className="shrink-0 sm:pt-1">
              <MassageDashboardBackLink />
            </div>
          : null}
        </div>
      : <p className="truncate text-xs font-semibold text-[#8b87ad]" title={headline}>
          {headline}
        </p>
      }

      <div className={cn("space-y-3", compactForModal ? "mt-0" : "mt-6")}>
        {!portalUrl ?
          <p
            className={`${massageCardSurfaceRadiusClass} border border-amber-200/90 bg-amber-50/95 ${massageCardBodyPaddingXClass} py-3 text-sm leading-snug text-amber-950`}
          >
            ตั้งค่า <code className="rounded-[1rem] bg-white/90 px-1.5 py-px text-xs">NEXT_PUBLIC_APP_URL</code>{" "}
            เป็น URL จริง
          </p>
        : trialExportBlocked ?
          <p
            className={`${massageCardSurfaceRadiusClass} border border-amber-200/90 bg-amber-50/95 ${massageCardBodyPaddingXClass} py-3 text-sm text-amber-950`}
          >
            โหมดทดลอง — ดาวน์โหลดปิดชั่วคราว
          </p>
        : null}

        {compactForModal ?
          <>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!portalUrl}
                onClick={() => void copyPortalLink()}
                className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] shadow-sm ring-1 ring-white/40 disabled:opacity-45"
                aria-label="คัดลอกลิงก์พอร์ทัลลูกค้า"
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <rect x="2" y="2" width="13" height="13" rx="2" />
                </svg>
                <span className="cw-btn-label">คัดลอกลิงก์</span>
              </button>
              <button
                type="button"
                disabled={!portalUrl}
                onClick={() => setLinkVisible((v) => !v)}
                className="cw-btn rounded-xl border border-white/55 bg-white/40 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md hover:bg-white/55 disabled:opacity-45"
                aria-label={linkVisible ? "ซ่อนลิงก์" : "แสดงลิงก์"}
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  {linkVisible ?
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.84-2 2.2-3.75 3.94-5.06M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a10.96 10.96 0 0 1-4.07 5.09M1 1l22 22" />
                  : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
                <span className="cw-btn-label">{linkVisible ? "ซ่อนลิงก์" : "แสดงลิงก์"}</span>
              </button>
              <button
                type="button"
                disabled={busy || !portalUrl || !qrDataUrl || trialExportBlocked}
                onClick={() => void downloadPdf("a4")}
                className="cw-btn app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
                aria-label="ดาวน์โหลด PDF (A4)"
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
                disabled={busy || !portalUrl || !qrDataUrl || trialExportBlocked}
                onClick={() => void downloadPng()}
                className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-60"
                aria-label="ดาวน์โหลด PNG"
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <span className="cw-btn-label">ดาวน์โหลด PNG</span>
              </button>
            </div>
            {copyMsg ?
              <p className="rounded-xl border border-emerald-200/60 bg-emerald-50/70 px-3 py-2 text-xs font-medium text-emerald-900 backdrop-blur-sm">
                {copyMsg}
              </p>
            : null}
          </>
        : <div className={massageQrHubToolbarClass}>
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
        }

        {compactForModal && portalUrl ?
            linkVisible ?
              <p className="break-all rounded-xl border border-white/50 bg-white/45 px-3 py-2 text-xs font-medium text-[#4d47b6] backdrop-blur-md">
                {portalUrl}
              </p>
            : <p className="rounded-xl border border-dashed border-white/45 bg-white/25 px-3 py-2 text-xs font-medium text-slate-600 backdrop-blur-sm">
              ลิงก์ถูกซ่อน — กด &quot;แสดงลิงก์&quot; หรือ &quot;คัดลอกลิงก์&quot; เมื่อต้องการ
            </p>
        : null}
      </div>

      <MassageQrPreviewFrame className={compactForModal ? "mt-6" : "mt-8"} accent="customer">
        {!portalUrl ?
          <p className="px-2 text-center text-sm text-[#66638c]">ตั้งค่า URL แล้วจะมีตัวอย่างโปสเตอร์</p>
        : posterPreviewUrl ?
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterPreviewUrl}
            alt="ตัวอย่างโปสเตอร์ QR พอร์ทัลลูกค้า"
            className={massageQrHubPreviewImgClass}
          />
        : <div
            className={cn(
              massageQrHubPreviewImgClass,
              "flex h-[min(56vh,520px)] items-center justify-center bg-white/25 text-sm text-slate-500 backdrop-blur-[2px]",
            )}
          >
            กำลังเรนเดอร์ตัวอย่าง…
          </div>
        }
      </MassageQrPreviewFrame>
    </div>
  );

  const section = (
    <section className="min-w-0" aria-label="ป้าย QR ลูกค้า">
      {panel}
    </section>
  );

  if (embedded) return section;
  return <div className={massagePageStackClass}>{section}</div>;
}
