/** รูปพอร์ทัลลูกค้าหอพัก — แบนเนอร์ + แกลเลอรี */

export const DORMITORY_PORTAL_GALLERY_MAX = 8;

export function dormitoryNormalizePortalGallery(raw: unknown): string[] {
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
    if (out.length >= DORMITORY_PORTAL_GALLERY_MAX) break;
  }
  return out;
}

const Q = "auto=format&fit=crop&q=78";

export const DORMITORY_PORTAL_SAMPLE_BANNER =
  `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?${Q}&w=1400&h=560`;

export const DORMITORY_PORTAL_SAMPLE_GALLERY = [
  `https://images.unsplash.com/photo-1555854877-586c37d9f2c9?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?${Q}&w=800&h=600`,
] as const;

/** ตรวจว่า URL โหลดเป็นรูปได้ (client-side) */
export function probePortalImageUrl(url: string): Promise<boolean> {
  const s = url.trim();
  if (!s) return Promise.resolve(false);
  if (typeof window === "undefined") return Promise.resolve(true);
  return new Promise((resolve) => {
    const img = new Image();
    const done = (ok: boolean) => {
      img.onload = null;
      img.onerror = null;
      resolve(ok);
    };
    img.onload = () => done(true);
    img.onerror = () => done(false);
    img.referrerPolicy = "no-referrer";
    img.src = s;
  });
}

/** คัดเฉพาะ URL ที่โหลดได้ — ใช้ก่อนแสดงบนเว็บลูกค้า */
export async function filterLoadablePortalGalleryUrls(urls: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const url of urls) {
    if (await probePortalImageUrl(url)) out.push(url);
  }
  return out;
}
