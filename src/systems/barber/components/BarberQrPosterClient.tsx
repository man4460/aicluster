"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";

type Props = {
  ownerId: string;
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  /** โหมดทดลอง — ปิดดาวน์โหลด PDF/PNG */
  trialExportBlocked?: boolean;
};

export function BarberQrPosterClient({
  ownerId,
  shopLabel,
  logoUrl,
  baseUrl,
  trialExportBlocked = false,
}: Props) {
  const portalUrl =
    baseUrl.startsWith("http://") || baseUrl.startsWith("https://")
      ? `${baseUrl.replace(/\/$/, "")}/m/${ownerId}`
      : "";
  const headline = shopLabel.trim() || "ร้านตัดผม";
  const logoSrc = useMemo(() => resolveAssetUrl(logoUrl, baseUrl), [logoUrl, baseUrl]);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!portalUrl) return;
    QRCode.toDataURL(portalUrl, {
      width: 232,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [portalUrl]);

  useEffect(() => {
    if (!qrDataUrl) {
      setPosterPreviewUrl(null);
      return;
    }
    let cancelled = false;
    void createShopQrPosterDataUrl({
      qrDataUrl,
      shopLabel: headline,
      logoUrl: logoSrc,
      tagline: "สแกน กรอกเบอร์ ยืนยันใช้บริการ — หักสิทธิ์อัตโนมัติ",
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
  }, [qrDataUrl, headline, logoSrc]);

  async function downloadPng() {
    if (!portalUrl || trialExportBlocked || !qrDataUrl) return;
    setBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl,
        shopLabel: headline,
        logoUrl: logoSrc,
        tagline: "สแกน กรอกเบอร์ ยืนยันใช้บริการ — หักสิทธิ์อัตโนมัติ",
      });
      await downloadPosterPng(canvas, `qr-store-${ownerId.slice(0, 8)}.png`);
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdf(format: "a4" | "a5") {
    if (!portalUrl || trialExportBlocked || !qrDataUrl) return;
    setBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl,
        shopLabel: headline,
        logoUrl: logoSrc,
        tagline: "สแกน กรอกเบอร์ ยืนยันใช้บริการ — หักสิทธิ์อัตโนมัติ",
      });
      await downloadPosterPdf(canvas, `qr-poster-${format}-${ownerId.slice(0, 8)}.pdf`, format);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {!portalUrl ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ไม่พบโดเมน (Host) — เปิดหน้านี้ผ่าน URL จริงของเว็บ หรือตั้งค่า{" "}
          <code className="rounded bg-white px-1">NEXT_PUBLIC_APP_URL</code> แล้วรีสตาร์ทเซิร์ฟเวอร์
        </p>
      ) : trialExportBlocked ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          โหมดทดลอง — ไม่รองรับการดาวน์โหลด PDF/PNG โปสเตอร์ QR หน้าร้าน (Subscribe ระบบเพื่อใช้งานเต็มรูปแบบ)
        </p>
      ) : (
        <p className="text-sm text-slate-600">
          ลิงก์ลูกค้า:{" "}
          <span className="break-all font-mono text-xs text-[#0000BF]">{portalUrl}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !portalUrl || trialExportBlocked}
          onClick={() => downloadPdf("a4")}
          className="rounded-xl bg-[#0000BF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0000a6] disabled:opacity-50"
        >
          ดาวน์โหลด PDF (A4)
        </button>
        <button
          type="button"
          disabled={busy || !portalUrl || trialExportBlocked}
          onClick={() => downloadPdf("a5")}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          ดาวน์โหลด PDF (A5)
        </button>
        <button
          type="button"
          disabled={busy || !portalUrl || trialExportBlocked}
          onClick={downloadPng}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          ดาวน์โหลด PNG
        </button>
      </div>

      <p className="text-xs text-slate-500">
        ตัวอย่างด้านล่าง — โลโก้จากตั้งค่าร้าน (ถ้ามี) หรือชื่อร้าน — พื้นขาว กรอบน้ำเงินอ่อน
      </p>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-6">
        {posterPreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={posterPreviewUrl} alt="ตัวอย่างโปสเตอร์ QR ร้านตัดผม" className="mx-auto w-[340px] rounded-3xl shadow-md" />
        ) : (
          <div className="mx-auto flex h-[560px] w-[340px] items-center justify-center rounded-3xl border border-slate-300 bg-white text-xs text-slate-500">
            กำลังเรนเดอร์ตัวอย่าง...
          </div>
        )}
      </div>
    </div>
  );
}
