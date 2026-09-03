"use client";

/** ชื่อไฟล์มาตรฐานฝั่ง client ก่อนอัปโหลดแกลเลอรี */
export function clubEventClientGalleryFileName(): string {
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `club-event-gallery-${stamp}-${rand}.webp`;
}

const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 0.82;

/**
 * ย่อรูป · แปลง WebP · ตั้งชื่อมาตรฐาน ฝั่ง client ก่อนอัปโหลดแกลเลอรีกิจกรรม
 */
export async function prepareClubEventGalleryWebp(file: File): Promise<File> {
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
    if (!ctx) throw new Error("ไม่สามารถประมวลผลรูปได้");
    ctx.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );
    if (!blob) throw new Error("แปลงรูปเป็น WebP ไม่สำเร็จ");
    return new File([blob], clubEventClientGalleryFileName(), {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } finally {
    bmp.close();
  }
}
