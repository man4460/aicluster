"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

type Props = {
  ownerId: string;
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
};

function absoluteAssetUrl(relativeOrAbsolute: string, baseUrl: string): string {
  const u = relativeOrAbsolute.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const base = baseUrl.replace(/\/$/, "");
  if (u.startsWith("/")) return `${base}${u}`;
  return u;
}

export function BarberQrPosterClient({ ownerId, shopLabel, logoUrl, baseUrl }: Props) {
  const portalUrl =
    baseUrl.startsWith("http://") || baseUrl.startsWith("https://")
      ? `${baseUrl.replace(/\/$/, "")}/m/${ownerId}`
      : "";
  const logoSrc = useMemo(() => {
    if (!logoUrl?.trim()) return null;
    const u = logoUrl.trim();
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
      return absoluteAssetUrl(u, baseUrl);
    }
    return u.startsWith("/") ? u : `/${u}`;
  }, [logoUrl, baseUrl]);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);
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

  async function capturePosterCanvas() {
    const el = posterRef.current;
    if (!el) throw new Error("no poster");
    return html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
    });
  }

  async function downloadPng() {
    if (!portalUrl) return;
    setBusy(true);
    try {
      const canvas = await capturePosterCanvas();
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `qr-store-${ownerId.slice(0, 8)}.png`;
      a.click();
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdf(format: "a4" | "a5") {
    if (!portalUrl) return;
    setBusy(true);
    try {
      const canvas = await capturePosterCanvas();
      const imgData = canvas.toDataURL("image/png");
      const orientation = "portrait";
      const pdf = new jsPDF({ orientation, unit: "mm", format });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const pxW = canvas.width;
      const pxH = canvas.height;
      let mmW = pageW;
      let mmH = (pxH * mmW) / pxW;
      if (mmH > pageH) {
        mmH = pageH;
        mmW = (pxW * mmH) / pxH;
      }
      const x = (pageW - mmW) / 2;
      const y = (pageH - mmH) / 2;
      pdf.addImage(imgData, "PNG", x, y, mmW, mmH);
      pdf.save(`qr-poster-${format}-${ownerId.slice(0, 8)}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  const headline = shopLabel.trim() || "ร้านตัดผม";

  return (
    <div className="space-y-6">
      {!portalUrl ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ไม่พบโดเมน (Host) — เปิดหน้านี้ผ่าน URL จริงของเว็บ หรือตั้งค่า{" "}
          <code className="rounded bg-white px-1">NEXT_PUBLIC_APP_URL</code> แล้วรีสตาร์ทเซิร์ฟเวอร์
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
          disabled={busy || !portalUrl}
          onClick={() => downloadPdf("a4")}
          className="rounded-xl bg-[#0000BF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0000a6] disabled:opacity-50"
        >
          ดาวน์โหลด PDF (A4)
        </button>
        <button
          type="button"
          disabled={busy || !portalUrl}
          onClick={() => downloadPdf("a5")}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          ดาวน์โหลด PDF (A5)
        </button>
        <button
          type="button"
          disabled={busy || !portalUrl}
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
        <div
          ref={posterRef}
          className="mx-auto w-[340px] rounded-[28px] border-[3px] border-[#0000BF]/35 bg-white shadow-md"
          style={{ fontFamily: "inherit" }}
        >
          <div className="flex flex-col items-center px-7 pb-10 pt-9">
            {logoSrc ? (
              <div className="flex h-[88px] w-full max-w-[280px] items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoSrc} alt="" className="max-h-[88px] max-w-full object-contain" />
              </div>
            ) : (
              <h1 className="text-center text-[22px] font-black leading-tight tracking-tight text-slate-900">
                {headline}
              </h1>
            )}

            <p className="mt-8 text-center text-[15px] font-bold leading-snug text-slate-800">
              สแกน กรอกเบอร์ ยืนยันใช้บริการ — หักสิทธิ์อัตโนมัติ
            </p>

            <div className="mt-9 rounded-2xl border-2 border-slate-200 bg-white p-3">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR" width={232} height={232} className="h-[232px] w-[232px]" />
              ) : (
                <div className="flex h-[232px] w-[232px] items-center justify-center bg-slate-50 text-xs text-slate-400">
                  กำลังสร้าง QR…
                </div>
              )}
            </div>

            {logoSrc && shopLabel.trim() ? (
              <p className="mt-8 text-center text-[13px] font-medium text-slate-500">{shopLabel.trim()}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
