"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/cn";
import { HotelResortButton } from "@/systems/hotel-resort/components/HotelResortButton";
import { MassageQrPreviewFrame } from "@/systems/massage/components/MassageQrPreviewFrame";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";
import {
  lsQrHubPanelClass,
  lsQrHubPreviewImgClass,
} from "@/systems/loyalty-stamp/loyalty-stamp-ui-tokens";

const TAGLINE = "สแกนเข้าหน้าพนักงานเช็คอิน";
const STAFF_LINK_API = "/api/hotel-resort/session/staff-link";

/**
 * แผง QR พนักงาน — UX เดียวกับ QR พอร์ทัลลูกค้า (cw-btn + โปสเตอร์)
 */
export function HotelResortStaffQrPosterClient({
  hotelLabel,
  logoUrl = null,
  trialExportBlocked = false,
  compactForModal = false,
}: {
  hotelLabel: string;
  logoUrl?: string | null;
  trialExportBlocked?: boolean;
  compactForModal?: boolean;
}) {
  const [configured, setConfigured] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [loadDone, setLoadDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dlBusy, setDlBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [linkVisible, setLinkVisible] = useState(false);

  const headline = hotelLabel.trim() || "โรงแรม / รีสอร์ท";
  const resolvedLogoUrl = useMemo(
    () => resolveAssetUrl(logoUrl, typeof window !== "undefined" ? window.location.origin : ""),
    [logoUrl],
  );

  const load = useCallback(async () => {
    const r = await fetch(STAFF_LINK_API, { credentials: "include" });
    const d = (await r.json().catch(() => ({}))) as {
      configured?: boolean;
      url?: string | null;
      error?: string;
    };
    if (!r.ok) throw new Error(d.error ?? "โหลดลิงก์ไม่สำเร็จ");
    setConfigured(!!d.configured);
    setPageUrl(typeof d.url === "string" && d.url.trim() ? d.url.trim() : "");
  }, []);

  useEffect(() => {
    void load()
      .catch((e) => setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"))
      .finally(() => setLoadDone(true));
  }, [load]);

  useEffect(() => {
    if (!pageUrl) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(pageUrl, { width: 232, margin: 2, errorCorrectionLevel: "M" })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pageUrl]);

  useEffect(() => {
    if (!qrDataUrl) {
      setPosterPreviewUrl(null);
      return;
    }
    let cancelled = false;
    void createShopQrPosterDataUrl({
      qrDataUrl,
      shopLabel: headline,
      logoUrl: resolvedLogoUrl,
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
  }, [qrDataUrl, headline, resolvedLogoUrl]);

  async function createOrRotate() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(STAFF_LINK_API, { method: "POST", credentials: "include" });
      const d = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !d.url?.trim()) throw new Error(d.error ?? "สร้างลิงก์ไม่สำเร็จ");
      setConfigured(true);
      setPageUrl(d.url.trim());
      setLinkVisible(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "สร้างลิงก์ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const copyLink = useCallback(async () => {
    if (!pageUrl) return;
    try {
      await navigator.clipboard.writeText(pageUrl);
    } catch {
      window.prompt("คัดลอกลิงก์", pageUrl);
      return;
    }
    setCopyMsg("คัดลอกลิงก์แล้ว");
    window.setTimeout(() => setCopyMsg(null), 1800);
  }, [pageUrl]);

  async function downloadPng() {
    if (!qrDataUrl || trialExportBlocked) return;
    setDlBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl,
        shopLabel: headline,
        logoUrl: resolvedLogoUrl,
        tagline: TAGLINE,
      });
      await downloadPosterPng(canvas, "hotel-resort-staff-qr.png");
    } finally {
      setDlBusy(false);
    }
  }

  async function downloadPdf() {
    if (!qrDataUrl || trialExportBlocked) return;
    setDlBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl,
        shopLabel: headline,
        logoUrl: resolvedLogoUrl,
        tagline: TAGLINE,
      });
      await downloadPosterPdf(canvas, "hotel-resort-staff-qr-a4.pdf", "a4");
    } finally {
      setDlBusy(false);
    }
  }

  if (!loadDone) {
    return <p className="text-sm font-medium text-[#66638c]">กำลังโหลดลิงก์พนักงาน…</p>;
  }

  return (
    <div className={cn(lsQrHubPanelClass, compactForModal && "border-0 bg-transparent p-0 shadow-none ring-0")}>
      {compactForModal ? (
        <p className="truncate text-xs font-semibold text-[#8b87ad]" title={headline}>
          {headline}
        </p>
      ) : (
        <>
          <p className="text-left text-sm font-black text-[#1e1b4b]">QR พนักงาน</p>
          <p className="mt-1 text-left text-xs text-[#66638c]">{TAGLINE}</p>
        </>
      )}

      <div className={cn("space-y-3", compactForModal ? "mt-0" : "mt-4")}>
        {err ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
            {err}
          </p>
        ) : null}
        {trialExportBlocked ? (
          <p className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-sm text-amber-950">
            โหมดทดลอง — ดาวน์โหลดปิดชั่วคราว
          </p>
        ) : null}

        {!pageUrl ? (
          <div className="space-y-3 rounded-2xl border border-dashed border-violet-300/70 bg-violet-50/40 px-4 py-5 text-center">
            <p className="text-sm font-semibold text-[#1e1b4b]">
              {configured ? "ลิงก์ยังแสดงไม่ได้ — สร้างใหม่ได้" : "ยังไม่มีลิงก์พนักงาน"}
            </p>
            <p className="text-xs font-medium text-[#66638c]">
              ลิงก์ถาวร · ไม่มีวันหมดอายุ · ไม่ต้องล็อกอินเจ้าของ
            </p>
            <HotelResortButton
              type="button"
              disabled={busy}
              onClick={() => void createOrRotate()}
              className="app-btn-primary mx-auto min-h-[44px] rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
            >
              {busy ? "กำลังสร้าง…" : "สร้างลิงก์พนักงาน"}
            </HotelResortButton>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-[#66638c]">ลิงก์ถาวรพร้อมใช้ — ไม่มีวันหมดอายุ</p>
              <HotelResortButton
                type="button"
                disabled={busy}
                onClick={() => void createOrRotate()}
                className="rounded-xl border border-white/60 bg-white/80 px-3 py-1.5 text-xs font-bold text-[#4d47b6] hover:bg-white disabled:opacity-60"
              >
                {busy ? "…" : "หมุนโทเค็นใหม่"}
              </HotelResortButton>
            </div>

            <div className="flex flex-wrap gap-2">
              <HotelResortButton
                type="button"
                onClick={() => void copyLink()}
                className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] shadow-sm ring-1 ring-white/40"
                aria-label="คัดลอกลิงก์"
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <rect x="2" y="2" width="13" height="13" rx="2" />
                </svg>
                <span className="cw-btn-label">คัดลอกลิงก์</span>
              </HotelResortButton>
              <HotelResortButton
                type="button"
                onClick={() => setLinkVisible((v) => !v)}
                className="cw-btn rounded-xl border border-white/55 bg-white/40 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md hover:bg-white/55"
                aria-label={linkVisible ? "ซ่อนลิงก์" : "แสดงลิงก์"}
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  {linkVisible ? (
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.84-2 2.2-3.75 3.94-5.06M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a10.96 10.96 0 0 1-4.07 5.09M1 1l22 22" />
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
                <span className="cw-btn-label">{linkVisible ? "ซ่อนลิงก์" : "แสดงลิงก์"}</span>
              </HotelResortButton>
              <HotelResortButton
                type="button"
                onClick={() => void downloadPdf()}
                disabled={dlBusy || !qrDataUrl || trialExportBlocked}
                className="cw-btn app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
                aria-label="ดาวน์โหลด PDF (A4)"
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
                <span className="cw-btn-label">ดาวน์โหลด PDF (A4)</span>
              </HotelResortButton>
              <HotelResortButton
                type="button"
                onClick={() => void downloadPng()}
                disabled={dlBusy || !qrDataUrl || trialExportBlocked}
                className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-60"
                aria-label="ดาวน์โหลด PNG"
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <span className="cw-btn-label">ดาวน์โหลด PNG</span>
              </HotelResortButton>
            </div>

            {copyMsg ? (
              <p className="rounded-xl border border-emerald-200/60 bg-emerald-50/70 px-3 py-2 text-xs font-medium text-emerald-900 backdrop-blur-sm">
                {copyMsg}
              </p>
            ) : null}
            {linkVisible ? (
              <p className="break-all rounded-xl border border-white/50 bg-white/45 px-3 py-2 text-xs font-medium text-[#4d47b6] backdrop-blur-md">
                {pageUrl}
              </p>
            ) : (
              <p className="rounded-xl border border-dashed border-white/45 bg-white/25 px-3 py-2 text-xs font-medium text-slate-600 backdrop-blur-sm">
                ลิงก์ถูกซ่อน — กด &quot;แสดงลิงก์&quot; หรือ &quot;คัดลอกลิงก์&quot; เมื่อต้องการ
              </p>
            )}
          </>
        )}
      </div>

      {pageUrl ? (
        <MassageQrPreviewFrame className={cn("shrink-0", compactForModal ? "mt-6" : "mt-4")}>
          {posterPreviewUrl ? (
            <img src={posterPreviewUrl} alt="ตัวอย่างโปสเตอร์ QR พนักงาน" className={lsQrHubPreviewImgClass} />
          ) : (
            <div
              className={cn(
                lsQrHubPreviewImgClass,
                "flex h-[min(56vh,520px)] items-center justify-center bg-white/25 text-sm text-[#66638c]",
              )}
            >
              กำลังสร้างตัวอย่าง QR...
            </div>
          )}
        </MassageQrPreviewFrame>
      ) : null}
    </div>
  );
}
