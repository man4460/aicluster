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
import { ShopStaffQrPanel } from "@/components/qr/shop-staff-qr-panel";
import { cn } from "@/lib/cn";
import { BarberDashboardBackLink } from "@/systems/barber/components/BarberDashboardBackLink";
import {
  barberCardBodyPaddingXClass,
  barberCardSurfaceRadiusClass,
  barberQrHubPanelClass,
} from "@/systems/barber/components/barber-ui-tokens";

const BARBER_STAFF_QR_TAGLINE =
  "สแกนเข้าหน้าพนักงาน — เช็กอินและจัดการคิววันนี้ (ต้องล็อกอินร้าน)";

type Props = {
  ownerId: string;
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  trialExportBlocked?: boolean;
  isTrialSandbox?: boolean;
  trialSessionId?: string;
  /** หน้ารวม QR — ซ่อนปุ่มกลับแดชบอร์ด */
  hideDashboardBackLink?: boolean;
  /** ใน FormModal — ซ่อนหัวการ์ดซ้ำกับชื่อโมดัล + แสดง/ซ่อนลิงก์ */
  compactForModal?: boolean;
};

function IconStaffQrBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#5b61ff] to-[#7c3aed] text-white shadow-md shadow-indigo-900/25",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function BarberStaffQrDashboardSection({
  ownerId,
  shopLabel,
  logoUrl,
  baseUrl,
  trialExportBlocked = false,
  isTrialSandbox = false,
  trialSessionId = "",
  hideDashboardBackLink = false,
  compactForModal = false,
}: Props) {
  const headline = shopLabel.trim() || "ร้านตัดผม";
  const resolvedLogoUrl = useMemo(() => resolveAssetUrl(logoUrl, baseUrl), [logoUrl, baseUrl]);

  const staffPageUrl = useMemo(() => {
    const root =
      baseUrl.startsWith("http://") || baseUrl.startsWith("https://") ? baseUrl.replace(/\/$/, "") : "";
    if (!root) return "";
    const u = new URL("/dashboard/barber/staff", root);
    if (isTrialSandbox && trialSessionId) u.searchParams.set("t", trialSessionId);
    return u.toString();
  }, [baseUrl, isTrialSandbox, trialSessionId]);

  const [staffPortalQr, setStaffPortalQr] = useState<string | null>(null);
  const [staffPosterPreviewUrl, setStaffPosterPreviewUrl] = useState<string | null>(null);
  const [staffQrBusy, setStaffQrBusy] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [linkVisible, setLinkVisible] = useState(false);
  /** บนมือถือใช้โมดูลใหญ่ขึ้นให้สแกนง่าย — สอดคล้องคาร์แคร์ */
  const [qrModuleSize, setQrModuleSize] = useState(240);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setQrModuleSize(mq.matches ? 312 : 240);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!staffPageUrl) {
      setStaffPortalQr(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(staffPageUrl, {
      width: qrModuleSize,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setStaffPortalQr(url);
      })
      .catch(() => {
        if (!cancelled) setStaffPortalQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [staffPageUrl, qrModuleSize]);

  useEffect(() => {
    if (!staffPortalQr) {
      setStaffPosterPreviewUrl(null);
      return;
    }
    let cancelled = false;
    void createShopQrPosterDataUrl({
      qrDataUrl: staffPortalQr,
      shopLabel: headline,
      logoUrl: resolvedLogoUrl,
      tagline: BARBER_STAFF_QR_TAGLINE,
    })
      .then((url) => {
        if (!cancelled) setStaffPosterPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setStaffPosterPreviewUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [staffPortalQr, resolvedLogoUrl, headline]);

  const copyStaffPageUrl = useCallback(async () => {
    if (!staffPageUrl) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(staffPageUrl);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = staffPageUrl;
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
    setCopyMsg("คัดลอกลิงก์แล้ว");
    window.setTimeout(() => setCopyMsg(null), 2000);
  }, [staffPageUrl]);

  async function downloadStaffQrPng() {
    if (!staffPageUrl || !staffPortalQr || trialExportBlocked) return;
    setStaffQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: staffPortalQr,
        shopLabel: headline,
        logoUrl: resolvedLogoUrl,
        tagline: BARBER_STAFF_QR_TAGLINE,
      });
      await downloadPosterPng(canvas, `barber-staff-qr-${ownerId.slice(0, 8)}.png`);
    } finally {
      setStaffQrBusy(false);
    }
  }

  async function downloadStaffQrPdf(format: "a4" | "a5") {
    if (!staffPageUrl || !staffPortalQr || trialExportBlocked) return;
    setStaffQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: staffPortalQr,
        shopLabel: headline,
        logoUrl: resolvedLogoUrl,
        tagline: BARBER_STAFF_QR_TAGLINE,
      });
      await downloadPosterPdf(canvas, `barber-staff-qr-${format}-${ownerId.slice(0, 8)}.pdf`, format);
    } finally {
      setStaffQrBusy(false);
    }
  }

  return (
    <section className="min-w-0" aria-label="QR พนักงาน">
      <div className={barberQrHubPanelClass}>
        {!compactForModal ?
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
            <div className="flex min-w-0 gap-3.5">
              <IconStaffQrBadge />
              <div className="min-w-0 pt-0.5">
                <h3 className="text-lg font-black tracking-tight sm:text-xl">
                  <span className="bg-gradient-to-r from-[#5b61ff] via-[#9333ea] to-[#db2777] bg-clip-text text-transparent">
                    พนักงาน
                  </span>
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[#66638c]">คิววันนี้ · เช็กอิน · ต้องล็อกอินร้าน</p>
                <p className="mt-2 truncate text-xs font-semibold text-[#8b87ad]" title={headline}>
                  {headline}
                </p>
              </div>
            </div>
            {!hideDashboardBackLink ?
              <div className="shrink-0 sm:pt-1">
                <BarberDashboardBackLink />
              </div>
            : null}
          </div>
        : <p className="truncate text-xs font-semibold text-[#8b87ad]" title={headline}>
            {headline}
          </p>
        }

        <div className={cn("space-y-3", compactForModal ? "mt-0" : "mt-6")}>
          {!staffPageUrl ?
            <p
              className={`${barberCardSurfaceRadiusClass} border border-amber-200/90 bg-amber-50/95 ${barberCardBodyPaddingXClass} py-3 text-sm leading-snug text-amber-950`}
            >
              ตั้งค่า <code className="rounded-[1rem] bg-white/90 px-1.5 py-px text-xs">NEXT_PUBLIC_APP_URL</code>{" "}
              เป็น URL จริง
            </p>
          : null}
          {trialExportBlocked ?
            <p
              className={`${barberCardSurfaceRadiusClass} border border-amber-200/90 bg-amber-50/95 ${barberCardBodyPaddingXClass} py-3 text-sm text-amber-950`}
            >
              โหมดทดลอง — ดาวน์โหลดปิดชั่วคราว
            </p>
          : null}

          <ShopStaffQrPanel
            pageUrl={staffPageUrl}
            qrPng={staffPortalQr}
            posterPreview={staffPosterPreviewUrl}
            copyMsg={copyMsg}
            linkVisible={linkVisible}
            setLinkVisible={setLinkVisible}
            onCopyLink={() => void copyStaffPageUrl()}
            downloadBusy={staffQrBusy}
            trialExportBlocked={trialExportBlocked}
            onDownloadPdfA4={() => void downloadStaffQrPdf("a4")}
            onDownloadPng={() => void downloadStaffQrPng()}
            onDownloadPdfA5={() => void downloadStaffQrPdf("a5")}
            posterTintClass="shadow-lg shadow-indigo-950/10"
            mobileBannerText="เน้นมือถือ — พนักงานสแกน QR หรือกดเปิดหน้าพนักงานบนเครื่องตัวเอง"
            qrAlt="QR เข้าหน้าพนักงานร้านตัดผม"
            openPrimaryLabel="เปิดหน้าพนักงานบนเครื่องนี้"
            openSecondaryLabel="เปิดหน้าพนักงาน"
            posterAlt="ตัวอย่างโปสเตอร์ QR พนักงานร้านตัดผม"
          />
        </div>
      </div>
    </section>
  );
}
