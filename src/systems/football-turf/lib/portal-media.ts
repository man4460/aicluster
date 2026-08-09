/** รูปพอร์ทัลลูกค้า — แบนเนอร์ + แกลเลอรีภาพรวมสนาม */

export const FOOTBALL_TURF_PORTAL_GALLERY_MAX = 8;

export function footballTurfNormalizePortalGallery(raw: unknown): string[] {
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
    if (out.length >= FOOTBALL_TURF_PORTAL_GALLERY_MAX) break;
  }
  return out;
}

const Q = "auto=format&fit=crop&q=78";

/** แบนเนอร์ตัวอย่างสนามหญ้าเทียม */
export const FOOTBALL_TURF_PORTAL_SAMPLE_BANNER =
  `https://images.unsplash.com/photo-1551958219-acbc608c6377?${Q}&w=1400&h=560`;

/** รูปแกลเลอรีตัวอย่างภาพรวมสนาม */
export const FOOTBALL_TURF_PORTAL_SAMPLE_GALLERY = [
  `https://images.unsplash.com/photo-1574629810360-7efbbe195018?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1529900748604-07564a03e7a6?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1579952363873-27f3bade9f55?${Q}&w=800&h=600`,
] as const;
