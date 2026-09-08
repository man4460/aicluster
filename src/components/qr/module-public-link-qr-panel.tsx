"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";
import { ModuleQrMonthlyGate } from "@/components/qr/ModuleQrMonthlyGate";
import { ShopStaffQrPanel } from "@/components/qr/shop-staff-qr-panel";

type Props = {
  /** slug โมดูล — สายรายวันจะล็อกแผง + ปุ่มอัปเกรด */
  moduleSlug: string;
  /** พ่อห่อ ModuleQrMonthlyGate แล้ว — ไม่ต้องตรวจซ้ำ */
  planGateAllowed?: boolean;
  pageUrl: string;
  shopLabel: string;
  logoUrl?: string | null;
  trialExportBlocked?: boolean;
  tagline?: string;
  /** บรรทัดรองบนโปสเตอร์ (เช่น ช่องจอด · โซน) */
  subtitle?: string | null;
  footerText?: string | null;
  mobileBannerText?: string;
  /** ป้ายปุ่มเปิด — ค่าเริ่ม «เปิดเว็บ» */
  openLabel?: string;
  /** @deprecated ใช้ openLabel */
  openPrimaryLabel?: string;
  /** @deprecated ไม่ใช้แล้ว */
  openSecondaryLabel?: string;
  posterTintClass?: string;
  qrAlt?: string;
  posterAlt?: string;
  downloadFilePrefix?: string;
};

type InnerProps = Omit<Props, "moduleSlug" | "planGateAllowed">;

/**
 * แผง QR ลิงก์สาธารณะ (ลูกค้า) — UX เดียวกับ ModuleStaffTokenQrPanel / ShopStaffQrPanel
 * ใช้ URL คงที่ ไม่ต้องสร้างโทเค็น · สายรายวันล็อก (ยกเว้นโมดูลฟรี / LMS)
 */
export function ModulePublicLinkQrPanel({ moduleSlug, planGateAllowed, ...rest }: Props) {
  return (
    <ModuleQrMonthlyGate
      moduleSlug={moduleSlug}
      allowed={planGateAllowed}
      title="ลิงก์ / QR ลูกค้า"
    >
      <ModulePublicLinkQrPanelInner {...rest} />
    </ModuleQrMonthlyGate>
  );
}

function ModulePublicLinkQrPanelInner({
  pageUrl,
  shopLabel,
  logoUrl = null,
  trialExportBlocked = false,
  tagline = "สแกนเพื่อเปิดหน้าจองออนไลน์",
  subtitle = null,
  footerText = null,
  mobileBannerText = "",
  openLabel,
  openPrimaryLabel,
  openSecondaryLabel: _openSecondaryLabel,
  posterTintClass = "shadow-indigo-950/10",
  qrAlt = "QR ลิงก์ลูกค้า",
  posterAlt = "โปสเตอร์ QR ลิงก์ลูกค้า",
  downloadFilePrefix = "customer-qr",
}: InnerProps) {
  void _openSecondaryLabel;
  const resolvedOpenLabel = openLabel?.trim() || openPrimaryLabel?.trim() || "เปิดเว็บ";
  const url = pageUrl.trim();
  const [qrPng, setQrPng] = useState<string | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [dlBusy, setDlBusy] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
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
      subtitle,
      footerText,
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
  }, [qrPng, headline, resolvedLogo, tagline, subtitle, footerText]);

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
        subtitle,
        footerText,
      });
      await downloadPosterPdf(canvas, `${downloadFilePrefix}-a4.pdf`, "a4");
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
        <p className="rounded-lg border border-amber-200/90 bg-amber-50/95 px-2.5 py-1.5 text-xs text-amber-950">
          โหมดทดลอง — ดาวน์โหลดโปสเตอร์ปิดชั่วคราว
        </p>
      ) : null}
      <ShopStaffQrPanel
        pageUrl={url}
        qrPng={qrPng}
        posterPreview={posterPreview}
        copyMsg={copyMsg}
        onCopyLink={() => void copyLink()}
        downloadBusy={dlBusy}
        trialExportBlocked={trialExportBlocked}
        onDownload={() => void downloadPdf()}
        posterTintClass={posterTintClass}
        mobileBannerText={mobileBannerText}
        qrAlt={qrAlt}
        openLabel={resolvedOpenLabel}
        posterAlt={posterAlt}
      />
    </div>
  );
}
