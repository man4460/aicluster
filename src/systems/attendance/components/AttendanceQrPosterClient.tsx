"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

type Props = {
  ownerId: string;
  /** โหมดทดลอง — ใส่พารามิเตอร์ `t` ในลิงก์เช็คสาธารณะ */
  sandboxTrialSessionId?: string | null;
  orgLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  /** มีค่าเมื่อต้องการ QR ต่อจุด — URL จะมี ?loc= */
  locationId?: number | null;
  locationName?: string | null;
};

function absoluteAssetUrl(relativeOrAbsolute: string, baseUrl: string): string {
  const u = relativeOrAbsolute.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const base = baseUrl.replace(/\/$/, "");
  if (u.startsWith("/")) return `${base}${u}`;
  return u;
}

export function AttendanceQrPosterClient({
  ownerId,
  sandboxTrialSessionId,
  orgLabel,
  logoUrl,
  baseUrl,
  locationId,
  locationName,
}: Props) {
  const [clientOrigin, setClientOrigin] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined" && window.location?.origin) {
      setClientOrigin(window.location.origin);
    }
  }, []);

  const effectiveBaseUrl = useMemo(() => {
    if (baseUrl.startsWith("http://") || baseUrl.startsWith("https://")) {
      return baseUrl.replace(/\/$/, "");
    }
    if (clientOrigin.startsWith("http://") || clientOrigin.startsWith("https://")) {
      return clientOrigin.replace(/\/$/, "");
    }
    return "";
  }, [baseUrl, clientOrigin]);

  const checkInUrl = useMemo(() => {
    if (!effectiveBaseUrl) return "";
    const root = `${effectiveBaseUrl}/check-in/${ownerId}`;
    const params = new URLSearchParams();
    if (locationId != null && locationId > 0) params.set("loc", String(locationId));
    const tid = sandboxTrialSessionId?.trim();
    if (tid) params.set("t", tid);
    const q = params.toString();
    return q ? `${root}?${q}` : root;
  }, [effectiveBaseUrl, ownerId, locationId, sandboxTrialSessionId]);

  const logoSrc = useMemo(() => {
    if (!logoUrl?.trim()) return null;
    const u = logoUrl.trim();
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    if (effectiveBaseUrl) {
      return absoluteAssetUrl(u, effectiveBaseUrl);
    }
    return u.startsWith("/") ? u : `/${u}`;
  }, [logoUrl, effectiveBaseUrl]);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [copyErr, setCopyErr] = useState(false);

  const copyLink = useCallback(async () => {
    if (!checkInUrl) return;
    setCopyErr(false);
    try {
      await navigator.clipboard.writeText(checkInUrl);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setCopyErr(true);
    }
  }, [checkInUrl]);

  useEffect(() => {
    if (!checkInUrl) return;
    QRCode.toDataURL(checkInUrl, {
      width: 232,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [checkInUrl]);

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
    if (!checkInUrl) return;
    setBusy(true);
    try {
      const canvas = await capturePosterCanvas();
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `qr-check-in-${ownerId.slice(0, 8)}.png`;
      a.click();
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdf(format: "a4" | "a5") {
    if (!checkInUrl) return;
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
      pdf.save(`qr-check-in-${format}-${ownerId.slice(0, 8)}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  const headline = orgLabel.trim() || "เช็คชื่อเข้างาน";
  const subLocation = locationName?.trim() || null;

  return (
    <div className="space-y-6">
      {!checkInUrl ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ยังสร้างลิงก์/QR ไม่ได้ — เปิดหน้านี้จากเบราว์เซอร์บนโดเมนจริง หรือตั้งค่า{" "}
          <code className="rounded bg-white px-1">NEXT_PUBLIC_APP_URL</code> /{" "}
          <code className="rounded bg-white px-1">APP_URL</code> / Vercel (VERCEL_URL)
        </p>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">ลิงก์เช็คชื่อ</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="block flex-1 break-all rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-800">
              {checkInUrl}
            </code>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="shrink-0 rounded-xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0000a6]"
            >
              {copyDone ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
            </button>
          </div>
          {copyErr ? (
            <p className="mt-2 text-xs text-red-600">คัดลอกไม่สำเร็จ — เลือกข้อความด้านบนแล้วคัดลอกเอง</p>
          ) : null}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !checkInUrl}
          onClick={() => downloadPdf("a4")}
          className="rounded-xl bg-[#0000BF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0000a6] disabled:opacity-50"
        >
          ดาวน์โหลด PDF (A4)
        </button>
        <button
          type="button"
          disabled={busy || !checkInUrl}
          onClick={() => downloadPdf("a5")}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          ดาวน์โหลด PDF (A5)
        </button>
        <button
          type="button"
          disabled={busy || !checkInUrl}
          onClick={downloadPng}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          ดาวน์โหลด PNG
        </button>
      </div>

      <p className="text-xs text-slate-500">
        นำไปปริ๊นต์วางจุดเช็ค — พนักงานสแกนแล้วเลือก &quot;พนักงาน&quot; ยืนยันด้วยเบอร์ในรายชื่อ
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
              <h1 className="text-center text-[20px] font-black leading-tight tracking-tight text-slate-900">
                {headline}
              </h1>
            )}

            <p className="mt-8 text-center text-[14px] font-bold leading-snug text-slate-800">
              สแกนเพื่อเช็คชื่อเข้า-ออกงาน
            </p>
            {subLocation ? (
              <p className="mt-2 text-center text-[12px] font-semibold text-[#0000BF]">{subLocation}</p>
            ) : null}
            <p className="mt-2 text-center text-[12px] leading-snug text-slate-600">
              เปิด GPS · เลือกประเภทผู้เช็ค · ยืนยันเบอร์โทร
            </p>

            <div className="mt-7 rounded-2xl border-2 border-slate-200 bg-white p-3">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR" width={232} height={232} className="h-[232px] w-[232px]" />
              ) : (
                <div className="flex h-[232px] w-[232px] items-center justify-center bg-slate-50 text-xs text-slate-400">
                  กำลังสร้าง QR…
                </div>
              )}
            </div>

            {logoSrc && orgLabel.trim() ? (
              <p className="mt-7 text-center text-[13px] font-medium text-slate-500">{orgLabel.trim()}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
