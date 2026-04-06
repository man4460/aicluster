"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { AppDashboardSection, AppSectionHeader } from "@/components/app-templates";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";
import { BarberDashboardBackLink } from "@/systems/barber/components/BarberDashboardBackLink";
import {
  barberSectionActionsRowClass,
  barberSectionFirstClass,
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
};

export function BarberStaffQrDashboardSection({
  ownerId,
  shopLabel,
  logoUrl,
  baseUrl,
  trialExportBlocked = false,
  isTrialSandbox = false,
  trialSessionId = "",
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
  const [staffQrLinkVisible, setStaffQrLinkVisible] = useState(false);
  const [staffCopyMsg, setStaffCopyMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!staffPageUrl) {
      setStaffPortalQr(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(staffPageUrl, {
      width: 240,
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
  }, [staffPageUrl]);

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
    try {
      await navigator.clipboard.writeText(staffPageUrl);
      setStaffCopyMsg("คัดลอกลิงก์หน้าพนักงานแล้ว");
      setTimeout(() => setStaffCopyMsg(null), 1800);
    } catch {
      setStaffCopyMsg(null);
    }
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

  async function downloadStaffQrPdf() {
    if (!staffPageUrl || !staffPortalQr || trialExportBlocked) return;
    setStaffQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: staffPortalQr,
        shopLabel: headline,
        logoUrl: resolvedLogoUrl,
        tagline: BARBER_STAFF_QR_TAGLINE,
      });
      await downloadPosterPdf(canvas, `barber-staff-qr-a4-${ownerId.slice(0, 8)}.pdf`, "a4");
    } finally {
      setStaffQrBusy(false);
    }
  }

  return (
    <section className={barberSectionFirstClass} aria-label="QR พนักงาน">
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="QR พนักงาน"
          description="สแกนแล้วเปิดหน้าคิวและเช็กอิน — พนักงานต้องล็อกอินร้านก่อนใช้งาน"
        />
        <div className="mt-4 space-y-3">
          {!staffPageUrl ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              ตั้งค่า <code className="rounded bg-white px-1">NEXT_PUBLIC_APP_URL</code> ให้เป็น URL เว็บจริง
              เพื่อให้ลิงก์และโปสเตอร์ถูกต้อง
            </p>
          ) : null}
          {trialExportBlocked ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              โหมดทดลอง — ดาวน์โหลด PDF/PNG โปสเตอร์ถูกปิด
            </p>
          ) : null}

          <div className={barberSectionActionsRowClass}>
            <BarberDashboardBackLink />
            <button
              type="button"
              disabled={!staffPageUrl}
              onClick={() => void copyStaffPageUrl()}
              className="app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-50"
            >
              คัดลอกลิงก์
            </button>
            <button
              type="button"
              onClick={() => setStaffQrLinkVisible((v) => !v)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {staffQrLinkVisible ? "ซ่อนลิงก์" : "แสดงลิงก์"}
            </button>
            <button
              type="button"
              disabled={staffQrBusy || !staffPortalQr || trialExportBlocked}
              onClick={() => void downloadStaffQrPdf()}
              className="app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
            >
              ดาวน์โหลด PDF (A4)
            </button>
            <button
              type="button"
              disabled={staffQrBusy || !staffPortalQr || trialExportBlocked}
              onClick={() => void downloadStaffQrPng()}
              className="app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-60"
            >
              ดาวน์โหลด PNG
            </button>
          </div>
          {staffCopyMsg ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">{staffCopyMsg}</p>
          ) : null}
          {staffQrLinkVisible ? (
            <p className="break-all rounded-lg bg-[#f8f8ff] px-3 py-2 text-xs text-[#4d47b6]">{staffPageUrl || "—"}</p>
          ) : staffPageUrl ? (
            <p className="rounded-lg border border-dashed border-[#d8d6ec] bg-[#faf9ff] px-3 py-2 text-xs text-[#8b87ad]">
              ลิงก์ถูกซ่อน — กด &quot;แสดงลิงก์&quot; หรือ &quot;คัดลอกลิงก์&quot; เมื่อต้องการ
            </p>
          ) : null}

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-4">
            {staffPosterPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={staffPosterPreviewUrl}
                alt="ตัวอย่างโปสเตอร์ QR พนักงานร้านตัดผม"
                className="mx-auto w-[340px] rounded-3xl shadow-md"
              />
            ) : staffPageUrl ? (
              <div className="mx-auto flex h-[560px] w-[340px] items-center justify-center rounded-3xl border border-slate-300 bg-white text-xs text-slate-500">
                กำลังเรนเดอร์ตัวอย่าง…
              </div>
            ) : null}
          </div>
        </div>
      </AppDashboardSection>
    </section>
  );
}
