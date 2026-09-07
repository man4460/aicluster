"use client";

import { cn } from "@/lib/cn";

/**
 * UX/UI QR พนักงานมาตรฐาน MAWELL — อ้างอิงจากคาร์แคร์ (มือถือก่อน + เดสก์ท็อปแถวปุ่ม + พรีวิวโปสเตอร์)
 * ใช้ใน FormModal / แผงในหน้า QR hub ของโมดูลที่มีพอร์ทัลพนักงาน
 *
 * มือถือ: ปุ่มขนาด template (`min-h-9` · `text-xs`) + `cw-btn-stack` (อย่าย่อเหลือไอคอน)
 */
export type ShopStaffQrPanelProps = {
  pageUrl: string;
  qrPng: string | null;
  posterPreview: string | null;
  copyMsg: string | null;
  linkVisible: boolean;
  setLinkVisible: (v: boolean | ((p: boolean) => boolean)) => void;
  onCopyLink: () => void | Promise<void>;
  downloadBusy: boolean;
  trialExportBlocked?: boolean;
  onDownloadPdfA4: () => void | Promise<void>;
  onDownloadPng: () => void | Promise<void>;
  /** ถ้ามี — แสดมือถือใน `<details>` และแถวปุ่มเดสก์ท็อป */
  onDownloadPdfA5?: () => void | Promise<void>;
  posterTintClass: string;
  /** แถบคำอธิบายมือถือ — ว่าง = ไม่แสดง */
  mobileBannerText?: string | null;
  qrAlt: string;
  /** ปุ่มหลักเต็มความกว้าง — เฉพาะมือถือ */
  openPrimaryLabel: string;
  /** ปุ่มในกริดคู่กับแสดง/ซ่อนลิงก์ — เฉพาะมือถือ */
  openSecondaryLabel: string;
  posterAlt: string;
};

/** ขนาดมือถือตาม dashboard-mobile-compact-wrap · laundryBtnHeight (h-9) */
const mobileStackBtn =
  "cw-btn cw-btn-stack inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold touch-manipulation";

export function ShopStaffQrPanel({
  pageUrl,
  qrPng,
  posterPreview,
  copyMsg,
  linkVisible,
  setLinkVisible,
  onCopyLink,
  downloadBusy,
  trialExportBlocked = false,
  onDownloadPdfA4,
  onDownloadPng,
  onDownloadPdfA5,
  posterTintClass,
  mobileBannerText,
  qrAlt,
  openPrimaryLabel,
  openSecondaryLabel,
  posterAlt,
}: ShopStaffQrPanelProps) {
  const downloadsDisabled = downloadBusy || !qrPng || trialExportBlocked;
  const openDisabled = !pageUrl;
  const banner = mobileBannerText?.trim() || "";

  function assignPage() {
    if (pageUrl) window.location.assign(pageUrl);
  }

  return (
    <div className="space-y-2.5">
      {pageUrl && qrPng ?
        <>
          {banner ?
            <p className="rounded-xl border border-indigo-200/90 bg-indigo-50/90 px-2.5 py-1.5 text-center text-[11px] font-semibold leading-snug text-indigo-950 sm:hidden">
              {banner}
            </p>
          : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrPng}
            alt={qrAlt}
            className="mx-auto block w-full max-w-[min(88vw,300px)] rounded-xl border border-white/70 bg-white p-2.5 shadow-md shadow-amber-950/10 sm:hidden"
          />
          <button
            type="button"
            disabled={openDisabled}
            className="app-btn-primary flex min-h-9 w-full items-center justify-center rounded-lg text-xs font-semibold shadow-sm disabled:opacity-45 sm:hidden"
            onClick={assignPage}
          >
            {openPrimaryLabel}
          </button>
        </>
      : null}

      <div className="flex flex-col gap-1.5 sm:hidden">
        <button
          type="button"
          onClick={() => void onCopyLink()}
          className={cn(
            mobileStackBtn,
            "app-btn-soft text-[#4d47b6] shadow-sm ring-1 ring-white/40",
          )}
        >
          <svg className="cw-btn-icon h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <rect x="2" y="2" width="13" height="13" rx="2" />
          </svg>
          <span className="cw-btn-label">คัดลอกลิงก์</span>
        </button>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setLinkVisible((v) => !v)}
            className={cn(
              mobileStackBtn,
              "border border-slate-200/90 bg-white px-2 py-1.5 text-slate-700 shadow-sm",
            )}
          >
            <svg className="cw-btn-icon h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
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
            disabled={openDisabled}
            className={cn(mobileStackBtn, "app-btn-primary px-2 py-1.5 font-semibold disabled:opacity-45")}
            onClick={assignPage}
          >
            <svg className="cw-btn-icon h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <path d="M15 3h6v6" />
              <path d="M10 14 21 3" />
            </svg>
            <span className="cw-btn-label">{openSecondaryLabel}</span>
          </button>
        </div>
        <details className="rounded-xl border border-slate-200/90 bg-white shadow-sm">
          <summary className="cursor-pointer list-none px-2.5 py-2 text-center text-xs font-bold text-[#4d47b6] [&::-webkit-details-marker]:hidden">
            ดาวน์โหลดและโปสเตอร์
          </summary>
          <div className="flex flex-col gap-1.5 border-t border-slate-100 px-2.5 pb-2.5 pt-2">
            <button
              type="button"
              disabled={downloadsDisabled}
              onClick={() => void onDownloadPdfA4()}
              className={cn(mobileStackBtn, "app-btn-primary disabled:opacity-60")}
            >
              <span className="cw-btn-label">ดาวน์โหลด PDF (A4)</span>
            </button>
            {onDownloadPdfA5 ?
              <button
                type="button"
                disabled={downloadsDisabled}
                onClick={() => void onDownloadPdfA5()}
                className={cn(mobileStackBtn, "app-btn-soft text-[#4d47b6] disabled:opacity-60")}
              >
                <span className="cw-btn-label">ดาวน์โหลด PDF (A5)</span>
              </button>
            : null}
            <button
              type="button"
              disabled={downloadsDisabled}
              onClick={() => void onDownloadPng()}
              className={cn(mobileStackBtn, "app-btn-soft text-[#4d47b6] disabled:opacity-60")}
            >
              <span className="cw-btn-label">ดาวน์โหลด PNG</span>
            </button>
            <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/80 p-2">
              {posterPreview ?
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={posterPreview}
                  alt={posterAlt}
                  className={cn("mx-auto w-full max-w-[min(88vw,280px)] rounded-2xl shadow-md", posterTintClass)}
                />
              : pageUrl ?
                <div className="mx-auto flex min-h-[140px] max-w-[min(88vw,280px)] items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-[11px] font-medium text-slate-600">
                  กำลังเรนเดอร์ตัวอย่าง...
                </div>
              : (
                <div className="mx-auto flex min-h-[120px] max-w-[min(88vw,280px)] items-center justify-center rounded-2xl border border-amber-300/50 bg-amber-100/35 px-3 text-center text-[11px] font-medium text-amber-950">
                  ตั้งค่า NEXT_PUBLIC_APP_URL ให้เป็น URL เว็บจริง
                </div>
              )}
            </div>
          </div>
        </details>
      </div>

      <div className="hidden flex-wrap gap-2 sm:flex">
        <button
          type="button"
          onClick={() => void onCopyLink()}
          className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] shadow-sm ring-1 ring-white/40"
        >
          <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <rect x="2" y="2" width="13" height="13" rx="2" />
          </svg>
          <span className="cw-btn-label">คัดลอกลิงก์</span>
        </button>
        <button
          type="button"
          onClick={() => setLinkVisible((v) => !v)}
          className="cw-btn rounded-xl border border-white/55 bg-white/40 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md hover:bg-white/55"
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
          disabled={downloadsDisabled}
          onClick={() => void onDownloadPdfA4()}
          className="cw-btn app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
        >
          <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
          <span className="cw-btn-label">ดาวน์โหลด PDF (A4)</span>
        </button>
        {onDownloadPdfA5 ?
          <button
            type="button"
            disabled={downloadsDisabled}
            onClick={() => void onDownloadPdfA5()}
            className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-60"
          >
            <span className="cw-btn-label">ดาวน์โหลด PDF (A5)</span>
          </button>
        : null}
        <button
          type="button"
          disabled={downloadsDisabled}
          onClick={() => void onDownloadPng()}
          className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-60"
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
        <p className="rounded-lg border border-emerald-200/60 bg-emerald-50/70 px-2.5 py-1.5 text-[11px] font-medium text-emerald-900 backdrop-blur-sm">
          {copyMsg}
        </p>
      : null}

      {linkVisible ?
        <p className="break-all rounded-lg border border-white/50 bg-white/45 px-2.5 py-1.5 text-[11px] font-medium text-[#4d47b6] backdrop-blur-md">
          {pageUrl || "-"}
        </p>
      : null}

      <div className="hidden overflow-x-auto rounded-2xl border border-white/50 bg-white/30 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] backdrop-blur-md sm:block">
        {posterPreview ?
          // eslint-disable-next-line @next/next/no-img-element
          <img src={posterPreview} alt={posterAlt} className={cn("mx-auto w-[340px] rounded-3xl shadow-lg", posterTintClass)} />
        : pageUrl ?
          <div className="mx-auto flex h-[560px] w-[340px] items-center justify-center rounded-3xl border border-white/45 bg-white/40 text-xs font-medium text-slate-600 backdrop-blur-sm">
            กำลังเรนเดอร์ตัวอย่าง...
          </div>
        : (
          <div className="mx-auto flex min-h-[200px] max-w-md items-center justify-center rounded-3xl border border-amber-300/50 bg-amber-100/35 px-4 text-center text-xs font-medium text-amber-950 backdrop-blur-sm">
            ตั้งค่า NEXT_PUBLIC_APP_URL ให้เป็น URL เว็บจริง เพื่อให้ลิงก์และโปสเตอร์ถูกต้อง
          </div>
        )}
      </div>
    </div>
  );
}
