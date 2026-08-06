"use client";

/** ขอบยาวสูงสุดหลังย่อ — สลิป/หลักฐานทุกระบบใช้ค่าเดียวกัน */
export const PREPARED_IMAGE_MAX_DIMENSION = 1600;
/** ขนาดไฟล์เป้าหมายหลังบีบ JPEG */
export const PREPARED_IMAGE_MAX_BYTES = 1.85 * 1024 * 1024;

const MAX_PREPARED_BYTES = PREPARED_IMAGE_MAX_BYTES;
const MAX_DIMENSION = PREPARED_IMAGE_MAX_DIMENSION;

function isJpegType(type: string | undefined): boolean {
  return Boolean(type && /^image\/(jpeg|jpg|pjpeg)$/i.test(type));
}

function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        reject(new Error("ไม่สามารถอ่านไฟล์รูปได้"));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์รูปได้"));
    reader.readAsDataURL(file);
  });
}

/**
 * ย่อ/บีบเป็น JPEG ก่อนอัปโหลด — ใช้ร่วมกับสลิป หลักฐาน รูปแนบทั่วแอป
 * รูปที่ยาวเกิน PREPARED_IMAGE_MAX_DIMENSION หรือไม่ใช่ JPEG / ใหญ่เกินเพดาน จะถูกปรับให้มาตรฐานเดียวกัน
 */
export async function prepareImageFileForUpload(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    try {
      const needsResize = bmp.width > MAX_DIMENSION || bmp.height > MAX_DIMENSION;
      const needsReencode =
        needsResize || file.size > MAX_PREPARED_BYTES || !isJpegType(file.type);

      if (!needsReencode) {
        return file;
      }

      let w = bmp.width;
      let h = bmp.height;
      if (needsResize) {
        const s = MAX_DIMENSION / Math.max(w, h);
        w = Math.max(1, Math.round(w * s));
        h = Math.max(1, Math.round(h * s));
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(bmp, 0, 0, w, h);

      let quality = 0.85;
      let blob: Blob | null = await new Promise((res) => canvas.toBlob((b) => res(b), "image/jpeg", quality));
      while (blob && blob.size > MAX_PREPARED_BYTES && quality > 0.45) {
        quality -= 0.1;
        blob = await new Promise((res) => canvas.toBlob((b) => res(b), "image/jpeg", quality));
      }
      if (!blob || blob.size === 0) return file;
      const base = file.name.replace(/\.[^.]+$/, "") || "image";
      return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
    } finally {
      bmp.close();
    }
  } catch {
    return file;
  }
}

/**
 * ย่อรูปด้วยมาตรฐานกลาง แล้วคืนเป็น data URL (สำหรับโมดูลที่เก็บสลิปเป็น data URL)
 */
export async function prepareImageFileAsDataUrl(file: File): Promise<string> {
  const prepared = await prepareImageFileForUpload(file);
  return readFileAsDataUrl(prepared);
}

const MAX_VISION_OCR_BYTES = 4 * 1024 * 1024;
const MAX_VISION_OCR_DIMENSION = 2800;
const VISION_JPEG_QUALITY_START = 0.92;

/**
 * แปลงรูปแนบในแชทให้เป็น JPEG คุณภาพสูงก่อนส่งให้ OCR (Kimi/GLM)
 * — ลดปัญหา HEIC/WebP/บีบมากเกินไปที่ทำให้อ่านสลิปในเว็บพลาด ทั้งที่รูปจาก Telegram อ่านได้
 */
export async function prepareImageFileForVisionOcr(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    try {
      let w = bmp.width;
      let h = bmp.height;
      if (w > MAX_VISION_OCR_DIMENSION || h > MAX_VISION_OCR_DIMENSION) {
        const s = MAX_VISION_OCR_DIMENSION / Math.max(w, h);
        w = Math.max(1, Math.round(w * s));
        h = Math.max(1, Math.round(h * s));
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(bmp, 0, 0, w, h);

      let quality = VISION_JPEG_QUALITY_START;
      let blob: Blob | null = await new Promise((res) =>
        canvas.toBlob((b) => res(b), "image/jpeg", quality),
      );
      while (blob && blob.size > MAX_VISION_OCR_BYTES && quality > 0.72) {
        quality -= 0.06;
        blob = await new Promise((res) => canvas.toBlob((b) => res(b), "image/jpeg", quality));
      }
      if (!blob || blob.size === 0) return file;
      const base = file.name.replace(/\.[^.]+$/, "") || "slip";
      return new File([blob], `${base}-vision.jpg`, { type: "image/jpeg", lastModified: Date.now() });
    } finally {
      bmp.close();
    }
  } catch {
    return prepareImageFileForUpload(file);
  }
}
