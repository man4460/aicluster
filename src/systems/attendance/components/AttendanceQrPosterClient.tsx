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
import { attendanceOutlineBtnClass, attendancePosterPreviewShellClass } from "@/systems/attendance/attendance-ui";

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
    const raw = logoUrl.trim();
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    // Prefer current browser origin first so protected assets can be loaded with current session/cookies.
    if (clientOrigin.startsWith("http://") || clientOrigin.startsWith("https://")) {
      return resolveAssetUrl(raw, clientOrigin) ?? resolveAssetUrl(raw, effectiveBaseUrl);
    }
    return resolveAssetUrl(raw, effectiveBaseUrl);
  }, [logoUrl, clientOrigin, effectiveBaseUrl]);
  const headline = orgLabel.trim() || "เช็คอินเข้างาน";
  const subLocation = locationName?.trim() || null;

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
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
      tagline: "สแกนเพื่อเช็คชื่อเข้า-ออกงาน",
      subtitle: subLocation ? `จุดเช็ค: ${subLocation}` : "เปิด GPS · เลือกประเภทผู้เช็ค · ยืนยันเบอร์โทร",
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
  }, [qrDataUrl, headline, logoSrc, subLocation]);

  async function downloadPng() {
    if (!checkInUrl || !qrDataUrl) return;
    setBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl,
        shopLabel: headline,
        logoUrl: logoSrc,
        tagline: "สแกนเพื่อเช็คชื่อเข้า-ออกงาน",
        subtitle: subLocation ? `จุดเช็ค: ${subLocation}` : "เปิด GPS · เลือกประเภทผู้เช็ค · ยืนยันเบอร์โทร",
      });
      await downloadPosterPng(canvas, `qr-check-in-${ownerId.slice(0, 8)}.png`);
    } finally {
      setBusy(false);
    }
  }

  async function downloadPdf(format: "a4" | "a5") {
    if (!checkInUrl || !qrDataUrl) return;
    setBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl,
        shopLabel: headline,
        logoUrl: logoSrc,
        tagline: "สแกนเพื่อเช็คชื่อเข้า-ออกงาน",
        subtitle: subLocation ? `จุดเช็ค: ${subLocation}` : "เปิด GPS · เลือกประเภทผู้เช็ค · ยืนยันเบอร์โทร",
      });
      await downloadPosterPdf(canvas, `qr-check-in-${format}-${ownerId.slice(0, 8)}.pdf`, format);
    } finally {
      setBusy(false);
    }
  }

  const actionBtnOutline =
    "rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50";

  return (
    <div className="space-y-6">
      {!checkInUrl ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ยังสร้างลิงก์/QR ไม่ได้ — เปิดหน้านี้จากเบราว์เซอร์บนโดเมนที่ใช้งานจริง หรือตั้งค่า URL แอปให้ตรงโดเมนนั้น
        </p>
      ) : null}

      {checkInUrl ? (
        <>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void copyLink()} className={attendanceOutlineBtnClass}>
              {copyDone ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => downloadPdf("a4")}
              className="rounded-xl bg-[#0000BF] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
            >
              ดาวน์โหลด PDF (A4)
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => downloadPdf("a5")}
              className={attendanceOutlineBtnClass}
            >
              ดาวน์โหลด PDF (A5)
            </button>
            <button type="button" disabled={busy} onClick={downloadPng} className={attendanceOutlineBtnClass}>
              ดาวน์โหลด PNG
            </button>
          </div>
          {copyErr ? (
            <p className="text-xs text-red-600">คัดลอกไม่สำเร็จ — ลองอนุญาตคลิปบอร์ดหรือเปิดหน้าใน HTTPS</p>
          ) : null}
        </>
      ) : null}

      {checkInUrl ? (
        <>
          <p className="text-xs text-[#66638c]">
            นำไปปริ๊นต์วางจุดเช็ค — พนักงานสแกนแล้วเลือก &quot;พนักงาน&quot; ยืนยันด้วยเบอร์ในรายชื่อ
          </p>

          <div className={attendancePosterPreviewShellClass}>
            {posterPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={posterPreviewUrl} alt="ตัวอย่างโปสเตอร์ QR เช็คอิน" className="mx-auto w-[340px] rounded-3xl shadow-md" />
            ) : (
              <div className="mx-auto flex h-[560px] w-[340px] items-center justify-center rounded-3xl border border-[#e1e3ff] bg-white text-xs text-[#66638c]">
                กำลังเรนเดอร์ตัวอย่าง...
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
