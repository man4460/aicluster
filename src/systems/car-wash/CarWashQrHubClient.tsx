"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  AppDashboardSection,
  AppSectionHeader,
} from "@/components/app-templates";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";
import { ModuleQrMonthlyGate } from "@/components/qr/ModuleQrMonthlyGate";
import { ModuleStaffTokenQrPanel } from "@/components/qr/module-staff-token-qr-panel";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { CAR_WASH_MODULE_SLUG } from "@/lib/modules/config";

const CAR_WASH_CUSTOMER_QR_TAGLINE = "สแกน จองคิว · เลือกแพ็ก · ใช้แพ็กเหมาได้เอง";

type Props = {
  ownerId: string;
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  trialSessionId: string;
  isTrialSandbox: boolean;
  embedded?: boolean;
};

export function CarWashQrHubClient({
  ownerId,
  shopLabel,
  logoUrl,
  baseUrl,
  trialSessionId,
  isTrialSandbox,
  embedded = false,
}: Props) {
  const [showCustomerQrModal, setShowCustomerQrModal] = useState(false);
  const [showStaffQrModal, setShowStaffQrModal] = useState(false);
  const [portalUrl, setPortalUrl] = useState("");
  const [portalQr, setPortalQr] = useState<string | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [qrLinkVisible, setQrLinkVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedLogoUrl = useMemo(() => resolveAssetUrl(logoUrl, baseUrl), [logoUrl, baseUrl]);

  const customerPortalPath = useMemo(() => {
    if (!ownerId) return "";
    const params = new URLSearchParams();
    if (isTrialSandbox) params.set("t", trialSessionId);
    const q = params.toString();
    const path = `/car-wash/${ownerId}`;
    return q ? `${path}?${q}` : path;
  }, [ownerId, trialSessionId, isTrialSandbox]);

  useEffect(() => {
    if (showCustomerQrModal) setQrLinkVisible(false);
  }, [showCustomerQrModal]);

  useEffect(() => {
    const root = baseUrl.startsWith("http://") || baseUrl.startsWith("https://") ? baseUrl : "";
    if (!root) {
      setPortalUrl("");
      return;
    }
    const params = new URLSearchParams();
    if (isTrialSandbox) params.set("t", trialSessionId);
    const q = params.toString();
    const base = `${root.replace(/\/$/, "")}/car-wash/${ownerId}`;
    setPortalUrl(q ? `${base}?${q}` : base);
  }, [baseUrl, ownerId, trialSessionId, isTrialSandbox]);

  useEffect(() => {
    if (!portalUrl) return;
    QRCode.toDataURL(portalUrl, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setPortalQr)
      .catch(() => setPortalQr(null));
  }, [portalUrl]);

  useEffect(() => {
    if (!portalQr) {
      setPosterPreviewUrl(null);
      return;
    }
    let cancelled = false;
    void createShopQrPosterDataUrl({
      qrDataUrl: portalQr,
      shopLabel: shopLabel.trim() || "คาร์แคร์",
      logoUrl: resolvedLogoUrl,
      tagline: CAR_WASH_CUSTOMER_QR_TAGLINE,
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
  }, [portalQr, resolvedLogoUrl, shopLabel]);

  async function copyPortalLink() {
    if (!portalUrl) return;
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopyMsg("คัดลอกลิงก์แล้ว");
      setTimeout(() => setCopyMsg(null), 1800);
    } catch {
      setError("คัดลอกลิงก์ไม่สำเร็จ");
    }
  }

  async function downloadQrPng() {
    if (!portalUrl || !portalQr) return;
    setQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: portalQr,
        shopLabel: shopLabel.trim() || "คาร์แคร์",
        logoUrl: resolvedLogoUrl,
        tagline: CAR_WASH_CUSTOMER_QR_TAGLINE,
      });
      await downloadPosterPng(canvas, "car-wash-qr-poster.png");
    } finally {
      setQrBusy(false);
    }
  }

  async function downloadQrPdf() {
    if (!portalUrl || !portalQr) return;
    setQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: portalQr,
        shopLabel: shopLabel.trim() || "คาร์แคร์",
        logoUrl: resolvedLogoUrl,
        tagline: CAR_WASH_CUSTOMER_QR_TAGLINE,
      });
      await downloadPosterPdf(canvas, "car-wash-qr-poster-a4.pdf", "a4");
    } finally {
      setQrBusy(false);
    }
  }

  const hubBody = (
    <>
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
      <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6", !embedded && "mt-4")}>
        <button
          type="button"
          onClick={() => {
            setShowStaffQrModal(false);
            setShowCustomerQrModal(true);
          }}
          className={cn(
            "group relative w-full overflow-hidden rounded-[2.5rem] border border-white/50 text-left",
            "bg-gradient-to-br from-white/50 via-indigo-50/35 to-violet-200/25",
            "p-6 shadow-[0_28px_70px_-24px_rgba(91,97,255,0.42),inset_0_1px_0_0_rgba(255,255,255,0.65)] backdrop-blur-2xl",
            "ring-1 ring-inset ring-white/60 transition-all duration-300",
            "hover:-translate-y-1 hover:border-white/75 hover:shadow-[0_34px_85px_-22px_rgba(91,97,255,0.48)]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b61ff]",
            "active:translate-y-0 sm:p-8",
          )}
          aria-label="เปิดจัดการ QR ลูกค้า"
        >
          <span className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#5b61ff]/28 blur-3xl" aria-hidden />
          <span className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-fuchsia-400/18 blur-3xl" aria-hidden />
          <div className="relative flex items-start gap-4 sm:gap-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#5b61ff] sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3h-3zM20 14h1v1h-1zM18 18h3v3h-3z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">QR ลูกค้า</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                พอร์ทัลจองคิว — เลือกแพ็กเกจ · จองตามช่วงเวลา · ใช้แพ็กเหมา — คัดลอกลิงก์ เปิดดู และดาวน์โหลดโปสเตอร์ในป๊อปอัป
              </p>
              <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5b61ff]">
                <span>คลิกเพื่อเปิด</span>
                <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
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
          className={cn(
            "group relative w-full overflow-hidden rounded-[2.5rem] border border-white/50 text-left",
            "bg-gradient-to-br from-white/50 via-amber-50/35 to-orange-100/22",
            "p-6 shadow-[0_28px_70px_-24px_rgba(217,119,6,0.35),inset_0_1px_0_0_rgba(255,255,255,0.65)] backdrop-blur-2xl",
            "ring-1 ring-inset ring-white/60 transition-all duration-300",
            "hover:-translate-y-1 hover:border-white/75 hover:shadow-[0_34px_85px_-22px_rgba(217,119,6,0.4)]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600",
            "active:translate-y-0 sm:p-8",
          )}
          aria-label="เปิดจัดการ QR พนักงาน"
        >
          <span className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-amber-400/25 blur-3xl" aria-hidden />
          <span className="pointer-events-none absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-orange-300/15 blur-3xl" aria-hidden />
          <div className="relative flex items-start gap-4 sm:gap-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-amber-700 sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">QR พนักงาน</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                หน้าลานบนมือถือเป็นหลัก — สแกน เปิดลิงก์ หรือดาวน์โหลดโปสเตอร์ในป๊อปอัป
              </p>
              <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-800">
                <span>คลิกเพื่อเปิด</span>
                <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
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
        description="ลิงก์พอร์ทัลจอง — เลือกแพ็ก · จองช่วงเวลา · ใช้แพ็กเหมา"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowCustomerQrModal(false)}
              className="cw-btn app-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
              <span className="cw-btn-label">ปิด</span>
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <a
              href={customerPortalPath || undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!customerPortalPath}
              className={cn(
                "cw-btn app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold",
                !customerPortalPath && "pointer-events-none opacity-60",
              )}
              aria-label="เปิดลิงก์พอร์ทัลลูกค้าบนโฮสต์นี้"
            >
              <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
              </svg>
              <span className="cw-btn-label">เปิดลิงก์ลูกค้า</span>
            </a>
            <button
              type="button"
              onClick={() => void copyPortalLink()}
              disabled={!portalUrl}
              className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] shadow-sm ring-1 ring-white/40 disabled:opacity-60"
            >
              <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden><rect x="9" y="9" width="13" height="13" rx="2" /><rect x="2" y="2" width="13" height="13" rx="2" /></svg>
              <span className="cw-btn-label">คัดลอกลิงก์</span>
            </button>
            <button
              type="button"
              onClick={() => setQrLinkVisible((v) => !v)}
              className="cw-btn rounded-xl border border-white/55 bg-white/40 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md hover:bg-white/55"
            >
              <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                {qrLinkVisible ? <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.84-2 2.2-3.75 3.94-5.06M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a10.96 10.96 0 0 1-4.07 5.09M1 1l22 22" /> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></>}
              </svg>
              <span className="cw-btn-label">{qrLinkVisible ? "ซ่อนลิงก์" : "แสดงลิงก์"}</span>
            </button>
            <button
              type="button"
              disabled={qrBusy || !portalUrl}
              onClick={() => void downloadQrPdf()}
              className="cw-btn app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
            >
              <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
              <span className="cw-btn-label">ดาวน์โหลด PDF (A4)</span>
            </button>
            <button
              type="button"
              disabled={qrBusy || !portalUrl}
              onClick={() => void downloadQrPng()}
              className="cw-btn app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-60"
            >
              <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
              <span className="cw-btn-label">ดาวน์โหลด PNG</span>
            </button>
          </div>
          {copyMsg ? (
            <p className="rounded-xl border border-emerald-200/60 bg-emerald-50/70 px-3 py-2 text-xs font-medium text-emerald-900 backdrop-blur-sm">
              {copyMsg}
            </p>
          ) : null}
          {qrLinkVisible ? (
            <p className="break-all rounded-xl border border-white/50 bg-white/45 px-3 py-2 text-xs font-medium text-[#4d47b6] backdrop-blur-md">
              {portalUrl || "-"}
            </p>
          ) : (
            <p className="rounded-xl border border-dashed border-white/45 bg-white/25 px-3 py-2 text-xs font-medium text-slate-600 backdrop-blur-sm">
              ลิงก์ถูกซ่อน — กด &quot;แสดงลิงก์&quot; หรือ &quot;คัดลอกลิงก์&quot; เมื่อต้องการ
            </p>
          )}
          <div className="overflow-x-auto rounded-2xl border border-white/50 bg-white/30 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] backdrop-blur-md">
            {posterPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={posterPreviewUrl} alt="ตัวอย่างโปสเตอร์ QR คาร์แคร์" className="mx-auto w-[340px] rounded-3xl shadow-lg shadow-indigo-950/10" />
            ) : (
              <div className="mx-auto flex h-[560px] w-[340px] items-center justify-center rounded-3xl border border-white/45 bg-white/40 text-xs font-medium text-slate-600 backdrop-blur-sm">
                กำลังเรนเดอร์ตัวอย่าง...
              </div>
            )}
          </div>
        </div>
      </FormModal>

      <FormModal
        open={showStaffQrModal}
        size="full"
        appearance="glass"
        glassTint="amber"
        mobileCentered
        onClose={() => setShowStaffQrModal(false)}
        title="QR พนักงาน"
        description="สร้างลิงก์ถาวร — พนักงานใช้ภาพรวมและแพ็ก · ตั้งรหัสประจำวันได้ที่ตั้งค่าร้าน → พื้นฐาน"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowStaffQrModal(false)}
              className="cw-btn app-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
              <span className="cw-btn-label">ปิด</span>
            </button>
          </div>
        }
      >
        <ModuleStaffTokenQrPanel
          moduleSlug={CAR_WASH_MODULE_SLUG}
          planGateAllowed
          staffLinkApiPath="/api/car-wash/session/staff-link"
          shopLabel={shopLabel.trim() || "คาร์แคร์"}
          logoUrl={resolvedLogoUrl}
          tagline="สแกนเข้าหน้าพนักงาน — ภาพรวม · แพ็ก"
          mobileBannerText="สแกน QR หรือเปิดลิงก์เพื่อเข้าหน้าพนักงานคาร์แคร์"
          openPrimaryLabel="เปิดหน้าพนักงาน"
        />
      </FormModal>
    </>
  );

  if (embedded) {
    return (
      <ModuleQrMonthlyGate moduleSlug={CAR_WASH_MODULE_SLUG}>
        <div className="min-w-0 space-y-4">{hubBody}</div>
      </ModuleQrMonthlyGate>
    );
  }

  return (
    <ModuleQrMonthlyGate moduleSlug={CAR_WASH_MODULE_SLUG}>
      <AppDashboardSection tone="violet">
        <AppSectionHeader tone="violet" title="ลิงก์ QR" />
        {hubBody}
      </AppDashboardSection>
    </ModuleQrMonthlyGate>
  );
}
