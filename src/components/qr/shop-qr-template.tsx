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

  // พื้นหลังหน้า: ไล่สีนุ่ม + แสงจุด (ไม่แตะโซน QR — contrast โค้ดยังชัดบนพื้นขาวในแผง)
  const pageGrad = ctx.createLinearGradient(0, 0, width, height);
  pageGrad.addColorStop(0, "#e8ecf8");
  pageGrad.addColorStop(0.48, "#f3eef6");
  pageGrad.addColorStop(1, "#e9f5f2");
  ctx.fillStyle = pageGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  const orbTop = ctx.createRadialGradient(width * 0.88, height * 0.1, 0, width * 0.88, height * 0.1, 340);
  orbTop.addColorStop(0, "rgba(129, 140, 248, 0.24)");
  orbTop.addColorStop(1, "rgba(129, 140, 248, 0)");
  ctx.fillStyle = orbTop;
  ctx.fillRect(0, 0, width, height);
  const orbBot = ctx.createRadialGradient(width * 0.06, height * 0.92, 0, width * 0.06, height * 0.92, 280);
  orbBot.addColorStop(0, "rgba(45, 212, 191, 0.16)");
  orbBot.addColorStop(1, "rgba(45, 212, 191, 0)");
  ctx.fillStyle = orbBot;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const cardX = 22;
  const cardY = 18;
  const cardW = width - cardX * 2;
  const cardH = height - cardY - 48;
  const cardR = 48;

  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.16)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 10;
  roundedRectPath(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.fillStyle = "#fbfcff";
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundedRectPath(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.clip();
  const innerWash = ctx.createLinearGradient(0, cardY, 0, cardY + 440);
  innerWash.addColorStop(0, "rgba(238, 242, 255, 0.72)");
  innerWash.addColorStop(0.52, "rgba(255, 255, 255, 0)");
  innerWash.addColorStop(1, "rgba(236, 253, 245, 0.38)");
  ctx.fillStyle = innerWash;
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.restore();

  roundedRectPath(ctx, cardX, cardY, cardW, cardH, cardR);
  const edgeGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  edgeGrad.addColorStop(0, "#6366f1");
  edgeGrad.addColorStop(0.48, "#a855f7");
  edgeGrad.addColorStop(1, "#14b8a6");
  ctx.strokeStyle = edgeGrad;
  ctx.lineWidth = 5;
  ctx.stroke();

  /** ช่องไฟแบบ 8px — เนื้อหาเยื้องจากขอบการ์ดเท่ากันทุกบล็อก */
  const contentInset = 36;
  const padX = cardX + contentInset;
  const headerTop = cardY + 42;
  const logoMaxW = 100;
  const logoMaxH = 100;
  const logoToNameGap = 20;
  const headerDividerGap = 24;
  const dividerQrGap = 40;
  const qrFramePad = 28;
  const qrPanelR = 30;
  const qrToInstructGap = 30;
  const tagLineLead = 40;
  const tagBlocksGap = 8;
  const subtitleTopGap = 14;
  const subLineLead = 28;
  const footerReserve = 30;

  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const logo = logoUrl ? await loadImage(logoUrl).catch(() => null) : null;
  let logoW = 0;
  let logoH = 0;
  let textStartX = padX;

  if (logo) {
    const ratio = Math.min(logoMaxW / logo.width, logoMaxH / logo.height, 1);
    logoW = Math.round(logo.width * ratio);
    logoH = Math.round(logo.height * ratio);
    ctx.drawImage(logo, padX, headerTop, logoW, logoH);
    textStartX = padX + logoW + logoToNameGap;
  }

  const nameMaxW = width - textStartX - padX;
  ctx.font = `700 31px ${QR_FONT_FAMILY}`;
  const nameLabel = shopLabel.trim() || "ร้าน";
  const nameLines = wrapTextToLines(ctx, nameLabel, Math.max(120, nameMaxW));
  const nameLineH = 38;
  const nameTotalH = nameLines.length * nameLineH;
  let nameY = headerTop;
  if (logo) {
    nameY = headerTop + Math.max(0, (logoH - nameTotalH) / 2);
  }

  const nameGrad = ctx.createLinearGradient(textStartX, nameY, textStartX + nameMaxW, nameY + nameLineH);
  nameGrad.addColorStop(0, "#4338ca");
  nameGrad.addColorStop(0.52, "#7c3aed");
  nameGrad.addColorStop(1, "#0f766e");
  ctx.fillStyle = nameGrad;
  let ny = nameY;
  for (const ln of nameLines) {
    ctx.fillText(ln, textStartX, ny);
    ny += nameLineH;
  }
  const nameBottom = ny;

  const headerBottom = Math.max(headerTop + logoH, nameBottom);
  const dividerY = headerBottom + headerDividerGap;

  const dividerGrad = ctx.createLinearGradient(padX, 0, width - padX, 0);
  dividerGrad.addColorStop(0, "rgba(99, 102, 241, 0)");
  dividerGrad.addColorStop(0.5, "rgba(168, 85, 247, 0.42)");
  dividerGrad.addColorStop(1, "rgba(20, 184, 166, 0)");
  ctx.strokeStyle = dividerGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padX, dividerY);
  ctx.lineTo(width - padX, dividerY);
  ctx.stroke();

  const mainLine1 = tagline.includes("—") ? tagline.split("—")[0]?.trim() ?? tagline : tagline;
  const mainLine2 = tagline.includes("—") ? tagline.split("—")[1]?.trim() ?? "" : "";
  const instructMaxW = width - 2 * padX;
  const footerSlot = footerText?.trim() ? footerReserve + 34 : footerReserve + 8;
  const instructMaxBottom = cardY + cardH - footerSlot;

  const measureInstructHeight = (): number => {
    ctx.font = `700 29px ${QR_FONT_FAMILY}`;
    let h = wrapTextToLines(ctx, mainLine1, instructMaxW).length * tagLineLead;
    if (mainLine2) {
      h += tagBlocksGap;
      h += wrapTextToLines(ctx, mainLine2, instructMaxW).length * tagLineLead;
    }
    if (subtitle?.trim()) {
      ctx.font = `600 18px ${QR_FONT_FAMILY}`;
      h += subtitleTopGap;
      h += wrapTextToLines(ctx, subtitle.trim(), instructMaxW).length * subLineLead;
    }
    return h;
  };

  const instructH = measureInstructHeight();
  const maxQrPanelBottom = instructMaxBottom - qrToInstructGap - instructH;

  const qrImg = await loadImage(qrDataUrl);
  const qrPad = qrFramePad;
  let qrSize = 452;
  let qrY = dividerY + dividerQrGap;
  while (qrY + qrSize + qrPad > maxQrPanelBottom && qrSize > 300) {
    qrSize -= 10;
  }
  if (qrY + qrSize + qrPad > maxQrPanelBottom) {
    qrY = Math.max(dividerY + Math.round(dividerQrGap * 0.65), maxQrPanelBottom - qrSize - qrPad);
  }

  const qrX = (width - qrSize) / 2;
  const qrPanelX = qrX - qrPad;
  const qrPanelY = qrY - qrPad;
  const qrPanelW = qrSize + qrPad * 2;
  const qrPanelH = qrSize + qrPad * 2;

  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.1)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  roundedRectPath(ctx, qrPanelX, qrPanelY, qrPanelW, qrPanelH, qrPanelR);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  roundedRectPath(ctx, qrPanelX, qrPanelY, qrPanelW, qrPanelH, qrPanelR);
  ctx.strokeStyle = "rgba(99, 102, 241, 0.28)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  let instructY = qrY + qrSize + qrPad + qrToInstructGap;
  const cx = width / 2;
  const gx0 = cx - instructMaxW / 2;
  const gx1 = cx + instructMaxW / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const drawTagLinesCentered = (raw: string, lineHeight: number) => {
    ctx.font = `700 29px ${QR_FONT_FAMILY}`;
    for (const ln of wrapTextToLines(ctx, raw, instructMaxW)) {
      const g = ctx.createLinearGradient(gx0, instructY, gx1, instructY + 32);
      g.addColorStop(0, "#4f46e5");
      g.addColorStop(0.48, "#9333ea");
      g.addColorStop(1, "#0d9488");
      ctx.fillStyle = g;
      ctx.fillText(ln, cx, instructY);
      instructY += lineHeight;
    }
  };

  drawTagLinesCentered(mainLine1, tagLineLead);
  if (mainLine2) {
    instructY += tagBlocksGap;
    drawTagLinesCentered(mainLine2, tagLineLead);
  }

  if (subtitle?.trim()) {
    instructY += subtitleTopGap;
    ctx.font = `600 18px ${QR_FONT_FAMILY}`;
    ctx.fillStyle = "#475569";
    for (const ln of wrapTextToLines(ctx, subtitle.trim(), instructMaxW)) {
      ctx.fillText(ln, cx, instructY);
      instructY += subLineLead;
    }
  }

  if (footerText?.trim()) {
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#94a3b8";
    ctx.font = `500 18px ${QR_FONT_FAMILY}`;
    ctx.fillText(footerText.trim(), width / 2, cardY + cardH - footerReserve);
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
      className="mx-auto w-[340px] rounded-[36px] bg-gradient-to-br from-indigo-500 via-violet-500 to-teal-500 p-[3px] shadow-xl shadow-slate-900/12"
      style={{ fontFamily: '"Noto Sans Thai", "Noto Sans", sans-serif' }}
    >
      <div className="rounded-[33px] bg-[#fbfcff] bg-gradient-to-b from-[#f4f6ff]/90 to-[#fafdfb] px-5 pb-7 pt-6 shadow-inner shadow-white/40">
        <div className="flex flex-col">
          <div className="flex w-full items-center gap-4">
            {logoUrl ? (
              <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="" className="max-h-[68px] max-w-[68px] object-contain" />
              </div>
            ) : null}
            <h1 className="min-w-0 flex-1 bg-gradient-to-r from-indigo-700 via-violet-600 to-teal-700 bg-clip-text text-left text-[17px] font-black leading-snug tracking-tight text-transparent">
              {shopLabel}
            </h1>
          </div>
          <div className="mt-5 h-px w-full shrink-0 bg-gradient-to-r from-transparent via-violet-400/45 to-transparent" />
          <div className="mt-8 flex justify-center">
            <div className="rounded-[26px] border border-indigo-300/35 bg-white p-4 shadow-md shadow-slate-400/12">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR" width={228} height={228} className="h-[228px] w-[228px]" />
              ) : (
                <div className="flex h-[228px] w-[228px] items-center justify-center text-xs text-slate-400">กำลังสร้าง QR...</div>
              )}
            </div>
          </div>
          <div className="mt-8 w-full space-y-2 px-0.5 text-center">
            <p className="text-[13px] font-bold leading-relaxed text-transparent bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-teal-600 bg-clip-text">
              {tagline}
            </p>
            {subtitle?.trim() ? (
              <p className="text-[10px] font-semibold leading-relaxed text-slate-600">{subtitle.trim()}</p>
            ) : null}
          </div>
          {footerText?.trim() ? (
            <p className="mt-8 text-center text-[10px] font-medium leading-relaxed text-slate-400">{footerText.trim()}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

