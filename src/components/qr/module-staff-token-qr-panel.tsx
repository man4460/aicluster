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
import { ModuleQrMonthlyGate } from "@/components/qr/ModuleQrMonthlyGate";
import { ShopStaffQrPanel } from "@/components/qr/shop-staff-qr-panel";
import { cn } from "@/lib/cn";

type Props = {
  /** slug โมดูล — สายรายวันจะล็อกแผง + ปุ่มอัปเกรด */
  moduleSlug: string;
  /** พ่อห่อ ModuleQrMonthlyGate แล้ว — ไม่ต้องตรวจซ้ำ */
  planGateAllowed?: boolean;
  /** เช่น `/api/drink-pos/session/staff-link` */
  staffLinkApiPath: string;
  shopLabel: string;
  logoUrl?: string | null;
  trialExportBlocked?: boolean;
  tagline?: string;
  mobileBannerText?: string;
  openPrimaryLabel?: string;
  openSecondaryLabel?: string;
  posterTintClass?: string;
};

type InnerProps = Omit<Props, "moduleSlug" | "planGateAllowed">;

/**
 * แผงสร้าง/แสดง QR พนักงานแบบโทเค็น (เหมือนร้านอาหาร) — ใช้ ShopStaffQrPanel
 * สายรายวันล็อก (ยกเว้นโมดูลฟรี)
 */
export function ModuleStaffTokenQrPanel({ moduleSlug, planGateAllowed, ...rest }: Props) {
  return (
    <ModuleQrMonthlyGate
      moduleSlug={moduleSlug}
      allowed={planGateAllowed}
      title="ลิงก์ / QR พนักงาน"
    >
      <ModuleStaffTokenQrPanelInner {...rest} />
    </ModuleQrMonthlyGate>
  );
}

function ModuleStaffTokenQrPanelInner({
  staffLinkApiPath,
  shopLabel,
  logoUrl = null,
  trialExportBlocked = false,
  tagline = "สแกนเข้าหน้าพนักงาน — ไม่มีวันหมดอายุ · หมุนโทเค็นใหม่เมื่อต้องการยกเลิก",
  mobileBannerText = "สแกน QR หรือเปิดลิงก์เพื่อเข้าหน้าพนักงาน (ไม่มีวันหมดอายุ)",
  openPrimaryLabel = "เปิดหน้าพนักงาน",
  openSecondaryLabel = "เปิดหน้า",
  posterTintClass = "shadow-amber-950/10",
}: InnerProps) {
  const [configured, setConfigured] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [qrPng, setQrPng] = useState<string | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dlBusy, setDlBusy] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [linkVisible, setLinkVisible] = useState(false);
  const [loadDone, setLoadDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [qrSize, setQrSize] = useState(240);

  const headline = shopLabel.trim() || "ร้าน";
  const resolvedLogo = useMemo(
    () => resolveAssetUrl(logoUrl, typeof window !== "undefined" ? window.location.origin : ""),
    [logoUrl],
  );

  const load = useCallback(async () => {
    const r = await fetch(staffLinkApiPath, { credentials: "include" });
    const d = (await r.json().catch(() => ({}))) as { configured?: boolean; url?: string | null; error?: string };
    if (!r.ok) throw new Error(d.error ?? "โหลดลิงก์ไม่สำเร็จ");
    setConfigured(!!d.configured);
    setPageUrl(typeof d.url === "string" && d.url.trim() ? d.url.trim() : "");
  }, [staffLinkApiPath]);

  useEffect(() => {
    void load()
      .catch((e) => setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"))
      .finally(() => setLoadDone(true));
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setQrSize(mq.matches ? 312 : 240);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!pageUrl) {
      setQrPng(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(pageUrl, {
      width: qrSize,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrPng(url);
      })
      .catch(() => {
        if (!cancelled) setQrPng(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pageUrl, qrSize]);

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
      .then((url) => {
        if (!cancelled) setPosterPreview(url);
      })
      .catch(() => {
        if (!cancelled) setPosterPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [qrPng, headline, resolvedLogo, tagline]);

  async function createOrRotate() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(staffLinkApiPath, { method: "POST", credentials: "include" });
      const d = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !d.url?.trim()) throw new Error(d.error ?? "สร้างลิงก์ไม่สำเร็จ");
      setConfigured(true);
      setPageUrl(d.url.trim());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "สร้างลิงก์ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!pageUrl) return;
    try {
      await navigator.clipboard.writeText(pageUrl);
    } catch {
      window.prompt("คัดลอกลิงก์:", pageUrl);
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
      await downloadPosterPdf(canvas, "staff-qr-a4.pdf", "a4");
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
      await downloadPosterPng(canvas, "staff-qr.png");
    } finally {
      setDlBusy(false);
    }
  }

  if (!loadDone) {
    return <p className="text-sm font-medium text-[#66638c]">กำลังโหลดลิงก์พนักงาน…</p>;
  }

  return (
    <div className="space-y-3">
      {err ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{err}</p> : null}
      {trialExportBlocked ? (
        <p className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-sm text-amber-950">
          โหมดทดลอง — ดาวน์โหลดโปสเตอร์ปิดชั่วคราว
        </p>
      ) : null}

      {!pageUrl ? (
        <div className="space-y-3 rounded-2xl border border-dashed border-amber-300/80 bg-amber-50/40 px-4 py-5 text-center">
          <p className="text-sm font-semibold text-[#1e1b4b]">
            {configured ? "ลิงก์ยังแสดงไม่ได้ — สร้างใหม่ได้" : "ยังไม่มีลิงก์พนักงาน"}
          </p>
          <p className="text-xs font-medium text-[#66638c]">{tagline}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void createOrRotate()}
            className="app-btn-primary mx-auto min-h-[44px] rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
          >
            {busy ? "กำลังสร้าง…" : "สร้างลิงก์พนักงาน"}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-[#66638c]">ลิงก์ถาวรพร้อมใช้ — ไม่มีวันหมดอายุ</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void createOrRotate()}
              className={cn(
                "rounded-xl border border-white/60 bg-white/80 px-3 py-1.5 text-xs font-bold text-[#4d47b6]",
                "hover:bg-white disabled:opacity-60",
              )}
            >
              {busy ? "…" : "หมุนโทเค็นใหม่"}
            </button>
          </div>
          <ShopStaffQrPanel
            pageUrl={pageUrl}
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
            qrAlt="QR พนักงาน"
            openPrimaryLabel={openPrimaryLabel}
            openSecondaryLabel={openSecondaryLabel}
            posterAlt="โปสเตอร์ QR พนักงาน"
          />
        </>
      )}
    </div>
  );
}
