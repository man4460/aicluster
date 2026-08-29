"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/cn";
import { villagePublicPortalUrl } from "@/lib/village/public-url";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";

export function VillageQrPosterClient({
  ownerId,
  trialSessionId,
  baseUrl,
  villageLabel,
  logoUrl = null,
  trialExportBlocked = false,
  compactForModal = false,
}: {
  ownerId: string;
  trialSessionId: string;
  baseUrl: string;
  villageLabel: string;
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
    if (!baseUrl.startsWith("http")) return villagePublicPortalUrl("", ownerId, trialSessionId);
    return villagePublicPortalUrl(baseUrl.replace(/\/$/, ""), ownerId, trialSessionId);
  }, [baseUrl, ownerId, trialSessionId]);

  const headline = villageLabel.trim() || "หมู่บ้าน";
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
    void createShopQrPosterDataUrl({
      qrDataUrl,
      shopLabel: headline,
      logoUrl: resolvedLogoUrl,
      tagline: "สแกนดูบ้านประกาศขาย · ติดต่อนิติ",
    }).then(setPosterPreviewUrl);
  }, [qrDataUrl, headline, resolvedLogoUrl]);

  return (
    <div className="space-y-4 text-left">
      {copyMsg ? <p className="text-sm font-semibold text-emerald-700">{copyMsg}</p> : null}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {posterPreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={posterPreviewUrl} alt="QR เว็บหมู่บ้าน" className="max-h-72 rounded-2xl shadow-lg" />
        ) : (
          <div className="h-48 w-48 animate-pulse rounded-2xl bg-white/50" />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-bold text-[#1e1b4b]">{headline}</p>
          {linkVisible ? (
            <p className="break-all text-xs font-semibold text-[#66638c]">{portalUrl}</p>
          ) : (
            <button
              type="button"
              className={cn(appTemplateOutlineButtonClass, "min-h-9 rounded-xl px-3 text-xs font-bold")}
              onClick={() => setLinkVisible(true)}
            >
              แสดงลิงก์
            </button>
          )}
          <div className="flex flex-wrap gap-2">
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(appTemplateOutlineButtonClass, "min-h-10 rounded-xl px-3 text-sm font-bold")}
            >
              เปิดเว็บหมู่บ้าน
            </a>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="app-btn-primary min-h-10 rounded-xl px-3 text-sm font-bold"
            >
              คัดลอกลิงก์
            </button>
          </div>
          {!trialExportBlocked ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={busy || !posterPreviewUrl}
                className={cn(appTemplateOutlineButtonClass, "min-h-10 rounded-xl px-3 text-sm font-bold")}
                onClick={async () => {
                  if (!posterPreviewUrl || !qrDataUrl) return;
                  setBusy(true);
                  try {
                    const canvas = await createShopQrPosterCanvas({
                      qrDataUrl,
                      shopLabel: headline,
                      logoUrl: resolvedLogoUrl,
                      tagline: "สแกนดูบ้านประกาศขาย · ติดต่อนิติ",
                    });
                    await downloadPosterPng(canvas, `${headline}-portal-qr.png`);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                PNG
              </button>
              <button
                type="button"
                disabled={busy || !qrDataUrl}
                className={cn(appTemplateOutlineButtonClass, "min-h-10 rounded-xl px-3 text-sm font-bold")}
                onClick={async () => {
                  if (!qrDataUrl) return;
                  setBusy(true);
                  try {
                    const canvas = await createShopQrPosterCanvas({
                      qrDataUrl,
                      shopLabel: headline,
                      logoUrl: resolvedLogoUrl,
                      tagline: "สแกนดูบ้านประกาศขาย · ติดต่อนิติ",
                    });
                    await downloadPosterPdf(canvas, `${headline}-portal-qr.pdf`);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                PDF
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
