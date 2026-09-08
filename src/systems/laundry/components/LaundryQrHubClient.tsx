"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";
import { ModulePublicLinkQrPanel } from "@/components/qr/module-public-link-qr-panel";
import { ModuleQrMonthlyGate } from "@/components/qr/ModuleQrMonthlyGate";
import { ShopStaffQrPanel } from "@/components/qr/shop-staff-qr-panel";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { LAUNDRY_MODULE_SLUG } from "@/lib/modules/config";
import {
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
  const [staffCopyMsg, setStaffCopyMsg] = useState<string | null>(null);

  const staffQrTagline = "สแกนเข้าหน้าพนักงานรับ-ส่งผ้า (ต้องล็อกอินร้าน)";
  const customerPickupTagline = "สแกนเพื่อขอให้มารับผ้าที่บ้าน";

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
        footer={<ModalCloseFooter onClose={() => setShowCustomerQrModal(false)} />}
      >
        <ModulePublicLinkQrPanel
          moduleSlug={LAUNDRY_MODULE_SLUG}
          planGateAllowed
          pageUrl={customerPickupUrl}
          shopLabel={shopLabel}
          logoUrl={logoUrl}
          tagline={customerPickupTagline}
          openLabel="เปิดเว็บ"
          trialExportBlocked={trialExportBlocked}
          downloadFilePrefix="laundry-customer"
        />
      </FormModal>

      <FormModal
        open={showStaffQrModal}
        size="full"
        appearance="glass"
        glassTint="amber"
        mobileCentered
        onClose={() => setShowStaffQrModal(false)}
        title="QR พนักงาน"
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
          onCopyLink={() => void copyStaffLink()}
          downloadBusy={staffQrBusy}
          trialExportBlocked={trialExportBlocked}
          onDownload={() => void downloadStaffQrPdf()}
          posterTintClass="shadow-lg shadow-amber-950/10"
          mobileBannerText=""
          qrAlt={staffQrTagline}
          openLabel="เปิดหน้าพนักงาน"
          posterAlt={staffQrTagline}
        />
      </FormModal>
    </div>
    </ModuleQrMonthlyGate>
  );
}
