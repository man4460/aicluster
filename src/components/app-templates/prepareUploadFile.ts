"use client";

import {
  prepareImageFileAsDataUrl,
  prepareImageFileForUpload,
  PREPARED_IMAGE_MAX_BYTES,
  PREPARED_IMAGE_MAX_DIMENSION,
} from "@/components/app-templates/prepareImageFileForUpload";
import {
  normalizeUploadDisplayName,
  suggestUploadDisplayName,
  UPLOAD_DISPLAY_NAME_MAX,
} from "@/lib/upload/display-name";

export {
  normalizeUploadDisplayName,
  suggestUploadDisplayName,
  UPLOAD_DISPLAY_NAME_MAX,
};

/** เพดานฝั่ง client ก่อนส่ง (เซิร์ฟเวอร์อาจเข้มกว่า) */
export const CLIENT_UPLOAD_MAX_IMAGE_BYTES = PREPARED_IMAGE_MAX_BYTES;
export const CLIENT_UPLOAD_MAX_PDF_BYTES = 12 * 1024 * 1024;

export function isPdfUploadFile(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export function isImageUploadFile(file: File): boolean {
  if (isPdfUploadFile(file)) return false;
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name);
}

export type PrepareUploadFileOptions = {
  /** ค่าเริ่ม image-or-pdf */
  accept?: "image" | "pdf" | "image-or-pdf";
  maxImageBytes?: number;
  maxPdfBytes?: number;
};

/**
 * เตรียมไฟล์ก่อนอัปโหลดทั้งระบบ:
 * - รูป → ย่อ/JPEG ด้วย prepareImageFileForUpload
 * - PDF → ส่งไฟล์เดิม (ตรวจขนาด)
 */
export async function prepareUploadFile(
  file: File,
  options?: PrepareUploadFileOptions,
): Promise<File> {
  const accept = options?.accept ?? "image-or-pdf";
  const maxImage = options?.maxImageBytes ?? CLIENT_UPLOAD_MAX_IMAGE_BYTES;
  const maxPdf = options?.maxPdfBytes ?? CLIENT_UPLOAD_MAX_PDF_BYTES;

  if (isPdfUploadFile(file)) {
    if (accept === "image") {
      throw new Error("รองรับเฉพาะไฟล์รูป");
    }
    if (file.size > maxPdf) {
      throw new Error(`PDF ใหญ่เกิน ${(maxPdf / 1024 / 1024).toFixed(0)}MB`);
    }
    return file;
  }

  if (accept === "pdf") {
    throw new Error("รองรับเฉพาะไฟล์ PDF");
  }

  if (!isImageUploadFile(file) && !file.type.startsWith("image/")) {
    throw new Error("รองรับ JPG PNG WEBP GIF หรือ PDF");
  }

  const prepared = await prepareImageFileForUpload(file);
  if (prepared.size > maxImage * 1.05) {
    throw new Error(`ไฟล์ใหญ่เกิน ${(maxImage / 1024 / 1024).toFixed(1)}MB หลังย่อรูป`);
  }
  return prepared;
}

/** ย่อรูปแล้วได้ data URL — สะดวกโมดูลที่เก็บสลิปเป็น data URL ก่อน persist */
export async function prepareUploadFileAsDataUrl(
  file: File,
  options?: PrepareUploadFileOptions,
): Promise<string> {
  const prepared = await prepareUploadFile(file, { ...options, accept: options?.accept ?? "image" });
  return prepareImageFileAsDataUrl(prepared);
}
