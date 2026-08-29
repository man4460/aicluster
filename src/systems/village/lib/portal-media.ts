/** รูปพอร์ทัลลูกค้าหมู่บ้าน — แบนเนอร์ + แกลเลอรี */

export const VILLAGE_PORTAL_GALLERY_MAX = 8;

export function villageNormalizePortalGallery(raw: unknown): string[] {
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
    if (out.length >= VILLAGE_PORTAL_GALLERY_MAX) break;
  }
  return out;
}

const Q = "auto=format&fit=crop&q=78";

export const VILLAGE_PORTAL_SAMPLE_BANNER =
  `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?${Q}&w=1400&h=560`;

export const VILLAGE_PORTAL_SAMPLE_GALLERY = [
  `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?${Q}&w=800&h=600`,
] as const;

export { probePortalImageUrl, filterLoadablePortalGalleryUrls } from "@/systems/dormitory/lib/portal-media";
