"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import { BarberDashboardBackLink } from "@/systems/barber/components/BarberDashboardBackLink";
import { BarberQrPreviewFrame } from "@/systems/barber/components/BarberQrPreviewFrame";
import {
  barberCardBodyPaddingXClass,
  barberCardSurfaceRadiusClass,
  barberQrHubPanelClass,
  barberQrHubPreviewImgClass,
  barberQrHubToolbarClass,
} from "@/systems/barber/components/barber-ui-tokens";

const BARBER_STAFF_QR_TAGLINE =
  "สแกนเข้าหน้าพนักงาน — เช็กอินและจัดการคิววันนี้ (ต้องล็อกอินร้าน)";

type Props = {
  ownerId: string;
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  trialExportBlocked?: boolean;
  isTrialSandbox?: boolean;
  trialSessionId?: string;
  /** หน้ารวม QR — ซ่อนปุ่มกลับแดชบอร์ด */
  hideDashboardBackLink?: boolean;
};

function IconStaffQrBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#7c3aed] text-white shadow-md shadow-indigo-900/25",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
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

export function BarberStaffQrDashboardSection({
  ownerId,
  shopLabel,
  logoUrl,
  baseUrl,
  trialExportBlocked = false,
  isTrialSandbox = false,
  trialSessionId = "",
  hideDashboardBackLink = false,
}: Props) {
  const headline = shopLabel.trim() || "ร้านตัดผม";
  const resolvedLogoUrl = useMemo(() => resolveAssetUrl(logoUrl, baseUrl), [logoUrl, baseUrl]);

  const staffPageUrl = useMemo(() => {
    const root =
      baseUrl.startsWith("http://") || baseUrl.startsWith("https://") ? baseUrl.replace(/\/$/, "") : "";
    if (!root) return "";
    const u = new URL("/dashboard/barber/staff", root);
    if (isTrialSandbox && trialSessionId) u.searchParams.set("t", trialSessionId);
    return u.toString();
  }, [baseUrl, isTrialSandbox, trialSessionId]);

  const [staffPortalQr, setStaffPortalQr] = useState<string | null>(null);
  const [staffPosterPreviewUrl, setStaffPosterPreviewUrl] = useState<string | null>(null);
  const [staffQrBusy, setStaffQrBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!staffPageUrl) {
      setStaffPortalQr(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(staffPageUrl, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setStaffPortalQr(url);
      })
      .catch(() => {
        if (!cancelled) setStaffPortalQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [staffPageUrl]);

  useEffect(() => {
    if (!staffPortalQr) {
      setStaffPosterPreviewUrl(null);
      return;
    }
    let cancelled = false;
    void createShopQrPosterDataUrl({
      qrDataUrl: staffPortalQr,
      shopLabel: headline,
      logoUrl: resolvedLogoUrl,
      tagline: BARBER_STAFF_QR_TAGLINE,
    })
      .then((url) => {
        if (!cancelled) setStaffPosterPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setStaffPosterPreviewUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [staffPortalQr, resolvedLogoUrl, headline]);

  const copyStaffPageUrl = useCallback(async () => {
    if (!staffPageUrl) return;
    try {
      await navigator.clipboard.writeText(staffPageUrl);
      setCopied(true);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = staffPageUrl;
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
  }, [staffPageUrl]);

  async function downloadStaffQrPng() {
    if (!staffPageUrl || !staffPortalQr || trialExportBlocked) return;
    setStaffQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: staffPortalQr,
        shopLabel: headline,
        logoUrl: resolvedLogoUrl,
        tagline: BARBER_STAFF_QR_TAGLINE,
      });
      await downloadPosterPng(canvas, `barber-staff-qr-${ownerId.slice(0, 8)}.png`);
    } finally {
      setStaffQrBusy(false);
    }
  }

  async function downloadStaffQrPdf(format: "a4" | "a5") {
    if (!staffPageUrl || !staffPortalQr || trialExportBlocked) return;
    setStaffQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: staffPortalQr,
        shopLabel: headline,
        logoUrl: resolvedLogoUrl,
        tagline: BARBER_STAFF_QR_TAGLINE,
      });
      await downloadPosterPdf(canvas, `barber-staff-qr-${format}-${ownerId.slice(0, 8)}.pdf`, format);
    } finally {
      setStaffQrBusy(false);
    }
  }

  return (
    <section className="min-w-0" aria-label="QR พนักงาน">
      <div className={barberQrHubPanelClass}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="flex min-w-0 gap-3.5">
            <IconStaffQrBadge />
            <div className="min-w-0 pt-0.5">
              <h3 className="text-lg font-black tracking-tight sm:text-xl">
                <span className="bg-gradient-to-r from-[#5b61ff] via-[#9333ea] to-[#db2777] bg-clip-text text-transparent">
                  พนักงาน
                </span>
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-[#66638c]">คิววันนี้ · เช็กอิน · ต้องล็อกอินร้าน</p>
              <p className="mt-2 truncate text-xs font-semibold text-[#8b87ad]" title={headline}>
                {headline}
              </p>
            </div>
          </div>
          {!hideDashboardBackLink ?
            <div className="shrink-0 sm:pt-1">
              <BarberDashboardBackLink />
            </div>
          : null}
        </div>

        <div className="mt-6 space-y-3">
          {!staffPageUrl ?
            <p
              className={`${barberCardSurfaceRadiusClass} border border-amber-200/90 bg-amber-50/95 ${barberCardBodyPaddingXClass} py-3 text-sm leading-snug text-amber-950`}
            >
              ตั้งค่า <code className="rounded-md bg-white/90 px-1.5 py-px text-xs">NEXT_PUBLIC_APP_URL</code>{" "}
              เป็น URL จริง
            </p>
          : null}
          {trialExportBlocked ?
            <p
              className={`${barberCardSurfaceRadiusClass} border border-amber-200/90 bg-amber-50/95 ${barberCardBodyPaddingXClass} py-3 text-sm text-amber-950`}
            >
              โหมดทดลอง — ดาวน์โหลดปิดชั่วคราว
            </p>
          : null}

          <div className={barberQrHubToolbarClass}>
            <button
              type="button"
              disabled={!staffPageUrl}
              onClick={() => void copyStaffPageUrl()}
              className={cn(toolbarBtnSoft, "w-full sm:w-auto sm:min-w-[11rem]")}
              aria-label="คัดลอกลิงก์หน้าพนักงาน"
            >
              {copied ? "คัดลอกแล้ว ✓" : "คัดลอกลิงก์"}
            </button>
            <button
              type="button"
              disabled={staffQrBusy || !staffPageUrl || trialExportBlocked}
              onClick={() => void downloadStaffQrPdf("a4")}
              className={cn(toolbarBtnPrimary, "min-w-0 flex-1 sm:min-w-[5.75rem]")}
            >
              PDF · A4
            </button>
            <button
              type="button"
              disabled={staffQrBusy || !staffPageUrl || trialExportBlocked}
              onClick={() => void downloadStaffQrPdf("a5")}
              className={cn(toolbarBtnSoft, "min-w-0 flex-1 sm:min-w-[5.75rem]")}
            >
              PDF · A5
            </button>
            <button
              type="button"
              disabled={staffQrBusy || !staffPageUrl || trialExportBlocked}
              onClick={() => void downloadStaffQrPng()}
              className={cn(toolbarBtnSoft, "min-w-0 flex-1 sm:min-w-[4.5rem]")}
            >
              PNG
            </button>
          </div>
        </div>

        <BarberQrPreviewFrame className="mt-8" accent="staff">
          {!staffPageUrl ?
            <p className="px-2 text-center text-sm text-[#66638c]">ตั้งค่า URL แล้วจะมีตัวอย่างโปสเตอร์</p>
          : staffPosterPreviewUrl ?
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={staffPosterPreviewUrl}
              alt="ตัวอย่างโปสเตอร์ QR พนักงาน"
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
    </section>
  );
}
