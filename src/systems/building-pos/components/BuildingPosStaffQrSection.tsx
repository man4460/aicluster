"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { printDataUrlImagePoster } from "@/components/app-templates";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  shopQrTemplateGeneratedPosterThumbClass,
} from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import { buildingPosQrHubOuterClass } from "@/systems/building-pos/components/building-pos-ui-tokens";

const SHOP_ORDER_QR_TAGLINE = "สแกนเพื่อสั่งอาหารด้วยตนเอง";
const SHOP_ORDER_QR_SUBTITLE = "เลือกเมนู ระบุโต๊ะ แล้วส่งออเดอร์เข้าครัว";

/** เนื้อหา QR พนักงานเสิร์ฟ — ฝังในแท็บกลุ่ม QR */
export function BuildingPosStaffQrSection({
  shopLabel,
  logoUrl,
  compactForModal = false,
}: {
  shopLabel: string;
  logoUrl: string | null;
  compactForModal?: boolean;
}) {
  const [staffLinkConfigured, setStaffLinkConfigured] = useState(false);
  const [staffLinkUrl, setStaffLinkUrl] = useState<string | null>(null);
  const [staffLinkQr, setStaffLinkQr] = useState<string | null>(null);
  const [staffLinkPosterUrl, setStaffLinkPosterUrl] = useState<string | null>(null);
  const [staffLinkBusy, setStaffLinkBusy] = useState(false);
  const [staffDlBusy, setStaffDlBusy] = useState(false);
  const [linkLoadDone, setLinkLoadDone] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadStaffLink = useCallback(async () => {
    const r = await fetch("/api/building-pos/session/staff-link", { credentials: "include" });
    const d = (await r.json().catch(() => ({}))) as { configured?: boolean; url?: string | null };
    setStaffLinkConfigured(!!d.configured);
    if (typeof d.url === "string" && d.url.trim()) {
      setStaffLinkUrl(d.url.trim());
      return;
    }
    setStaffLinkUrl(null);
  }, []);

  useEffect(() => {
    void loadStaffLink()
      .catch(() => {
        setStaffLinkConfigured(false);
        setStaffLinkUrl(null);
      })
      .finally(() => setLinkLoadDone(true));
  }, [loadStaffLink]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      void loadStaffLink().catch(() => undefined);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [loadStaffLink]);

  useEffect(() => {
    const onFocusOrVisible = () => {
      if (document.hidden) return;
      void loadStaffLink().catch(() => undefined);
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [loadStaffLink]);

  useEffect(() => {
    if (!staffLinkUrl) {
      setStaffLinkQr(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(staffLinkUrl, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((png) => {
        if (!cancelled) setStaffLinkQr(png);
      })
      .catch(() => {
        if (!cancelled) setStaffLinkQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [staffLinkUrl]);

  const createStaffLink = useCallback(async () => {
    setStaffLinkBusy(true);
    try {
      const res = await fetch("/api/building-pos/session/staff-link", { method: "POST", credentials: "include" });
      const d = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok) throw new Error(d.error?.trim() || "สร้างลิงก์ไม่สำเร็จ");
      if (d.url) {
        setStaffLinkUrl(d.url.trim());
        setStaffLinkConfigured(true);
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "สร้างลิงก์ไม่สำเร็จ");
    } finally {
      setStaffLinkBusy(false);
    }
  }, []);

  const refreshStaffLink = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadStaffLink();
    } catch {
      setStaffLinkConfigured(false);
      setStaffLinkUrl(null);
    } finally {
      setRefreshing(false);
      setLinkLoadDone(true);
    }
  }, [loadStaffLink]);

  useEffect(() => {
    if (!staffLinkQr) {
      setStaffLinkPosterUrl(null);
      return;
    }
    void createShopQrPosterDataUrl({
      qrDataUrl: staffLinkQr,
      shopLabel: shopLabel.trim() || "POS ร้านอาหารอาคาร",
      logoUrl: logoUrl?.trim() || null,
      tagline: SHOP_ORDER_QR_TAGLINE,
      subtitle: SHOP_ORDER_QR_SUBTITLE,
    })
      .then(setStaffLinkPosterUrl)
      .catch(() => setStaffLinkPosterUrl(null));
  }, [staffLinkQr, shopLabel, logoUrl]);

  async function copyStaffLink() {
    if (!staffLinkUrl) return;
    try {
      await navigator.clipboard.writeText(staffLinkUrl);
    } catch {
      window.alert("คัดลอกไม่สำเร็จ");
    }
  }

  async function downloadStaffPng() {
    if (!staffLinkQr) return;
    setStaffDlBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: staffLinkQr,
        shopLabel: shopLabel.trim() || "POS ร้านอาหารอาคาร",
        logoUrl: logoUrl?.trim() || null,
        tagline: SHOP_ORDER_QR_TAGLINE,
        subtitle: SHOP_ORDER_QR_SUBTITLE,
      });
      await downloadPosterPng(canvas, "building-pos-staff-qr-poster.png");
    } finally {
      setStaffDlBusy(false);
    }
  }

  async function downloadStaffPdf(size: "a4" | "a5") {
    if (!staffLinkQr) return;
    setStaffDlBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: staffLinkQr,
        shopLabel: shopLabel.trim() || "POS ร้านอาหารอาคาร",
        logoUrl: logoUrl?.trim() || null,
        tagline: SHOP_ORDER_QR_TAGLINE,
        subtitle: SHOP_ORDER_QR_SUBTITLE,
      });
      const suffix = size === "a5" ? "a5" : "a4";
      await downloadPosterPdf(canvas, `building-pos-staff-qr-poster-${suffix}.pdf`, size);
    } finally {
      setStaffDlBusy(false);
    }
  }

  function printStaffPoster(printSize: "A4" | "A5") {
    if (!staffLinkPosterUrl) return;
    const ok = printDataUrlImagePoster({
      dataUrl: staffLinkPosterUrl,
      documentTitle: "พิมพ์ QR พนักงาน",
      pageSize: printSize,
    });
    if (!ok) window.alert("เปิดหน้าต่างพิมพ์ไม่ได้ — ลองอนุญาตป๊อปอัปหรือใช้ดาวน์โหลด PDF แทน");
  }

  const body = (
    <div className={cn("rounded-[1.25rem] border border-white/55 bg-white/75 p-4 shadow-inner backdrop-blur-sm sm:p-5", compactForModal && "rounded-[1.25rem]")}>
          <p className="text-xs font-bold uppercase tracking-wide text-[#4d47b6]">ลิงก์พนักงาน</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void refreshStaffLink()}
              disabled={refreshing}
              aria-busy={refreshing}
              aria-label="รีเฟรชลิงก์พนักงาน"
              title="รีเฟรช"
              className="inline-flex h-10 min-h-[40px] min-w-[40px] items-center justify-center gap-0 rounded-2xl border border-white/60 bg-white/60 px-0 text-sm font-black text-slate-700 shadow-sm backdrop-blur-sm hover:bg-white/80 disabled:opacity-40 sm:min-w-0 sm:gap-1.5 sm:px-4"
            >
              <svg
                viewBox="0 0 24 24"
                className={cn("h-5 w-5 shrink-0", refreshing && "animate-spin")}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.25}
                aria-hidden
              >
                <path d="M21 12a9 9 0 11-3.05-6.65M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="hidden sm:inline">{refreshing ? "กำลังรีเฟรช..." : "รีเฟรช"}</span>
            </button>
            {!staffLinkConfigured ? (
              <button
                type="button"
                onClick={() => void createStaffLink()}
                disabled={staffLinkBusy}
                className="app-btn-primary min-h-[44px] rounded-2xl px-4 py-2.5 text-sm font-black disabled:opacity-40"
              >
                {staffLinkBusy ? "กำลังสร้าง…" : "สร้างลิงก์และ QR"}
              </button>
            ) : null}
            {staffLinkUrl ? (
              <button
                type="button"
                onClick={() => void copyStaffLink()}
                className="flex h-10 min-h-[44px] items-center rounded-2xl border border-white/60 bg-white/60 px-4 text-sm font-black text-[#4d47b6] shadow-sm backdrop-blur-sm hover:bg-white/85"
              >
                คัดลอกลิงก์
              </button>
            ) : null}
          </div>

          {linkLoadDone && staffLinkConfigured && !staffLinkUrl ? (
            <p className="mt-3 rounded-[1.25rem] border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-xs text-amber-900">
              มีลิงก์ในระบบแต่ยังดึง QR ไม่ได้ — ตรวจ `AUTH_SECRET` ในเซิร์ฟเวอร์ แล้วกดรีเฟรชอีกครั้ง
            </p>
          ) : null}

          {staffLinkUrl && staffLinkQr ? (
            <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              {staffLinkPosterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={staffLinkPosterUrl}
                  alt="QR พนักงาน"
                  className={cn(shopQrTemplateGeneratedPosterThumbClass, "shrink-0")}
                />
              ) : (
                <div className="mx-auto flex min-h-[200px] w-full max-w-[280px] shrink-0 items-center justify-center rounded-[1.25rem] border border-dashed border-[#d8d6ec] bg-[#faf9ff] px-3">
                  <span className="text-center text-xs text-[#9b98c4]">กำลังสร้างใบป้าย…</span>
                </div>
              )}
              <div className="grid w-full max-w-md flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={staffDlBusy || !staffLinkQr}
                  onClick={() => void downloadStaffPdf("a4")}
                  className="app-btn-primary min-h-[44px] rounded-2xl px-4 py-3 text-sm font-black sm:py-2"
                >
                  ดาวน์โหลด PDF (A4)
                </button>
                <button
                  type="button"
                  disabled={staffDlBusy || !staffLinkQr}
                  onClick={() => void downloadStaffPdf("a5")}
                  className="flex min-h-[44px] items-center justify-center rounded-2xl border border-white/55 bg-white/70 px-4 py-3 text-sm font-black text-[#4d47b6] shadow-sm backdrop-blur-sm sm:py-2"
                >
                  ดาวน์โหลด PDF (A5)
                </button>
                <button
                  type="button"
                  disabled={staffDlBusy || !staffLinkQr}
                  onClick={() => void downloadStaffPng()}
                  className="flex min-h-[44px] items-center justify-center rounded-2xl border border-white/55 bg-white/70 px-4 py-3 text-sm font-black text-[#4d47b6] shadow-sm backdrop-blur-sm sm:py-2"
                >
                  ดาวน์โหลด PNG
                </button>
                <button
                  type="button"
                  disabled={!staffLinkPosterUrl}
                  onClick={() => printStaffPoster("A4")}
                  className="flex min-h-[44px] items-center justify-center rounded-2xl border border-white/55 bg-white/70 px-4 py-3 text-sm font-black text-[#4d47b6] shadow-sm backdrop-blur-sm sm:py-2"
                >
                  พิมพ์ A4
                </button>
                <button
                  type="button"
                  disabled={!staffLinkPosterUrl}
                  onClick={() => printStaffPoster("A5")}
                  className="flex min-h-[44px] items-center justify-center rounded-2xl border border-white/55 bg-white/70 px-4 py-3 text-sm font-black text-[#4d47b6] shadow-sm backdrop-blur-sm sm:col-span-2 sm:py-2"
                >
                  พิมพ์ A5
                </button>
              </div>
            </div>
          ) : staffLinkUrl && !staffLinkQr ? (
            <p className="mt-3 text-xs text-[#66638c]">กำลังสร้าง QR…</p>
          ) : (
            <p className="mt-3 text-xs text-[#66638c]">สร้างลิงก์พนักงานด้านบนเพื่อแสดง QR และใบป้าย</p>
          )}
    </div>
  );

  if (compactForModal) return body;

  return (
    <section className={buildingPosQrHubOuterClass}>
      <div className="border-b border-white/50 bg-gradient-to-r from-[#4d47b6]/[0.08] via-transparent to-[#0d9488]/[0.06] px-4 py-4 sm:px-6 sm:py-5">
        <h2 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">QR พนักงาน</h2>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#66638c] sm:text-sm">
          สแกนเข้าจัดการโต๊ะโดยไม่ล็อกอิน — ใช้ลิงก์เดิมคงที่หลังสร้างครั้งแรก · ใบป้ายเทมเพลตเดียวกับ QR ลูกค้า
        </p>
      </div>
      <div className="p-4 sm:p-6">{body}</div>
    </section>
  );
}
