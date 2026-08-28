"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/cn";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";
import {
  attendanceLinkActionBtnClass,
  attendanceOutlineBtnClass,
  attendancePosterPreviewShellClass,
  attendancePrimaryBtnClass,
  attendanceQrPosterSplitClass,
  attendanceQrToolbarBtnClass,
  attendanceQrToolbarClass,
} from "@/systems/attendance/attendance-ui";

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
  /** true = ลิงก์ `/check-in/.../face` สำหรับ iPad สแกนใบหน้า */
  faceKiosk?: boolean;
};

export function AttendanceQrPosterClient({
  ownerId,
  sandboxTrialSessionId,
  orgLabel,
  logoUrl,
  baseUrl,
  locationId,
  locationName,
  faceKiosk = false,
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
    const facePath = faceKiosk ? "/face" : "";
    const root = `${effectiveBaseUrl}/check-in/${ownerId}${facePath}`;
    const params = new URLSearchParams();
    if (locationId != null && locationId > 0) params.set("loc", String(locationId));
    const tid = sandboxTrialSessionId?.trim();
    if (tid) params.set("t", tid);
    const q = params.toString();
    return q ? `${root}?${q}` : root;
  }, [effectiveBaseUrl, ownerId, locationId, sandboxTrialSessionId, faceKiosk]);

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
  const headline = faceKiosk
    ? `${orgLabel.trim() || "องค์กร"} · สแกนใบหน้า`
    : orgLabel.trim() || "เช็คอินเข้างาน";
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

  const actionBtnOutline = cn(attendanceOutlineBtnClass, attendanceQrToolbarBtnClass);
  const actionBtnPrimary = cn(attendancePrimaryBtnClass, attendanceQrToolbarBtnClass);
  const actionBtnSoft = cn(attendanceLinkActionBtnClass, attendanceQrToolbarBtnClass);

  const printHint = faceKiosk
    ? "นำไปปริ๊นท์วางจุดเช็ค — เปิด iPad สแกนใบหน้าตรงกับรายชื่อ"
    : "นำไปปริ๊นต์วางจุดเช็ค — พนักงานสแกนแล้วเลือก \"พนักงาน\" ยืนยันด้วยเบอร์ในรายชื่อ";

  return (
    <div className="space-y-4">
      {!checkInUrl ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ยังสร้างลิงก์/QR ไม่ได้ — เปิดหน้านี้จากเบราว์เซอร์บนโดเมนที่ใช้งานจริง หรือตั้งค่า URL แอปให้ตรงโดเมนนั้น
        </p>
      ) : null}

      {checkInUrl ? (
        <div className={attendanceQrPosterSplitClass}>
          <div className="flex min-w-0 flex-col gap-4">
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#2e2a58]">{headline}</p>
              {subLocation ? (
                <p className="mt-1 text-xs font-semibold text-[#8b87b8]">จุดเช็ค: {subLocation}</p>
              ) : null}
              <p className="mt-2 text-xs font-medium leading-relaxed text-[#66638c]">{printHint}</p>
              <p className="mt-3 break-all text-[10px] font-semibold leading-relaxed text-[#0000BF]">{checkInUrl}</p>
              {copyErr ? (
                <p className="mt-2 text-xs text-red-600">
                  คัดลอกไม่สำเร็จ — ลองอนุญาตคลิปบอร์ดหรือเปิดหน้าใน HTTPS
                </p>
              ) : null}
            </div>
            <div className={attendanceQrToolbarClass}>
              <button
                type="button"
                onClick={() => void copyLink()}
                className={actionBtnSoft}
                title={copyDone ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
                aria-label={copyDone ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <rect x="2" y="2" width="13" height="13" rx="2" />
                </svg>
                <span className="hidden sm:inline">{copyDone ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => downloadPdf("a4")}
                className={actionBtnPrimary}
                title="ดาวน์โหลด PDF (A4)"
                aria-label="ดาวน์โหลด PDF (A4)"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
                <span className="hidden sm:inline">ดาวน์โหลด PDF (A4)</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => downloadPdf("a5")}
                className={actionBtnOutline}
                title="ดาวน์โหลด PDF (A5)"
                aria-label="ดาวน์โหลด PDF (A5)"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </svg>
                <span className="hidden sm:inline">ดาวน์โหลด PDF (A5)</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={downloadPng}
                className={actionBtnOutline}
                title="ดาวน์โหลด PNG"
                aria-label="ดาวน์โหลด PNG"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <span className="hidden sm:inline">ดาวน์โหลด PNG</span>
              </button>
            </div>
          </div>

          <div className={cn(attendancePosterPreviewShellClass, "lg:sticky lg:top-4")}>
            {posterPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={posterPreviewUrl}
                alt="ตัวอย่างโปสเตอร์ QR เช็คอิน"
                className="mx-auto w-full max-w-[340px] rounded-3xl shadow-md lg:mx-0"
              />
            ) : (
              <div className="mx-auto flex aspect-[340/560] w-full max-w-[340px] items-center justify-center rounded-3xl border border-[#e1e3ff] bg-white text-xs text-[#66638c] lg:mx-0">
                กำลังเรนเดอร์ตัวอย่าง...
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
