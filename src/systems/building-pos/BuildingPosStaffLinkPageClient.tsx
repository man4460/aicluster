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
import { BuildingPosUnifiedMenuBar } from "@/systems/building-pos/components/BuildingPosUnifiedMenuBar";

/** เทมเพลตใบป้ายเดียวกับแท็บ QR สั่งอาหาร (ลิงก์ใน QR ยังเป็นลิงก์พนักงานเสิร์ฟ) */
const SHOP_ORDER_QR_TAGLINE = "สแกนเพื่อสั่งอาหารด้วยตนเอง";
const SHOP_ORDER_QR_SUBTITLE = "เลือกเมนู ระบุโต๊ะ แล้วส่งออเดอร์เข้าครัว";

export function BuildingPosStaffLinkPageClient({
  shopLabel,
  logoUrl,
}: {
  shopLabel: string;
  logoUrl: string | null;
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

  const mintStaffLink = useCallback(async () => {
    setStaffLinkBusy(true);
    try {
      const res = await fetch("/api/building-pos/session/staff-link", { method: "POST", credentials: "include" });
      const d = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok) throw new Error(d.error?.trim() || "สร้างลิงก์ไม่สำเร็จ");
      if (d.url) {
        setStaffLinkUrl(d.url);
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
      documentTitle: "พิมพ์ QR พนักงานเสิร์ฟ",
      pageSize: printSize,
    });
    if (!ok) window.alert("เปิดหน้าต่างพิมพ์ไม่ได้ — ลองอนุญาตป๊อปอัปหรือใช้ดาวน์โหลด PDF แทน");
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <BuildingPosUnifiedMenuBar />

      <section className="overflow-hidden rounded-3xl border border-[#d4d2f0]/90 bg-gradient-to-br from-white via-[#faf9ff] to-[#ecebff]/90 shadow-[0_24px_60px_-28px_rgba(77,71,182,0.45)]">
        <div className="border-b border-[#e6e4fa] bg-gradient-to-r from-[#4d47b6]/[0.07] via-transparent to-[#7c3aed]/[0.04] px-4 py-4 sm:px-6 sm:py-5">
          <h2 className="text-lg font-bold tracking-tight text-[#2e2a58] sm:text-xl">QR พนักงานเสิร์ฟ</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#66638c] sm:text-sm">
            สแกนเข้าจัดการโต๊ะโดยไม่ล็อกอิน — QR แสดงค้างหลังสร้างลิงก์ (โหลดใหม่ก็ยังเห็น) · ใบป้ายใช้เทมเพลตเดียวกับแท็บ QR สั่งอาหาร
          </p>
        </div>
        <div className="p-4 sm:p-6">
          <div className="rounded-2xl border border-[#e1e3ff] bg-white/90 p-4 sm:p-5">
            <p className="text-xs font-medium text-[#4d47b6]">ลิงก์พนักงานเสิร์ฟ</p>
            <p className="mt-1 text-xs text-[#66638c]">
              สร้างลิงก์ครั้งแรกหรือหมุนลิงก์ใหม่ — ลิงก์เก่าจะใช้ไม่ได้ทันที
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void refreshStaffLink()}
                disabled={refreshing}
                className="app-btn-soft rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4d47b6] disabled:opacity-40"
              >
                {refreshing ? "กำลังรีเฟรช..." : "รีเฟรช"}
              </button>
              <button
                type="button"
                onClick={() => void mintStaffLink()}
                disabled={staffLinkBusy}
                className="app-btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
              >
                {staffLinkBusy
                  ? "กำลังสร้าง…"
                  : staffLinkConfigured
                    ? "สร้างลิงก์ใหม่"
                    : "สร้างลิงก์และ QR"}
              </button>
              {staffLinkUrl ? (
                <button
                  type="button"
                  onClick={() => void copyStaffLink()}
                  className="app-btn-soft rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4d47b6]"
                >
                  คัดลอกลิงก์
                </button>
              ) : null}
            </div>

            {linkLoadDone && staffLinkConfigured && !staffLinkUrl ? (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                มีลิงก์ในระบบแต่ยังดึง QR ไม่ได้ (ข้อมูลเก่าก่อนอัปเดต) — กด «สร้างลิงก์ใหม่» ครั้งหนึ่งเพื่อให้แสดงค้างได้
              </p>
            ) : null}

            {staffLinkUrl && staffLinkQr ? (
                <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                    {staffLinkPosterUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={staffLinkPosterUrl}
                        alt="QR พนักงานเสิร์ฟ"
                        className={cn(shopQrTemplateGeneratedPosterThumbClass, "shrink-0")}
                      />
                    ) : (
                      <div className="mx-auto flex min-h-[200px] w-full max-w-[280px] shrink-0 items-center justify-center rounded-2xl border border-dashed border-[#d8d6ec] bg-[#faf9ff] px-3">
                        <span className="text-center text-xs text-[#9b98c4]">กำลังสร้างใบป้าย…</span>
                      </div>
                    )}
                    <div className="grid w-full max-w-md flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={staffDlBusy || !staffLinkQr}
                        onClick={() => void downloadStaffPdf("a4")}
                        className="app-btn-primary rounded-xl px-4 py-3 text-sm font-semibold sm:py-2"
                      >
                        ดาวน์โหลด PDF (A4)
                      </button>
                      <button
                        type="button"
                        disabled={staffDlBusy || !staffLinkQr}
                        onClick={() => void downloadStaffPdf("a5")}
                        className="app-btn-soft rounded-xl px-4 py-3 text-sm font-semibold text-[#4d47b6] sm:py-2"
                      >
                        ดาวน์โหลด PDF (A5)
                      </button>
                      <button
                        type="button"
                        disabled={staffDlBusy || !staffLinkQr}
                        onClick={() => void downloadStaffPng()}
                        className="app-btn-soft rounded-xl px-4 py-3 text-sm font-semibold text-[#4d47b6] sm:py-2"
                      >
                        ดาวน์โหลด PNG
                      </button>
                      <button
                        type="button"
                        disabled={!staffLinkPosterUrl}
                        onClick={() => printStaffPoster("A4")}
                        className="app-btn-soft rounded-xl px-4 py-3 text-sm font-semibold text-[#4d47b6] sm:py-2"
                      >
                        พิมพ์ A4
                      </button>
                      <button
                        type="button"
                        disabled={!staffLinkPosterUrl}
                        onClick={() => printStaffPoster("A5")}
                        className="app-btn-soft rounded-xl px-4 py-3 text-sm font-semibold text-[#4d47b6] sm:col-span-2 sm:py-2"
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
        </div>
      </section>
    </div>
  );
}
