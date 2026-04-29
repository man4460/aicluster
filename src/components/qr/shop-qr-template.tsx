"use client";

import { jsPDF } from "jspdf";
import { shopQrTemplatePageBgClass } from "@/lib/shop-qr-template-theme";

export { shopQrTemplatePageBgClass };
export const shopQrTemplateCardClass =
  "rounded-2xl border-[3px] border-indigo-300/60 bg-[#f4f5f7] shadow-xl shadow-slate-300/40";

/** ความกว้างเนื้อหาหลัก — ใช้ร่วมกันหน้าสั่งอาหารและหน้าลิงก์พนักงาน */
export const shopQrTemplateMaxWidthClass = "mx-auto max-w-lg sm:max-w-xl";
/** padding หน้าสั่งอาหาร (มีแถบล่าง fixed) */
export const shopQrTemplateOrderPagePaddingClass =
  "px-4 pb-32 pt-6 sm:px-5 sm:pb-36 sm:pt-8";
/** padding หน้า QR ในแดชบอร์ด (ไม่มีแถบล่าง fixed) */
export const shopQrTemplateDashboardQrPaddingClass =
  "px-4 pb-10 pt-4 sm:px-5 sm:pb-12 sm:pt-6";

export const shopQrTemplateHeadKickerClass =
  "text-center text-[11px] font-medium uppercase tracking-[0.2em] text-indigo-600";
export const shopQrTemplateHeadTitleClass =
  "mt-2 text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl";
export const shopQrTemplateHeadSubtitleClass = "mt-2 text-center text-sm text-slate-600";

/** ปุ่มหลักแบบหน้าลูกค้า (ส่งออเดอร์ / สร้างลิงก์) */
export const shopQrTemplateCtaButtonClass =
  "min-h-[48px] shrink-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-900/25 transition enabled:hover:from-indigo-500 enabled:hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-40";

/** ปุ่มรอง (คัดลอก / ขอบขาว) */
export const shopQrTemplateSecondaryButtonClass =
  "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 touch-manipulation";

/** ปุ่มแถวกริดรอง (PDF / PNG) — โทน indigo อ่อน */
export const shopQrTemplateGridSoftButtonClass =
  "rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-indigo-700 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/60 disabled:cursor-not-allowed disabled:opacity-40 sm:py-2.5";

/** ปุ่มแถวกริดหลัก (เช่น PDF A4) */
export const shopQrTemplateGridPrimaryButtonClass =
  "rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-40 sm:py-2.5";

/** กล่องแสดง URL */
export const shopQrTemplateUrlBoxClass =
  "mt-3 break-all rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] leading-relaxed text-indigo-800 sm:text-xs";

/** พรีวิวโปสเตอร์/QR — กรอบมนเดียว (ขอบ indigo พื้นขาว) ไม่ซ้อนชั้น */
export const shopQrTemplatePosterPreviewShellClass =
  "mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl border-[3px] border-indigo-300/60 bg-white p-2 shadow-md shadow-slate-300/25";

/** รูปภายในกรอบ — ไม่ใส่กรอบ/มุมมนซ้ำ */
export const shopQrTemplatePosterPreviewImgClass = "block h-auto w-full object-contain";

/** โปสเตอร์จากแคนวาส (PNG เต็มใบ) — ไม่ห่อกรอบ HTML เพิ่ม เพราะขอบอยู่ในภาพแล้ว */
export const shopQrTemplateGeneratedPosterThumbClass =
  "mx-auto mt-4 block h-auto w-full max-w-[280px] shadow-md shadow-slate-300/25";

type PosterCanvasInput = {
  qrDataUrl: string;
  shopLabel: string;
  logoUrl?: string | null;
  tagline: string;
  subtitle?: string | null;
  footerText?: string | null;
};

const QR_FONT_FAMILY = `"Noto Sans Thai", "Noto Sans", sans-serif`;

async function ensureQrFontReady(): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await Promise.all([
      document.fonts.load(`500 20px ${QR_FONT_FAMILY}`),
      document.fonts.load(`600 24px ${QR_FONT_FAMILY}`),
      document.fonts.load(`700 34px ${QR_FONT_FAMILY}`),
      document.fonts.ready,
    ]);
  } catch {
    // ignore and let browser fallback
  }
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    try {
      // Same-origin assets may require auth cookies; keep default mode.
      // Use anonymous CORS only for cross-origin URLs.
      if (typeof window !== "undefined") {
        const u = new URL(src, window.location.origin);
        if (u.origin !== window.location.origin) {
          img.crossOrigin = "anonymous";
        }
      }
    } catch {
      // ignore URL parse issues and keep default image mode
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

export function resolveAssetUrl(relativeOrAbsolute: string | null | undefined, baseUrl: string): string | null {
  if (!relativeOrAbsolute?.trim()) return null;
  const raw = relativeOrAbsolute.trim().replace(/\\/g, "/");
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

  // Normalize common persisted forms: "uploads/...", "public/uploads/...", "./uploads/..."
  let p = raw.replace(/^\.?\//, "");
  if (p.startsWith("public/")) p = p.slice("public/".length);
  if (p.startsWith("uploads/")) return `/${p}`;

  // Keep app-local absolute paths as-is.
  if (raw.startsWith("/")) return raw;

  // Fallback to baseUrl only for non-upload relative paths.
  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) return `/${p}`;
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/${p}`;
}

export async function createShopQrPosterCanvas(input: PosterCanvasInput): Promise<HTMLCanvasElement> {
  const { qrDataUrl, shopLabel, logoUrl, tagline, subtitle, footerText } = input;
  await ensureQrFontReady();
  const canvas = document.createElement("canvas");
  const width = 760;
  const height = 1080;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas ctx");

  // page background
  ctx.fillStyle = "#eef0f3";
  ctx.fillRect(0, 0, width, height);

  const cardX = 20;
  const cardY = 12;
  const cardW = width - 40;
  const cardH = height - 52;
  const cardR = 52;

  // การ์ดใบเดียว: เงา + พื้น + ขอบ indigo ชั้นเดียว (ไม่ซ้อนการ์ดขาว/เทาสองใบ)
  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.14)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  roundedRectPath(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  roundedRectPath(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(99, 102, 241, 0.5)";
  ctx.stroke();

  const logo = logoUrl ? await loadImage(logoUrl).catch(() => null) : null;
  if (logo) {
    const maxW = 200;
    const maxH = 200;
    const ratio = Math.min(maxW / logo.width, maxH / logo.height, 1);
    const w = Math.round(logo.width * ratio);
    const h = Math.round(logo.height * ratio);
    ctx.drawImage(logo, Math.round((width - w) / 2), 70, w, h);
  } else {
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.font = `700 38px ${QR_FONT_FAMILY}`;
    ctx.fillText(shopLabel, width / 2, 138);
  }

  ctx.fillStyle = "#1e293b";
  ctx.textAlign = "center";
  ctx.font = `700 34px ${QR_FONT_FAMILY}`;
  const mainLine1 = tagline.includes("—") ? tagline.split("—")[0]?.trim() ?? tagline : tagline;
  const mainLine2 = tagline.includes("—") ? tagline.split("—")[1]?.trim() ?? "" : "";
  ctx.fillText(mainLine1, width / 2, 320);
  if (mainLine2) ctx.fillText(mainLine2, width / 2, 364);
  if (subtitle?.trim()) {
    ctx.font = `600 20px ${QR_FONT_FAMILY}`;
    ctx.fillStyle = "#334155";
    ctx.fillText(subtitle.trim(), width / 2, mainLine2 ? 404 : 356);
  }

  const qrImg = await loadImage(qrDataUrl);
  const qrSize = 470;
  const qrX = (width - qrSize) / 2;
  const qrY = 450;
  // ไม่วาดกรอบซ้อนรอบ QR — โค้ดใน PNG มีขอบขาวอยู่แล้ว
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  if (logo && shopLabel.trim()) {
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "center";
    ctx.font = `700 30px ${QR_FONT_FAMILY}`;
    ctx.fillText(shopLabel.trim(), width / 2, 1010);
  }
  if (footerText?.trim()) {
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "center";
    ctx.font = `500 20px ${QR_FONT_FAMILY}`;
    ctx.fillText(footerText.trim(), width / 2, 1042);
  }

  return canvas;
}

export async function createShopQrPosterDataUrl(input: PosterCanvasInput): Promise<string> {
  const canvas = await createShopQrPosterCanvas(input);
  return canvas.toDataURL("image/png");
}

export async function downloadPosterPng(canvas: HTMLCanvasElement, filename: string) {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  a.click();
}

export async function downloadPosterPdf(canvas: HTMLCanvasElement, filename: string, format: "a4" | "a5" = "a4") {
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format });
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
  pdf.save(filename);
}

export function ShopQrPosterPreview({
  qrDataUrl,
  shopLabel,
  logoUrl,
  tagline,
  subtitle,
  footerText,
}: {
  qrDataUrl: string | null;
  shopLabel: string;
  logoUrl?: string | null;
  tagline: string;
  subtitle?: string | null;
  footerText?: string | null;
}) {
  return (
    <div
      className="mx-auto w-[340px] rounded-[36px] border-[4px] border-indigo-300/70 bg-white p-5 shadow-xl shadow-slate-300/40"
      style={{ fontFamily: '"Noto Sans Thai", "Noto Sans", sans-serif' }}
    >
      <div className="flex flex-col items-center px-4 pb-5 pt-1">
        {logoUrl ? (
          <div className="flex h-[112px] w-full max-w-[280px] items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="" className="max-h-[112px] max-w-full object-contain" />
          </div>
        ) : (
          <h1 className="text-center text-[22px] font-black leading-tight tracking-tight text-slate-900">{shopLabel}</h1>
        )}
        <p className="mt-4 text-center text-[15px] font-bold leading-snug text-slate-800">{tagline}</p>
        {subtitle?.trim() ? <p className="mt-1 text-center text-[10px] font-medium text-slate-600">{subtitle.trim()}</p> : null}
        <div className="mt-5 flex justify-center">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR" width={232} height={232} className="h-[232px] w-[232px]" />
          ) : (
            <div className="flex h-[232px] w-[232px] items-center justify-center text-xs text-slate-400">กำลังสร้าง QR...</div>
          )}
        </div>
        {logoUrl && shopLabel.trim() ? <p className="mt-6 text-center text-[17px] font-semibold tracking-tight text-slate-500">{shopLabel.trim()}</p> : null}
        {footerText?.trim() ? <p className="mt-1 text-center text-[10px] font-medium text-slate-500">{footerText.trim()}</p> : null}
      </div>
    </div>
  );
}

