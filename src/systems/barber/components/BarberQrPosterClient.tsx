"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { AppSectionHeader } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { BarberDashboardBackLink } from "@/systems/barber/components/BarberDashboardBackLink";
import {
  barberPageStackClass,
  barberSectionActionsRowClass,
  barberSectionFirstClass,
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
};

export function BarberQrPosterClient({
  ownerId,
  shopLabel,
  logoUrl,
  baseUrl,
  trialExportBlocked = false,
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

  return (
    <div className={barberPageStackClass}>
      <section className={barberSectionFirstClass} aria-label="ป้าย QR">
        <AppSectionHeader tone="violet" title="ป้าย QR" />
        {!portalUrl ? (
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            ไม่พบ Host — ใช้ URL จริงหรือตั้ง{" "}
            <code className="rounded bg-white px-1">NEXT_PUBLIC_APP_URL</code>
          </p>
        ) : trialExportBlocked ? (
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            ทดลอง — ดาวน์โหลด PDF/PNG ไม่เปิด (สมัครใช้งานเต็มรูปแบบ)
          </p>
        ) : null}

        <div className={cn("mt-4", barberSectionActionsRowClass)}>
          <BarberDashboardBackLink />
          <button
            type="button"
            disabled={!portalUrl}
            onClick={() => void copyPortalLink()}
            className="app-btn-soft rounded-xl px-4 py-2.5 text-sm font-semibold text-[#2e2a58] disabled:opacity-50"
            aria-label="คัดลอกลิงก์พอร์ทัลลูกค้า"
          >
            {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
          </button>
          <button
            type="button"
            disabled={busy || !portalUrl || trialExportBlocked}
            onClick={() => downloadPdf("a4")}
            className="app-btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            PDF A4
          </button>
          <button
            type="button"
            disabled={busy || !portalUrl || trialExportBlocked}
            onClick={() => downloadPdf("a5")}
            className="app-btn-soft rounded-xl px-4 py-2.5 text-sm font-semibold text-[#2e2a58] disabled:opacity-50"
          >
            PDF A5
          </button>
          <button
            type="button"
            disabled={busy || !portalUrl || trialExportBlocked}
            onClick={downloadPng}
            className="app-btn-soft rounded-xl px-4 py-2.5 text-sm font-semibold text-[#2e2a58] disabled:opacity-50"
          >
            PNG
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-[#ecebff] bg-[#f8f7ff] p-4 sm:p-6">
          {posterPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterPreviewUrl}
              alt="ตัวอย่างโปสเตอร์ QR ร้านตัดผม"
              className="mx-auto w-[340px] rounded-2xl shadow-md"
            />
          ) : (
            <div className="mx-auto flex h-[560px] w-[340px] items-center justify-center rounded-2xl border border-slate-300 bg-white text-xs text-slate-500">
              กำลังเรนเดอร์ตัวอย่าง...
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
