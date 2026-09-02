/** รูปพอร์ทัลลูกค้าร้านซักผ้า — แบนเนอร์ + แกลเลอรี (ตรวจ Unsplash แล้ว) */

export const LAUNDRY_PORTAL_GALLERY_MAX = 8;

export function laundryNormalizePortalGallery(raw: unknown): string[] {
  let list: unknown = raw;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    try {
      list = JSON.parse(t) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  const out: string[] = [];
  for (const item of list) {
    if (typeof item !== "string") continue;
    const url = item.trim();
    if (!url || url.length > 512) continue;
    out.push(url);
    if (out.length >= LAUNDRY_PORTAL_GALLERY_MAX) break;
  }
  return out;
}

export function laundrySerializePortalGallery(urls: string[]): string {
  return JSON.stringify(laundryNormalizePortalGallery(urls));
}

const Q = "auto=format&fit=crop&q=78";

/** ลิงก์ Unsplash ที่ถูกลบ/404 — ใช้แทนที่ตอน seed / ซ่อมข้อมูลเก่า */
export const LAUNDRY_BROKEN_UNSplash_RE = /photo-1610557892470-55d9a6c4d0b6/;

export const LAUNDRY_PORTAL_SAMPLE_BANNER =
  `https://images.unsplash.com/photo-1582735689369-4fe89db7114c?${Q}&w=1400&h=560`;

export const LAUNDRY_PORTAL_SAMPLE_GALLERY = [
  `https://images.unsplash.com/photo-1582735689369-4fe89db7114c?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?${Q}&w=800&h=600`,
] as const;

export const LAUNDRY_PORTAL_SAMPLE_LOGO =
  `https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?${Q}&w=240&h=240`;

/** รูปปกแพ็กเกจตัวอย่าง — index ตามลำดับแพ็กใน seed */
export const LAUNDRY_PACKAGE_SAMPLE_IMAGES = [
  `https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?${Q}&w=400&h=300`,
  `https://images.unsplash.com/photo-1582735689369-4fe89db7114c?${Q}&w=400&h=300`,
  `https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?${Q}&w=400&h=300`,
] as const;

export function laundryPackageSampleImage(index: number): string {
  const list = LAUNDRY_PACKAGE_SAMPLE_IMAGES;
  return list[((index % list.length) + list.length) % list.length]!;
}

/** แทนที่ URL ตัวอย่างที่เคย 404 ด้วยชุดใหม่ */
export function laundryRepairSampleImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return url ?? null;
  if (!LAUNDRY_BROKEN_UNSplash_RE.test(url)) return url;
  if (url.includes("w=240") || url.includes("h=240")) return LAUNDRY_PORTAL_SAMPLE_LOGO;
  if (url.includes("w=400") || url.includes("h=300")) return LAUNDRY_PACKAGE_SAMPLE_IMAGES[0]!;
  if (url.includes("w=1400") || url.includes("h=560")) return LAUNDRY_PORTAL_SAMPLE_BANNER;
  return LAUNDRY_PORTAL_SAMPLE_GALLERY[1]!;
}

export function laundryRepairPortalGallery(urls: string[]): string[] {
  return urls.map((u) => laundryRepairSampleImageUrl(u) ?? u);
}
