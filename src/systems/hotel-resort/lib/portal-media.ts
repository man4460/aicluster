/** รูปพอร์ทัลลูกค้า — แบนเนอร์ + แกลเลอรีภาพรวมโรงแรม */

export const HOTEL_RESORT_PORTAL_GALLERY_MAX = 8;
export const HOTEL_RESORT_REVIEW_PHOTO_MAX = 5;

export function hotelResortNormalizeReviewPhotos(raw: unknown): string[] {
  let arr: unknown[] = [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) arr = parsed;
    } catch {
      arr = [];
    }
  } else if (Array.isArray(raw)) {
    arr = raw;
  }
  return arr
    .filter((u): u is string => typeof u === "string" && u.trim().startsWith("/"))
    .map((u) => u.trim())
    .slice(0, HOTEL_RESORT_REVIEW_PHOTO_MAX);
}

export function hotelResortNormalizePortalGallery(raw: unknown): string[] {
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
    if (out.length >= HOTEL_RESORT_PORTAL_GALLERY_MAX) break;
  }
  return out;
}

const Q = "auto=format&fit=crop&q=78";

/** แบนเนอร์ตัวอย่างรีสอร์ท */
export const HOTEL_RESORT_PORTAL_SAMPLE_BANNER =
  `https://images.unsplash.com/photo-1566073771259-6a8506099945?${Q}&w=1400&h=560`;

/** รูปแกลเลอรีตัวอย่างภาพรวมโรงแรม */
export const HOTEL_RESORT_PORTAL_SAMPLE_GALLERY = [
  `https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1578683010236-d716f9a3f461?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1445019980597-93fa8acb246c?${Q}&w=800&h=600`,
] as const;
