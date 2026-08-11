/** รูปพอร์ทัลลูกค้าร้านตัดผม — แบนเนอร์ + แกลเลอรี */

export const BARBER_PORTAL_GALLERY_MAX = 8;

export function barberNormalizePortalGallery(raw: unknown): string[] {
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
    if (out.length >= BARBER_PORTAL_GALLERY_MAX) break;
  }
  return out;
}

export function barberSerializePortalGallery(urls: string[]): string {
  return JSON.stringify(barberNormalizePortalGallery(urls));
}

const Q = "auto=format&fit=crop&q=78";

export const BARBER_PORTAL_SAMPLE_BANNER =
  `https://images.unsplash.com/photo-1585747860715-2ba37e788b70?${Q}&w=1400&h=560`;

export const BARBER_PORTAL_SAMPLE_GALLERY = [
  `https://images.unsplash.com/photo-1503951914875-452162b0f3f1?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1622286342621-4bd786c2447c?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1605497788044-5a32c7078486?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1621605815971-fbc98d665033?${Q}&w=800&h=600`,
] as const;

/** โลโก้ / รูปช่างตัวอย่าง (Unsplash — เสถียรกว่า picsum redirect) */
export const BARBER_PORTAL_SAMPLE_LOGO =
  `https://images.unsplash.com/photo-1621607512214-68297480165e?${Q}&w=240&h=240`;

export const BARBER_STYLIST_SAMPLE_PHOTOS = [
  `https://images.unsplash.com/photo-1503951914875-452162b0f3f1?${Q}&w=400&h=400`,
  `https://images.unsplash.com/photo-1622286342621-4bd786c2447c?${Q}&w=400&h=400`,
  `https://images.unsplash.com/photo-1605497788044-5a32c7078486?${Q}&w=400&h=400`,
  `https://images.unsplash.com/photo-1621605815971-fbc98d665033?${Q}&w=400&h=400`,
  `https://images.unsplash.com/photo-1585747860715-2ba37e788b70?${Q}&w=400&h=400`,
] as const;

/** รูปปกแพ็กเกจตัวอย่าง — index ตามลำดับแพ็กใน seed */
export const BARBER_PACKAGE_SAMPLE_IMAGES = [
  `https://images.unsplash.com/photo-1503951914875-452162b0f3f1?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1622286342621-4bd786c2447c?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1560066984-138dadb4c035?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1605497788044-5a32c7078486?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1621605815971-fbc98d665033?${Q}&w=640&h=640`,
] as const;

/** ลิงก์ติดต่อตัวอย่าง (เปิดได้จริง) */
export const BARBER_PORTAL_SAMPLE_CONTACT = {
  contactLine: "mawell",
  facebookUrl: "https://www.facebook.com/",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Bangkok",
} as const;
