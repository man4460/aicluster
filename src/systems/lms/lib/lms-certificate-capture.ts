/** Client helpers — เรนเดอร์ / จับภาพใบประกาศ LMS เป็น canvas / PDF */

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import {
  buildLmsCertificateDocumentHtml,
  LMS_CERT_PX,
  type LmsCertificateHtmlInput,
} from "@/systems/lms/lib/lms-certificate-html";

export function absoluteAssetUrl(pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl) return undefined;
  const v = pathOrUrl.trim();
  if (!v) return undefined;
  if (v.startsWith("data:") || /^https?:\/\//i.test(v)) return v;
  if (typeof window === "undefined") return v;
  return `${window.location.origin}${v.startsWith("/") ? v : `/${v}`}`;
}

export function formatThaiCertDate(isoOrDate: string | Date = new Date()): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return String(isoOrDate);
  const dayMonthYear = d.toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `ให้ไว้ ณ วันที่ ${dayMonthYear}`;
}

export function mountLmsCertCaptureHost(fullHtml: string): { root: HTMLElement; cleanup: () => void } {
  const parsed = new DOMParser().parseFromString(fullHtml, "text/html");
  const root = parsed.getElementById("lms-cert-root");
  if (!(root instanceof HTMLElement)) {
    throw new Error("ไม่พบต้นแบบใบประกาศ");
  }

  const host = document.createElement("div");
  host.setAttribute("data-lms-cert-capture-host", "1");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:-9999px;top:0;width:1123px;height:794px;border:0;margin:0;padding:0;opacity:0;pointer-events:none;z-index:-1;overflow:hidden";

  for (const node of parsed.head.querySelectorAll("style")) {
    host.appendChild(node.cloneNode(true));
  }
  const clone = root.cloneNode(true);
  if (!(clone instanceof HTMLElement)) {
    throw new Error("ไม่พบต้นแบบใบประกาศ");
  }
  host.appendChild(clone);
  document.body.appendChild(host);

  return {
    root: clone,
    cleanup: () => {
      host.remove();
    },
  };
}

async function waitImages(root: HTMLElement, maxMs = 8000): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  if (imgs.length === 0) return;
  await Promise.race([
    Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
    ),
    new Promise<void>((r) => setTimeout(r, maxMs)),
  ]);
}

export async function buildLmsCertQrDataUrl(verifyUrl: string): Promise<string | undefined> {
  try {
    return await QRCode.toDataURL(verifyUrl, {
      width: 220,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#1e1b4b", light: "#ffffff" },
    });
  } catch {
    return undefined;
  }
}

export type LmsCertRenderOptions = {
  /** scale ของ html2canvas — พรีวิวใช้ 1 · PDF ใช้ 2 */
  scale?: number;
};

/** จับภาพใบประกาศเป็น JPEG data URL */
export async function renderLmsCertificateJpeg(
  input: LmsCertificateHtmlInput,
  options?: LmsCertRenderOptions,
): Promise<string> {
  const html = buildLmsCertificateDocumentHtml(input);
  const { root, cleanup } = mountLmsCertCaptureHost(html);
  try {
    await waitImages(root);
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    const canvas = await html2canvas(root, {
      scale: options?.scale ?? 1,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      width: LMS_CERT_PX.width,
      height: LMS_CERT_PX.height,
      windowWidth: LMS_CERT_PX.width,
      windowHeight: LMS_CERT_PX.height,
      logging: false,
      imageTimeout: 10_000,
      foreignObjectRendering: false,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
    });
    return canvas.toDataURL("image/jpeg", 0.92);
  } finally {
    cleanup();
  }
}

/** สร้าง PDF A4 แนวนอนแล้วดาวน์โหลด */
export async function downloadLmsCertificatePdf(
  input: LmsCertificateHtmlInput,
  filename: string,
): Promise<void> {
  const jpeg = await renderLmsCertificateJpeg(input, { scale: 2 });
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  pdf.addImage(jpeg, "JPEG", 0, 0, 297, 210);
  pdf.save(filename);
}

export type LmsCertPreviewFields = {
  instituteName: string;
  logoUrl?: string | null;
  signerName?: string | null;
  signerTitle?: string | null;
  signatureUrl?: string | null;
  note?: string | null;
  slug: string;
  /** ตัวอย่างชื่อผู้เรียนบนพรีวิว */
  sampleLearnerName?: string;
  /** ตัวอย่างชื่อคอร์สบนพรีวิว */
  sampleCourseTitle?: string;
};

export async function buildLmsCertificatePreviewInput(
  fields: LmsCertPreviewFields,
): Promise<LmsCertificateHtmlInput> {
  const certCode = "PREVIEW-SAMPLE";
  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/lms/${encodeURIComponent(fields.slug)}/verify/${encodeURIComponent(certCode)}`
      : `/lms/${fields.slug}/verify/${certCode}`;
  const qrDataUrl = await buildLmsCertQrDataUrl(verifyUrl);

  return {
    instituteName: fields.instituteName || "สถาบัน",
    learnerName: fields.sampleLearnerName?.trim() || "ตัวอย่าง ชื่อผู้เรียน",
    courseTitle: fields.sampleCourseTitle?.trim() || "ตัวอย่างหลักสูตรออนไลน์",
    issueDateLabel: formatThaiCertDate(new Date()),
    certCode,
    signerName: fields.signerName?.trim() || fields.instituteName || undefined,
    signerTitle: fields.signerTitle?.trim() || "ผู้ออกใบประกาศ",
    note: fields.note?.trim() || undefined,
    logoUrl: absoluteAssetUrl(fields.logoUrl),
    signatureUrl: absoluteAssetUrl(fields.signatureUrl),
    qrDataUrl,
  };
}
