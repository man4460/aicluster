"use client";

const MAX_PREPARED_BYTES = 1.85 * 1024 * 1024;
const MAX_DIMENSION = 2048;

/**
 * ย่อ/บีบเป็น JPEG ก่อนอัปโหลด — ใช้ร่วมกับสลิป หลักฐาน รูปแนบทั่วแอป
 */
export async function prepareImageFileForUpload(file: File): Promise<File> {
  if (file.size <= MAX_PREPARED_BYTES && file.type && /^image\/(jpeg|jpg|pjpeg|png|webp)$/i.test(file.type)) {
    return file;
  }

  try {
    const bmp = await createImageBitmap(file);
    try {
      let w = bmp.width;
      let h = bmp.height;
      if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
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
