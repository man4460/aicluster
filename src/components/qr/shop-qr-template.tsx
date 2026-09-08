"use client";

import { jsPDF } from "jspdf";
import { cn } from "@/lib/cn";
import { appSafeAreaPageContentTopPadClass } from "@/components/app-templates/safe-area-tokens";
import { shopQrTemplatePageBgClass } from "@/lib/shop-qr-template-theme";

export { shopQrTemplatePageBgClass };
export const shopQrTemplateCardClass =
  "rounded-2xl border-[3px] border-indigo-300/60 bg-[#f4f5f7] shadow-xl shadow-slate-300/40";

/** ความกว้างเนื้อหาหลัก — ใช้ร่วมกันหน้าสั่งอาหารและหน้าลิงก์พนักงาน */
export const shopQrTemplateMaxWidthClass = "mx-auto max-w-lg sm:max-w-xl";
/** padding หน้าสั่งอาหาร (มีแถบล่าง fixed) — รวม safe-area บน/ล่าง */
export const shopQrTemplateOrderPagePaddingClass = cn(
  "px-4 sm:px-5",
  appSafeAreaPageContentTopPadClass,
  "pb-[max(8rem,calc(7rem+var(--mawell-safe-bottom,env(safe-area-inset-bottom,0px))))] sm:pb-[max(9rem,calc(8rem+var(--mawell-safe-bottom,env(safe-area-inset-bottom,0px))))]",
);
/** padding หน้า QR ในแดชบอร์ด (ไม่มีแถบล่าง fixed) */
export const shopQrTemplateDashboardQrPaddingClass = cn(
  "px-4 pb-10 sm:px-5 sm:pb-12",
  "pt-[max(1rem,var(--mawell-safe-top,env(safe-area-inset-top,0px)))] sm:pt-6",
);

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
      document.fonts.load(`800 42px ${QR_FONT_FAMILY}`),
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

/** ตัดบรรทัดตามความกว้าง (รองรับไทยไม่มีช่องว่าง) — ต้องตั้ง ctx.font ก่อนเรียก */
function wrapTextToLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const t = text.trim();
  if (!t) return [];
  const lines: string[] = [];
  let line = "";
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]!;
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
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

/** มุม L รอบ QR — โทนม่วงแบรนด์ */
function drawQrCornerBrackets(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  arm = 36,
  thick = 5,
  color = "#4d47b6",
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = thick;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const drawCorner = (cx: number, cy: number, dx: number, dy: number) => {
    ctx.beginPath();
    ctx.moveTo(cx + dx * arm, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * arm);
    ctx.stroke();
  };
  drawCorner(x, y, 1, 1);
  drawCorner(x + size, y, -1, 1);
  drawCorner(x, y + size, 1, -1);
  drawCorner(x + size, y + size, -1, -1);
}

function drawPillField(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  maxTextW: number,
) {
  roundedRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  roundedRectPath(ctx, x, y, w, h, h / 2);
  ctx.strokeStyle = "rgba(91, 97, 255, 0.35)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#4d47b6";
  ctx.font = `700 22px ${QR_FONT_FAMILY}`;
  const lines = wrapTextToLines(ctx, text, maxTextW);
  const lineH = 26;
  const startY = y + h / 2 - ((lines.length - 1) * lineH) / 2;
  lines.slice(0, 2).forEach((ln, i) => {
    ctx.fillText(ln, x + w / 2, startY + i * lineH);
  });
}

/**
 * โปสเตอร์ QR แนวตัวอย่าง: พื้นนุ่ม · หัวเรื่องกลาง · การ์ด QR มุมมน + มุม L · แคปซูลชื่อ/คำอธิบาย
 * โทนม่วง–ชมพูแบรนด์ MAWELL (ไม่ใช้โทน teal ของตัวอย่าง)
 */
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

  // พื้นหลังท้องฟ้าโทนม่วงอ่อน
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#eef0ff");
  sky.addColorStop(0.42, "#f7f4ff");
  sky.addColorStop(0.72, "#f3eef8");
  sky.addColorStop(1, "#ebe4f7");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // เมฆ / แสงนุ่ม
  ctx.save();
  const cloud = (cx: number, cy: number, r: number, a: number) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };
  cloud(140, 120, 90, 0.55);
  cloud(220, 150, 70, 0.4);
  cloud(560, 100, 100, 0.5);
  cloud(640, 140, 80, 0.35);
  cloud(380, 80, 60, 0.3);
  ctx.restore();

  // เนินล่างโทนม่วง (แทนภาพธรรมชาติในตัวอย่าง)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, height * 0.72);
  ctx.bezierCurveTo(width * 0.2, height * 0.62, width * 0.45, height * 0.78, width * 0.7, height * 0.68);
  ctx.bezierCurveTo(width * 0.88, height * 0.62, width, height * 0.7, width, height * 0.7);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  const hill1 = ctx.createLinearGradient(0, height * 0.62, 0, height);
  hill1.addColorStop(0, "rgba(91, 97, 255, 0.22)");
  hill1.addColorStop(1, "rgba(139, 92, 246, 0.28)");
  ctx.fillStyle = hill1;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, height * 0.82);
  ctx.bezierCurveTo(width * 0.25, height * 0.74, width * 0.55, height * 0.9, width, height * 0.78);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  const hill2 = ctx.createLinearGradient(0, height * 0.74, 0, height);
  hill2.addColorStop(0, "rgba(236, 72, 153, 0.12)");
  hill2.addColorStop(1, "rgba(77, 71, 182, 0.2)");
  ctx.fillStyle = hill2;
  ctx.fill();
  ctx.restore();

  const marginX = 48;
  const topY = 36;
  const nameLabel = shopLabel.trim() || "ร้าน";
  const headline = (tagline.trim() || "สแกนเพื่อเข้าเว็บ").split("—")[0]?.trim() || "สแกนเพื่อเข้าเว็บ";
  const englishLine = subtitle?.trim() || footerText?.trim() || "SCAN TO OPEN";

  // โลโก้วงกลมซ้ายบน
  const logo = logoUrl ? await loadImage(logoUrl).catch(() => null) : null;
  const logoBox = 72;
  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(marginX + logoBox / 2, topY + logoBox / 2, logoBox / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "rgba(91, 97, 255, 0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.clip();
    const ratio = Math.min((logoBox - 12) / logo.width, (logoBox - 12) / logo.height, 1);
    const lw = Math.round(logo.width * ratio);
    const lh = Math.round(logo.height * ratio);
    ctx.drawImage(logo, marginX + (logoBox - lw) / 2, topY + (logoBox - lh) / 2, lw, lh);
    ctx.restore();
  } else {
    ctx.beginPath();
    ctx.arc(marginX + logoBox / 2, topY + logoBox / 2, logoBox / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "rgba(91, 97, 255, 0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#5b61ff";
    ctx.font = `800 28px ${QR_FONT_FAMILY}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("M", marginX + logoBox / 2, topY + logoBox / 2 + 1);
  }

  // หัวเรื่องกลาง
  const titleY = topY + 88;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#1e1b4b";
  ctx.font = `800 42px ${QR_FONT_FAMILY}`;
  const titleMaxW = width - marginX * 2;
  let ty = titleY;
  for (const ln of wrapTextToLines(ctx, headline, titleMaxW).slice(0, 2)) {
    ctx.fillText(ln, width / 2, ty);
    ty += 50;
  }
  ctx.fillStyle = "#4d47b6";
  ctx.font = `700 16px ${QR_FONT_FAMILY}`;
  ctx.fillText(englishLine.toUpperCase().slice(0, 28), width / 2, ty + 6);

  // การ์ด QR
  const qrImg = await loadImage(qrDataUrl);
  const qrSize = 380;
  const qrPad = 36;
  const qrCardW = qrSize + qrPad * 2;
  const qrCardH = qrSize + qrPad * 2;
  const qrCardX = (width - qrCardW) / 2;
  const qrCardY = ty + 48;
  const qrCardR = 36;

  ctx.save();
  ctx.shadowColor = "rgba(30, 27, 75, 0.14)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 12;
  roundedRectPath(ctx, qrCardX, qrCardY, qrCardW, qrCardH, qrCardR);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  roundedRectPath(ctx, qrCardX, qrCardY, qrCardW, qrCardH, qrCardR);
  ctx.strokeStyle = "rgba(91, 97, 255, 0.28)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const qrX = qrCardX + qrPad;
  const qrY = qrCardY + qrPad;
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  drawQrCornerBrackets(ctx, qrX - 4, qrY - 4, qrSize + 8, 40, 5, "#4d47b6");

  // แคปซูลชื่อ + คำอธิบาย
  const pillW = Math.min(560, width - marginX * 2);
  const pillX = (width - pillW) / 2;
  let pillY = qrCardY + qrCardH + 36;
  const pillH = 56;
  drawPillField(ctx, pillX, pillY, pillW, pillH, nameLabel, pillW - 48);
  pillY += pillH + 16;

  const secondaryRaw = tagline.includes("—") ? tagline.split("—")[1]?.trim() ?? "" : "";
  const pill2Text =
    subtitle?.trim() ||
    footerText?.trim() ||
    secondaryRaw ||
    (tagline.trim() && tagline.trim() !== headline ? tagline.trim() : "เปิดเว็บหลังสแกน QR");
  drawPillField(ctx, pillX, pillY, pillW, pillH, pill2Text, pillW - 48);

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
  const headline = (tagline.trim() || "สแกนเพื่อเข้าเว็บ").split("—")[0]?.trim() || "สแกนเพื่อเข้าเว็บ";
  const english = subtitle?.trim() || footerText?.trim() || "SCAN TO OPEN";
  const pill2 =
    (tagline.includes("—") ? tagline.split("—")[1]?.trim() : "") ||
    tagline.trim() ||
    "สแกน QR เพื่อเปิดเว็บ";

  return (
    <div
      className="mx-auto w-[340px] overflow-hidden rounded-[28px] bg-gradient-to-b from-[#eef0ff] via-[#f7f4ff] to-[#ebe4f7] p-5 shadow-xl shadow-indigo-900/10"
      style={{ fontFamily: '"Noto Sans Thai", "Noto Sans", sans-serif' }}
    >
      <div className="flex justify-center">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="h-12 w-12 rounded-full border-2 border-[#5b61ff]/35 bg-white object-contain p-1"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#5b61ff]/35 bg-white text-lg font-black text-[#5b61ff]">
            M
          </div>
        )}
      </div>
      <h1 className="mt-4 text-center text-xl font-black tracking-tight text-[#1e1b4b]">{headline}</h1>
      <p className="mt-1 text-center text-[10px] font-bold tracking-[0.18em] text-[#4d47b6]">
        {english.toUpperCase().slice(0, 28)}
      </p>
      <div className="relative mx-auto mt-5 w-[228px] rounded-[26px] border border-[#5b61ff]/30 bg-white p-4 shadow-md shadow-indigo-900/10">
        <span className="pointer-events-none absolute left-2 top-2 h-5 w-5 border-l-[3px] border-t-[3px] border-[#4d47b6]" aria-hidden />
        <span className="pointer-events-none absolute right-2 top-2 h-5 w-5 border-r-[3px] border-t-[3px] border-[#4d47b6]" aria-hidden />
        <span className="pointer-events-none absolute bottom-2 left-2 h-5 w-5 border-b-[3px] border-l-[3px] border-[#4d47b6]" aria-hidden />
        <span className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 border-b-[3px] border-r-[3px] border-[#4d47b6]" aria-hidden />
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="QR" width={196} height={196} className="h-[196px] w-[196px]" />
        ) : (
          <div className="flex h-[196px] w-[196px] items-center justify-center text-xs text-slate-400">กำลังสร้าง QR...</div>
        )}
      </div>
      <div className="mt-5 space-y-2">
        <p className="rounded-full border border-[#5b61ff]/35 bg-white px-4 py-2.5 text-center text-sm font-bold text-[#4d47b6]">
          {shopLabel.trim() || "ร้าน"}
        </p>
        <p className="rounded-full border border-[#5b61ff]/35 bg-white px-4 py-2.5 text-center text-sm font-bold text-[#4d47b6]">
          {pill2 === headline ? english : pill2}
        </p>
      </div>
    </div>
  );
}

