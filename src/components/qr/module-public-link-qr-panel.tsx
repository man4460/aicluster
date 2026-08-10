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
import { ShopStaffQrPanel } from "@/components/qr/shop-staff-qr-panel";

type Props = {
  pageUrl: string;
  shopLabel: string;
  logoUrl?: string | null;
  trialExportBlocked?: boolean;
  tagline?: string;
  mobileBannerText?: string;
  openPrimaryLabel?: string;
  openSecondaryLabel?: string;
  posterTintClass?: string;
  qrAlt?: string;
  posterAlt?: string;
  downloadFilePrefix?: string;
};

/**
 * แผง QR ลิงก์สาธารณะ (ลูกค้า) — UX เดียวกับ ModuleStaffTokenQrPanel / ShopStaffQrPanel
 * ใช้ URL คงที่ ไม่ต้องสร้างโทเค็น
 */
export function ModulePublicLinkQrPanel({
  pageUrl,
  shopLabel,
  logoUrl = null,
  trialExportBlocked = false,
  tagline = "สแกนเพื่อเปิดหน้าจองออนไลน์",
  mobileBannerText = "สแกน QR หรือเปิดลิงก์เพื่อจอง",
  openPrimaryLabel = "เปิดหน้าจอง",
  openSecondaryLabel = "เปิดหน้า",
  posterTintClass = "shadow-indigo-950/10",
  qrAlt = "QR ลิงก์ลูกค้า",
  posterAlt = "โปสเตอร์ QR ลิงก์ลูกค้า",
  downloadFilePrefix = "customer-qr",
}: Props) {
  const url = pageUrl.trim();
  const [qrPng, setQrPng] = useState<string | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [dlBusy, setDlBusy] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [linkVisible, setLinkVisible] = useState(false);
  const [qrSize, setQrSize] = useState(240);

  const headline = shopLabel.trim() || "ร้าน";
  const resolvedLogo = useMemo(
    () => resolveAssetUrl(logoUrl, typeof window !== "undefined" ? window.location.origin : ""),
    [logoUrl],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setQrSize(mq.matches ? 312 : 240);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!url) {
      setQrPng(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(url, {
      width: qrSize,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((data) => {
        if (!cancelled) setQrPng(data);
      })
      .catch(() => {
        if (!cancelled) setQrPng(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url, qrSize]);

  useEffect(() => {
    if (!qrPng) {
      setPosterPreview(null);
      return;
    }
    let cancelled = false;
    void createShopQrPosterDataUrl({
      qrDataUrl: qrPng,
      shopLabel: headline,
      logoUrl: resolvedLogo,
      tagline,
    })
      .then((data) => {
        if (!cancelled) setPosterPreview(data);
      })
      .catch(() => {
        if (!cancelled) setPosterPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [qrPng, headline, resolvedLogo, tagline]);

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("คัดลอกลิงก์:", url);
      return;
    }
    setCopyMsg("คัดลอกลิงก์แล้ว");
    window.setTimeout(() => setCopyMsg(null), 1800);
  }

  async function downloadPdf() {
    if (!qrPng || trialExportBlocked) return;
    setDlBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: qrPng,
        shopLabel: headline,
        logoUrl: resolvedLogo,
        tagline,
      });
      await downloadPosterPdf(canvas, `${downloadFilePrefix}-a4.pdf`, "a4");
    } finally {
      setDlBusy(false);
    }
  }

  async function downloadPng() {
    if (!qrPng || trialExportBlocked) return;
    setDlBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: qrPng,
        shopLabel: headline,
        logoUrl: resolvedLogo,
        tagline,
      });
      await downloadPosterPng(canvas, `${downloadFilePrefix}.png`);
    } finally {
      setDlBusy(false);
    }
  }

  if (!url) {
    return (
      <div className="space-y-3 rounded-2xl border border-dashed border-violet-300/80 bg-violet-50/40 px-4 py-5 text-center">
        <p className="text-sm font-semibold text-[#1e1b4b]">ยังไม่มีลิงก์ลูกค้า</p>
        <p className="text-xs font-medium text-[#66638c]">{tagline}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trialExportBlocked ? (
        <p className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-sm text-amber-950">
          โหมดทดลอง — ดาวน์โหลดโปสเตอร์ปิดชั่วคราว
        </p>
      ) : null}
      <p className="text-xs font-medium text-[#66638c]">ลิงก์จองพร้อมใช้ — สแกนหรือคัดลอกได้ทันที</p>
      <ShopStaffQrPanel
        pageUrl={url}
        qrPng={qrPng}
        posterPreview={posterPreview}
        copyMsg={copyMsg}
        linkVisible={linkVisible}
        setLinkVisible={setLinkVisible}
        onCopyLink={() => void copyLink()}
        downloadBusy={dlBusy}
        trialExportBlocked={trialExportBlocked}
        onDownloadPdfA4={() => void downloadPdf()}
        onDownloadPng={() => void downloadPng()}
        posterTintClass={posterTintClass}
        mobileBannerText={mobileBannerText}
        qrAlt={qrAlt}
        openPrimaryLabel={openPrimaryLabel}
        openSecondaryLabel={openSecondaryLabel}
        posterAlt={posterAlt}
      />
    </div>
  );
}
