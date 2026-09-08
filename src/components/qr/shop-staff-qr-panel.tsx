"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * UX/UI QR มาตรฐาน MAWELL — แสดงเฉพาะโปสเตอร์จาก `createShopQrPoster*`
 * ปุ่มแถวเดียว: คัดลอก · ดาวน์โหลด · เปิดเว็บ · แสดง/ซ่อนโปสเตอร์
 */
export type ShopStaffQrPanelProps = {
  pageUrl: string;
  /** ใช้เช็คว่ามี QR พร้อมดาวน์โหลด — ไม่แสดงรูปดิบ */
  qrPng: string | null;
  posterPreview: string | null;
  copyMsg: string | null;
  onCopyLink: () => void | Promise<void>;
  downloadBusy: boolean;
  trialExportBlocked?: boolean;
  /** ปุ่ม «ดาวน์โหลด» หลัก (มักเป็น PDF A4) */
  onDownload: () => void | Promise<void>;
  posterTintClass: string;
  mobileBannerText?: string | null;
  /** @deprecated ไม่แสดง QR ดิบแล้ว — เก็บไว้เพื่อไม่พัง callers */
  qrAlt?: string;
  /** ป้ายปุ่มเปิด เช่น «เปิดเว็บ» / «เปิดหน้าพนักงาน» */
  openLabel?: string;
  posterAlt: string;
  /** ค่าเริ่มแสดงโปสเตอร์ — ค่าเริ่ม true */
  defaultPosterVisible?: boolean;
};

const rowBtn =
  "cw-btn cw-btn-stack inline-flex min-h-9 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-semibold leading-tight touch-manipulation sm:flex-row sm:gap-1.5 sm:px-2 sm:text-xs";

export function ShopStaffQrPanel({
  pageUrl,
  qrPng,
  posterPreview,
  copyMsg,
  onCopyLink,
  downloadBusy,
  trialExportBlocked = false,
  onDownload,
  posterTintClass,
  mobileBannerText,
  openLabel = "เปิดเว็บ",
  posterAlt,
  defaultPosterVisible = true,
}: ShopStaffQrPanelProps) {
  const [posterVisible, setPosterVisible] = useState(defaultPosterVisible);
  const downloadsDisabled = downloadBusy || !qrPng || trialExportBlocked;
  const openDisabled = !pageUrl;
  const banner = mobileBannerText?.trim() || "";
  const hidePosterLabel = posterVisible ? "ซ่อน" : "แสดง";
  const hidePosterAria = posterVisible ? "ซ่อนโปสเตอร์" : "แสดงโปสเตอร์";

  function assignPage() {
    if (pageUrl) window.location.assign(pageUrl);
  }

  return (
    <div className="mx-auto w-full max-w-[360px] space-y-2.5 sm:max-w-[400px]">
      {banner ? (
        <p className="rounded-xl border border-indigo-200/90 bg-indigo-50/90 px-2.5 py-1.5 text-center text-[11px] font-semibold leading-snug text-indigo-950">
          {banner}
        </p>
      ) : null}

      {posterVisible ? (
        <div
          id="shop-staff-qr-poster-preview"
          className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/80 p-2 sm:rounded-2xl sm:border-white/50 sm:bg-white/30 sm:p-3 sm:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] sm:backdrop-blur-md"
        >
          {posterPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterPreview}
              alt={posterAlt}
              className={cn(
                "mx-auto w-full max-w-[min(88vw,320px)] rounded-2xl shadow-md sm:max-w-[360px] sm:rounded-3xl sm:shadow-lg",
                posterTintClass,
              )}
            />
          ) : pageUrl ? (
            <div className="mx-auto flex min-h-[200px] max-w-[min(88vw,320px)] items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-[11px] font-medium text-slate-600 sm:min-h-[360px] sm:max-w-[360px] sm:rounded-3xl sm:border-white/45 sm:bg-white/40 sm:text-xs sm:backdrop-blur-sm">
              กำลังเรนเดอร์โปสเตอร์...
            </div>
          ) : (
            <div className="mx-auto flex min-h-[120px] max-w-[min(88vw,320px)] items-center justify-center rounded-2xl border border-amber-300/50 bg-amber-100/35 px-3 text-center text-[11px] font-medium text-amber-950 sm:min-h-[160px] sm:max-w-md sm:rounded-3xl sm:px-4 sm:text-xs">
              ตั้งค่า NEXT_PUBLIC_APP_URL ให้เป็น URL เว็บจริง
            </div>
          )}
        </div>
      ) : null}

      <div
        role="toolbar"
        aria-label="การจัดการลิงก์และโปสเตอร์ QR"
        className="flex w-full flex-nowrap items-stretch gap-1.5"
      >
        <button
          type="button"
          aria-label="คัดลอกลิงก์"
          title="คัดลอก"
          onClick={() => void onCopyLink()}
          className={cn(rowBtn, "app-btn-soft text-[#4d47b6] shadow-sm ring-1 ring-white/40")}
        >
          <svg
            className="cw-btn-icon h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <rect x="2" y="2" width="13" height="13" rx="2" />
          </svg>
          <span className="cw-btn-label truncate">คัดลอก</span>
        </button>
        <button
          type="button"
          aria-label="ดาวน์โหลดโปสเตอร์"
          title="ดาวน์โหลด"
          disabled={downloadsDisabled}
          onClick={() => void onDownload()}
          className={cn(rowBtn, "app-btn-primary disabled:opacity-60")}
        >
          <svg
            className="cw-btn-icon h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m7 10 5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
          <span className="cw-btn-label truncate">ดาวน์โหลด</span>
        </button>
        <button
          type="button"
          aria-label={openLabel}
          title={openLabel}
          disabled={openDisabled}
          className={cn(rowBtn, "border border-slate-200/90 bg-white text-[#4d47b6] shadow-sm disabled:opacity-45")}
          onClick={assignPage}
        >
          <svg
            className="cw-btn-icon h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
          </svg>
          <span className="cw-btn-label truncate">{openLabel}</span>
        </button>
        <button
          type="button"
          aria-pressed={posterVisible}
          aria-controls="shop-staff-qr-poster-preview"
          aria-label={hidePosterAria}
          title={hidePosterAria}
          onClick={() => setPosterVisible((v) => !v)}
          className={cn(
            rowBtn,
            posterVisible
              ? "border border-[#5b61ff]/45 bg-[#5b61ff]/10 text-[#4d47b6] ring-1 ring-[#5b61ff]/20"
              : "border border-slate-200/90 bg-white text-[#4d47b6] shadow-sm",
          )}
        >
          <svg
            className="cw-btn-icon h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            {posterVisible ? (
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.84-2 2.2-3.75 3.94-5.06M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a10.96 10.96 0 0 1-4.07 5.09M1 1l22 22" />
            ) : (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
          <span className="cw-btn-label truncate">{hidePosterLabel}</span>
        </button>
      </div>

      {copyMsg ? (
        <p className="rounded-lg border border-emerald-200/60 bg-emerald-50/70 px-2.5 py-1.5 text-[11px] font-medium text-emerald-900 backdrop-blur-sm">
          {copyMsg}
        </p>
      ) : null}
    </div>
  );
}
