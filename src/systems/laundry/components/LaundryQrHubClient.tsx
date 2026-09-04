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
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { LAUNDRY_MODULE_SLUG } from "@/lib/modules/config";
import {
  laundryCompactOutlineButtonClass,
  laundryDashboardSegmentBtnClass,
  laundryInlineSubNavBtnClass,
  laundryInlineSubNavShellClass,
} from "@/systems/laundry/lib/ui-tokens";

function qrHubCardClass(tone: "customer" | "staff", embedded: boolean) {
  if (embedded) {
    return cn(
      "group w-full rounded-[1.25rem] border border-slate-200/90 bg-white p-4 text-left shadow-sm transition",
      "hover:bg-slate-50/80 hover:shadow-md",
      tone === "customer" ?
        "hover:border-[#5b61ff]/35 focus-visible:outline-[#5b61ff]"
      : "hover:border-amber-300/80 focus-visible:outline-amber-600",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
      "sm:p-5",
    );
  }
  return cn(
    "group relative w-full overflow-hidden rounded-[2.5rem] border border-white/50 text-left",
    tone === "customer" ?
      "bg-gradient-to-br from-white/50 via-indigo-50/35 to-violet-200/25 shadow-[0_28px_70px_-24px_rgba(91,97,255,0.42),inset_0_1px_0_0_rgba(255,255,255,0.65)] hover:shadow-[0_34px_85px_-22px_rgba(91,97,255,0.48)] focus-visible:outline-[#5b61ff]"
    : "bg-gradient-to-br from-white/50 via-amber-50/35 to-orange-100/22 shadow-[0_28px_70px_-24px_rgba(217,119,6,0.35),inset_0_1px_0_0_rgba(255,255,255,0.65)] hover:shadow-[0_34px_85px_-22px_rgba(217,119,6,0.4)] focus-visible:outline-amber-600",
    "ring-1 ring-inset ring-white/60 backdrop-blur-2xl transition-all duration-300",
    "hover:-translate-y-1 hover:border-white/75",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    "active:translate-y-0 p-6 sm:p-8",
  );
}

function qrHubIconShellClass(tone: "customer" | "staff", embedded: boolean) {
  if (embedded) {
    return cn(
      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 sm:h-14 sm:w-14",
      tone === "customer" ? "bg-indigo-50 text-[#5b61ff] ring-indigo-100" : "bg-amber-50 text-amber-700 ring-amber-100",
    );
  }
  return "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16";
}

function LaundryQrPosterPanel({
  tagline,
  pageUrl,
  qrPng,
  posterPreview,
  trialExportBlocked,
  downloadBusy,
  copyMsg,
  linkVisible,
  setLinkVisible,
  onCopyLink,
  onDownloadPdf,
  onDownloadPng,
  posterTintClass,
  compactActions = false,
}: {
  tagline: string;
  pageUrl: string;
  qrPng: string | null;
  posterPreview: string | null;
  trialExportBlocked: boolean;
  downloadBusy: boolean;
  copyMsg: string | null;
  linkVisible: boolean;
  setLinkVisible: (v: boolean | ((p: boolean) => boolean)) => void;
  onCopyLink: () => void;
  onDownloadPdf: () => void | Promise<void>;
  onDownloadPng: () => void | Promise<void>;
  posterTintClass: string;
  compactActions?: boolean;
}) {
  const outlineBtn = compactActions ? laundryCompactOutlineButtonClass : "cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] shadow-sm ring-1 ring-white/40 disabled:opacity-45";
  const ghostBtn = compactActions ? laundryCompactOutlineButtonClass : "cw-btn rounded-xl border border-white/55 bg-white/40 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md hover:bg-white/55 disabled:opacity-45";
  const primaryBtn = compactActions ? cn(laundryDashboardSegmentBtnClass(true), "min-h-8 px-3 disabled:opacity-60") : "cw-btn app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60";

  return (
    <div className="space-y-3">
      {trialExportBlocked ?
        <p className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-sm text-amber-950">
          โหมดทดลอง — ดาวน์โหลดโปสเตอร์ปิดชั่วคราว
        </p>
      : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!pageUrl}
          onClick={() => void onCopyLink()}
          className={cn(outlineBtn, !compactActions && "cw-btn")}
          aria-label="คัดลอกลิงก์"
        >
          {!compactActions ? (
            <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <rect x="2" y="2" width="13" height="13" rx="2" />
            </svg>
          ) : null}
          <span className={compactActions ? undefined : "cw-btn-label"}>คัดลอกลิงก์</span>
        </button>
        <button
          type="button"
          disabled={!pageUrl}
          onClick={() => setLinkVisible((v) => !v)}
          className={cn(ghostBtn, !compactActions && "cw-btn")}
          aria-label={linkVisible ? "ซ่อนลิงก์" : "แสดงลิงก์"}
        >
          {!compactActions ? (
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
          ) : null}
          <span className={compactActions ? undefined : "cw-btn-label"}>{linkVisible ? "ซ่อนลิงก์" : "แสดงลิงก์"}</span>
        </button>
        <button
          type="button"
          disabled={downloadBusy || !qrPng || trialExportBlocked}
          onClick={() => void onDownloadPdf()}
          className={cn(primaryBtn, !compactActions && "cw-btn")}
          aria-label="ดาวน์โหลด PDF (A4)"
        >
          {!compactActions ? (
            <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
          ) : null}
          <span className={compactActions ? undefined : "cw-btn-label"}>ดาวน์โหลด PDF (A4)</span>
        </button>
        <button
          type="button"
          disabled={downloadBusy || !qrPng || trialExportBlocked}
          onClick={() => void onDownloadPng()}
          className={cn(outlineBtn, !compactActions && "cw-btn", !compactActions && "disabled:opacity-60")}
          aria-label="ดาวน์โหลด PNG"
        >
          {!compactActions ? (
            <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          ) : null}
          <span className={compactActions ? undefined : "cw-btn-label"}>ดาวน์โหลด PNG</span>
        </button>
      </div>
      {copyMsg ?
        <p className="rounded-xl border border-emerald-200/60 bg-emerald-50/70 px-3 py-2 text-xs font-medium text-emerald-900 backdrop-blur-sm">
          {copyMsg}
        </p>
      : null}
      {linkVisible ?
        <p className="break-all rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-2 text-xs font-medium text-[#4d47b6]">
          {pageUrl || "-"}
        </p>
      : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-600">
          ลิงก์ถูกซ่อน — กด &quot;แสดงลิงก์&quot; หรือ &quot;คัดลอกลิงก์&quot; เมื่อต้องการ
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-slate-50/50 p-4">
        {posterPreview ?
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterPreview}
            alt={tagline}
            className={cn("mx-auto w-[min(100%,340px)] rounded-2xl shadow-md", posterTintClass)}
          />
        : pageUrl ?
          <div className="mx-auto flex h-[480px] w-[min(100%,340px)] items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-xs font-medium text-slate-600">
            กำลังเรนเดอร์ตัวอย่าง…
          </div>
        : <div className="mx-auto flex min-h-[200px] max-w-md items-center justify-center rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 text-center text-xs font-medium text-amber-950">
            ตั้งค่า NEXT_PUBLIC_APP_URL ให้เป็น URL เว็บจริง เพื่อให้ลิงก์และโปสเตอร์ถูกต้อง
          </div>
        }
      </div>
    </div>
  );
}

function ModalCloseFooter({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex justify-end">
      <div className={laundryInlineSubNavShellClass} role="group">
        <button
          type="button"
          onClick={onClose}
          className={laundryInlineSubNavBtnClass(true)}
          aria-label="ปิด"
        >
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
          <span className="hidden sm:inline">ปิด</span>
        </button>
      </div>
    </div>
  );
}

/** ศูนย์ QR แบบร้านตัดผม — การ์ดคู่เปิด FormModal */
export function LaundryQrHubClient({
  ownerUserId,
  shopLabel,
  logoUrl,
  baseUrl,
  trialExportBlocked,
  isTrialSandbox,
  trialSessionId,
  embedded = false,
}: {
  ownerUserId: string;
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  trialExportBlocked: boolean;
  isTrialSandbox: boolean;
  trialSessionId: string;
  /** ฝังในแท็บตั้งค่า — การ์ดแบบเรียบเหมือนหน้าอื่นในโมดูล */
  embedded?: boolean;
}) {
  const [showCustomerQrModal, setShowCustomerQrModal] = useState(false);
  const [showStaffQrModal, setShowStaffQrModal] = useState(false);

  const [staffQrModuleSize, setStaffQrModuleSize] = useState(240);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setStaffQrModuleSize(mq.matches ? 312 : 240);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const [staffQrBusy, setStaffQrBusy] = useState(false);
  const [staffQrPng, setStaffQrPng] = useState<string | null>(null);
  const [staffPosterPreview, setStaffPosterPreview] = useState<string | null>(null);
  const [staffQrLinkVisible, setStaffQrLinkVisible] = useState(false);
  const [staffCopyMsg, setStaffCopyMsg] = useState<string | null>(null);

  const [customerQrBusy, setCustomerQrBusy] = useState(false);
  const [customerQrPng, setCustomerQrPng] = useState<string | null>(null);
  const [customerPosterPreview, setCustomerPosterPreview] = useState<string | null>(null);
  const [customerQrLinkVisible, setCustomerQrLinkVisible] = useState(false);
  const [customerCopyMsg, setCustomerCopyMsg] = useState<string | null>(null);

  const staffQrTagline = "สแกนเข้าหน้าพนักงานรับ-ส่งผ้า (ต้องล็อกอินร้าน)";
  /** โมดัล — สั้น · บนมือถือซ่อนบรรทัดนี้ใน FormModal */
  const staffQrModalDescription = "เน้นมือถือ — สแกน QR หรือเปิดหน้าพนักงาน (เหมือนคาร์แคร์)";
  const customerPickupTagline = "สแกนเพื่อขอให้มารับผ้าที่บ้าน";
  const customerQrModalDescription = "ลูกค้าสแกนเพื่อขอบริการรับ-ส่งที่บ้าน";

  const staffPageUrl = useMemo(() => {
    const root =
      baseUrl.startsWith("http://") || baseUrl.startsWith("https://") ? baseUrl.replace(/\/$/, "") : "";
    if (!root) return "";
    const u = new URL("/dashboard/laundry/staff", root);
    if (isTrialSandbox && trialSessionId) u.searchParams.set("t", trialSessionId);
    return u.toString();
  }, [baseUrl, isTrialSandbox, trialSessionId]);

  const customerPickupUrl = useMemo(() => {
    const root =
      baseUrl.startsWith("http://") || baseUrl.startsWith("https://") ? baseUrl.replace(/\/$/, "") : "";
    if (!root || !ownerUserId.trim()) return "";
    const u = new URL(`/laundry/${ownerUserId.trim()}`, root);
    if (isTrialSandbox && trialSessionId) u.searchParams.set("t", trialSessionId);
    return u.toString();
  }, [baseUrl, ownerUserId, isTrialSandbox, trialSessionId]);

  useEffect(() => {
    if (!staffPageUrl) {
      setStaffQrPng(null);
      return;
    }
    void QRCode.toDataURL(staffPageUrl, {
      width: staffQrModuleSize,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setStaffQrPng)
      .catch(() => setStaffQrPng(null));
  }, [staffPageUrl, staffQrModuleSize]);

  useEffect(() => {
    if (!staffQrPng) {
      setStaffPosterPreview(null);
      return;
    }
    void createShopQrPosterDataUrl({
      qrDataUrl: staffQrPng,
      shopLabel: shopLabel.trim() || "รับฝากซักผ้า",
      logoUrl: resolveAssetUrl(logoUrl, baseUrl),
      tagline: staffQrTagline,
    })
      .then(setStaffPosterPreview)
      .catch(() => setStaffPosterPreview(null));
  }, [staffQrPng, shopLabel, logoUrl, baseUrl]);

  useEffect(() => {
    if (!customerPickupUrl) {
      setCustomerQrPng(null);
      return;
    }
    void QRCode.toDataURL(customerPickupUrl, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setCustomerQrPng)
      .catch(() => setCustomerQrPng(null));
  }, [customerPickupUrl]);

  useEffect(() => {
    if (!customerQrPng) {
      setCustomerPosterPreview(null);
      return;
    }
    void createShopQrPosterDataUrl({
      qrDataUrl: customerQrPng,
      shopLabel: shopLabel.trim() || "รับฝากซักผ้า",
      logoUrl: resolveAssetUrl(logoUrl, baseUrl),
      tagline: customerPickupTagline,
    })
      .then(setCustomerPosterPreview)
      .catch(() => setCustomerPosterPreview(null));
  }, [customerQrPng, shopLabel, logoUrl, baseUrl]);

  const copyLinkToClipboard = useCallback(async (url: string, setMsg: (s: string | null) => void) => {
    if (!url) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        ok = true;
      } catch {
        return;
      }
    }
    if (!ok) return;
    setMsg("คัดลอกลิงก์แล้ว");
    window.setTimeout(() => setMsg(null), 1800);
  }, []);

  const copyStaffLink = useCallback(async () => {
    await copyLinkToClipboard(staffPageUrl, setStaffCopyMsg);
  }, [copyLinkToClipboard, staffPageUrl]);

  const copyCustomerLink = useCallback(async () => {
    await copyLinkToClipboard(customerPickupUrl, setCustomerCopyMsg);
  }, [copyLinkToClipboard, customerPickupUrl]);

  async function downloadStaffQrPdf() {
    if (!staffQrPng || trialExportBlocked) return;
    setStaffQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: staffQrPng,
        shopLabel: shopLabel.trim() || "รับฝากซักผ้า",
        logoUrl: resolveAssetUrl(logoUrl, baseUrl),
        tagline: staffQrTagline,
      });
      await downloadPosterPdf(canvas, "laundry-staff-qr-a4.pdf", "a4");
    } finally {
      setStaffQrBusy(false);
    }
  }

  async function downloadStaffQrPng() {
    if (!staffQrPng || trialExportBlocked) return;
    setStaffQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: staffQrPng,
        shopLabel: shopLabel.trim() || "รับฝากซักผ้า",
        logoUrl: resolveAssetUrl(logoUrl, baseUrl),
        tagline: staffQrTagline,
      });
      await downloadPosterPng(canvas, "laundry-staff-qr.png");
    } finally {
      setStaffQrBusy(false);
    }
  }

  async function downloadCustomerQrPdf() {
    if (!customerQrPng || trialExportBlocked) return;
    setCustomerQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: customerQrPng,
        shopLabel: shopLabel.trim() || "รับฝากซักผ้า",
        logoUrl: resolveAssetUrl(logoUrl, baseUrl),
        tagline: customerPickupTagline,
      });
      await downloadPosterPdf(canvas, "laundry-customer-pickup-qr-a4.pdf", "a4");
    } finally {
      setCustomerQrBusy(false);
    }
  }

  async function downloadCustomerQrPng() {
    if (!customerQrPng || trialExportBlocked) return;
    setCustomerQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: customerQrPng,
        shopLabel: shopLabel.trim() || "รับฝากซักผ้า",
        logoUrl: resolveAssetUrl(logoUrl, baseUrl),
        tagline: customerPickupTagline,
      });
      await downloadPosterPng(canvas, "laundry-customer-pickup-qr.png");
    } finally {
      setCustomerQrBusy(false);
    }
  }

  return (
    <ModuleQrMonthlyGate moduleSlug={LAUNDRY_MODULE_SLUG}>
    <div className="min-w-0 space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <button
          type="button"
          onClick={() => {
            setShowStaffQrModal(false);
            setShowCustomerQrModal(true);
          }}
          className={qrHubCardClass("customer", embedded)}
          aria-label="เปิดจัดการ QR ลูกค้า"
        >
          {!embedded ?
            <>
              <span className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#5b61ff]/28 blur-3xl" aria-hidden />
              <span className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-fuchsia-400/18 blur-3xl" aria-hidden />
            </>
          : null}
          <div className={cn("flex items-start gap-3 sm:gap-4", !embedded && "relative")}>
            <span className={qrHubIconShellClass("customer", embedded)}>
              <svg
                viewBox="0 0 24 24"
                className={embedded ? "h-6 w-6 sm:h-7 sm:w-7" : "h-7 w-7 text-[#5b61ff] sm:h-8 sm:w-8"}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3h-3zM20 14h1v1h-1zM18 18h3v3h-3z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className={cn("font-bold text-[#1e1b4b]", embedded ? "text-sm sm:text-base" : "text-lg font-black tracking-tight sm:text-xl")}>
                QR ลูกค้า
              </h3>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#66638c] sm:text-sm">
                ขอบริการรับ-ส่งที่บ้าน — คัดลอกลิงก์ ดาวน์โหลดโปสเตอร์ และดูตัวอย่างในป๊อปอัป
              </p>
              <p className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5b61ff] sm:mt-4 sm:text-[11px]">
                <span>คลิกเพื่อเปิด</span>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowCustomerQrModal(false);
            setShowStaffQrModal(true);
          }}
          className={qrHubCardClass("staff", embedded)}
          aria-label="เปิดจัดการ QR พนักงาน"
        >
          {!embedded ?
            <>
              <span className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-amber-400/25 blur-3xl" aria-hidden />
              <span className="pointer-events-none absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-orange-300/15 blur-3xl" aria-hidden />
            </>
          : null}
          <div className={cn("flex items-start gap-3 sm:gap-4", !embedded && "relative")}>
            <span className={qrHubIconShellClass("staff", embedded)}>
              <svg
                viewBox="0 0 24 24"
                className={embedded ? "h-6 w-6 sm:h-7 sm:w-7" : "h-7 w-7 text-amber-700 sm:h-8 sm:w-8"}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className={cn("font-bold text-[#1e1b4b]", embedded ? "text-sm sm:text-base" : "text-lg font-black tracking-tight sm:text-xl")}>
                QR พนักงาน
              </h3>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#66638c] sm:text-sm">
                หน้าคิวงานบนมือถือ — สแกน เปิดลิงก์ หรือดาวน์โหลดโปสเตอร์ในป๊อปอัป
              </p>
              <p className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-800 sm:mt-4 sm:text-[11px]">
                <span>คลิกเพื่อเปิด</span>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </p>
            </div>
          </div>
        </button>
      </div>

      <FormModal
        open={showCustomerQrModal}
        size="lg"
        appearance="glass"
        glassTint="violet"
        mobileCentered
        onClose={() => setShowCustomerQrModal(false)}
        title="QR ลูกค้า"
        description="ลูกค้าสแกนเพื่อกรอกข้อมูลขอบริการรับ-ส่งที่บ้าน — ระบบสร้างงานสถานะรอรับผ้า"
        footer={<ModalCloseFooter onClose={() => setShowCustomerQrModal(false)} />}
      >
        <LaundryQrPosterPanel
          tagline={customerPickupTagline}
          pageUrl={customerPickupUrl}
          qrPng={customerQrPng}
          posterPreview={customerPosterPreview}
          trialExportBlocked={trialExportBlocked}
          downloadBusy={customerQrBusy}
          copyMsg={customerCopyMsg}
          linkVisible={customerQrLinkVisible}
          setLinkVisible={setCustomerQrLinkVisible}
          onCopyLink={() => void copyCustomerLink()}
          onDownloadPdf={() => void downloadCustomerQrPdf()}
          onDownloadPng={() => void downloadCustomerQrPng()}
          posterTintClass="shadow-lg shadow-indigo-950/10"
          compactActions={embedded}
        />
      </FormModal>

      <FormModal
        open={showStaffQrModal}
        size="lg"
        appearance="glass"
        glassTint="amber"
        mobileCentered
        onClose={() => setShowStaffQrModal(false)}
        title="QR พนักงาน"
        description={staffQrModalDescription}
        footer={<ModalCloseFooter onClose={() => setShowStaffQrModal(false)} />}
      >
        {trialExportBlocked ?
          <p className="mb-3 rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-sm text-amber-950">
            โหมดทดลอง — ดาวน์โหลดโปสเตอร์ปิดชั่วคราว
          </p>
        : null}
        <ShopStaffQrPanel
          pageUrl={staffPageUrl}
          qrPng={staffQrPng}
          posterPreview={staffPosterPreview}
          copyMsg={staffCopyMsg}
          linkVisible={staffQrLinkVisible}
          setLinkVisible={setStaffQrLinkVisible}
          onCopyLink={() => void copyStaffLink()}
          downloadBusy={staffQrBusy}
          trialExportBlocked={trialExportBlocked}
          onDownloadPdfA4={() => void downloadStaffQrPdf()}
          onDownloadPng={() => void downloadStaffQrPng()}
          posterTintClass="shadow-lg shadow-amber-950/10"
          mobileBannerText="เน้นมือถือ — พนักงานสแกน QR หรือกดเปิดหน้างานบนเครื่องตัวเอง"
          qrAlt={staffQrTagline}
          openPrimaryLabel="เปิดหน้าพนักงานบนเครื่องนี้"
          openSecondaryLabel="เปิดหน้าพนักงาน"
          posterAlt={staffQrTagline}
        />
      </FormModal>
    </div>
    </ModuleQrMonthlyGate>
  );
}
