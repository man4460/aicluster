/** รวมรูปปก + แกลเลอรีมุมอื่น (ไม่ซ้ำ) */
export function parseEcommerceProductImageUrls(
  imageUrl: string | null | undefined,
  galleryImagesJson: string | null | undefined,
): string[] {
  const out: string[] = [];
  const cover = imageUrl?.trim();
  if (cover) out.push(cover);
  try {
    const raw = galleryImagesJson?.trim() || "[]";
    const arr = JSON.parse(raw) as unknown;
    if (Array.isArray(arr)) {
      for (const item of arr) {
        if (typeof item !== "string") continue;
        const u = item.trim();
        if (u && !out.includes(u)) out.push(u);
      }
    }
  } catch {
    /* ignore */
  }
  return out.slice(0, 12);
}

export function serializeEcommerceGalleryImages(urls: string[]): string {
  const unique: string[] = [];
  for (const raw of urls) {
    const u = raw.trim();
    if (u && !unique.includes(u)) unique.push(u);
  }
  return JSON.stringify(unique.slice(0, 11));
}
