"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/cn";
import { loyaltyStampPublicCardUrl } from "@/lib/loyalty-stamp/public-url";
import { MassageQrPreviewFrame } from "@/systems/massage/components/MassageQrPreviewFrame";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";
import { lsQrHubPanelClass, lsQrHubPreviewImgClass, lsQrHubToolbarClass } from "@/systems/loyalty-stamp/loyalty-stamp-ui-tokens";

const TAGLINE = "สแกน เปิดการ์ดสะสมแต้ม";

type Props = {
  ownerId: string;
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  trialSessionId: string;
  trialExportBlocked?: boolean;
};

export function LoyaltyStampQrPosterClient({
  ownerId,
  shopLabel,
  logoUrl,
  baseUrl,
  trialSessionId,
  trialExportBlocked = false,
}: Props) {
  const portalUrl = useMemo(() => {
    if (!baseUrl.startsWith("http")) return "";
    return loyaltyStampPublicCardUrl(baseUrl.replace(/\/$/, ""), ownerId, trialSessionId);
  }, [baseUrl, ownerId, trialSessionId]);

  const headline = shopLabel.trim() || "สะสมแต้มดิจิทัล";
  const logoSrc = useMemo(() => resolveAssetUrl(logoUrl, baseUrl), [logoUrl, baseUrl]);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(async () => {
    if (!portalUrl) return;
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("คัดลอกลิงก์:", portalUrl);
    }
  }, [portalUrl]);

  useEffect(() => {
    if (!portalUrl) return;
    void QRCode.toDataURL(portalUrl, { width: 232, margin: 2, errorCorrectionLevel: "M" }).then(setQrDataUrl);
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
    }).then((url) => {
      if (!cancelled) setPosterPreviewUrl(url);
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
      await downloadPosterPng(canvas, `loyalty-qr-${ownerId.slice(0, 8)}.png`);
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
      await downloadPosterPdf(canvas, `loyalty-qr-${format}-${ownerId.slice(0, 8)}.pdf`, format);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={lsQrHubPanelClass}>
      <p className="text-left text-sm text-[#66638c]">ลูกค้าสแกนเปิดการ์ด — ไม่ต้องโหลดแอป</p>
      <div className="mt-4 space-y-3">
        <div className={lsQrHubToolbarClass}>
          <button
            type="button"
            disabled={!portalUrl}
            onClick={() => void copyLink()}
            className="app-btn-primary min-h-[44px] rounded-xl px-4 text-sm font-semibold"
          >
            {copied ? "คัดลอกแล้ว ✓" : "คัดลอกลิงก์"}
          </button>
          <button
            type="button"
            disabled={busy || !qrDataUrl || trialExportBlocked}
            onClick={() => void downloadPdf("a4")}
            className="app-btn-soft min-h-[44px] rounded-xl px-4 text-sm font-semibold"
          >
            PDF A4
          </button>
          <button
            type="button"
            disabled={busy || !qrDataUrl || trialExportBlocked}
            onClick={() => void downloadPng()}
            className="app-btn-soft min-h-[44px] rounded-xl px-4 text-sm font-semibold"
          >
            PNG
          </button>
        </div>
        <MassageQrPreviewFrame className="mt-2" accent="customer">
          {posterPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={posterPreviewUrl} alt="โปสเตอร์ QR สะสมแต้ม" className={lsQrHubPreviewImgClass} />
          ) : (
            <div
              className={cn(
                lsQrHubPreviewImgClass,
                "flex min-h-[200px] items-center justify-center bg-white/40 text-sm text-[#8b87ad]",
              )}
            >
              กำลังสร้างตัวอย่าง…
            </div>
          )}
        </MassageQrPreviewFrame>
      </div>
    </div>
  );
}
