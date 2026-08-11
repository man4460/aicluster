/** รูปพอร์ทัลลูกค้าคาร์แคร์ — แบนเนอร์ + แกลเลอรี + แพ็ก (ตรวจ Unsplash แล้ว) */

export const CAR_WASH_PORTAL_GALLERY_MAX = 8;

const Q = "auto=format&fit=crop&q=78";

export const CAR_WASH_PORTAL_SAMPLE_BANNER =
  `https://images.unsplash.com/photo-1607860108855-64acf2078ed9?${Q}&w=1400&h=560`;

export const CAR_WASH_PORTAL_SAMPLE_GALLERY = [
  `https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1601362840469-51e4d8d58785?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1489824904134-891ab64532f1?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?${Q}&w=800&h=600`,
] as const;

export const CAR_WASH_PORTAL_SAMPLE_LOGO =
  `https://images.unsplash.com/photo-1511919884226-fd3cad34687c?${Q}&w=240&h=240`;

/** รูปปกแพ็กเกจตัวอย่าง — index ตามลำดับแพ็ก */
export const CAR_WASH_PACKAGE_SAMPLE_IMAGES = [
  `https://images.unsplash.com/photo-1607860108855-64acf2078ed9?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1601362840469-51e4d8d58785?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1502877338535-766e1452684a?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1503376780353-7e6692767b70?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?${Q}&w=640&h=640`,
] as const;

/** ลิงก์ติดต่อตัวอย่าง (เปิดได้จริง) */
export const CAR_WASH_PORTAL_SAMPLE_CONTACT = {
  tagline: "ล้างรถเงางาม · จองคิวออนไลน์",
  address: "123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110",
  contactPhone: "0812345678",
  contactLine: "mawell",
  facebookUrl: "https://www.facebook.com/",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Car+Wash+Bangkok",
} as const;

export function carWashNormalizePortalGallery(raw: unknown): string[] {
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
    if (out.length >= CAR_WASH_PORTAL_GALLERY_MAX) break;
  }
  return out;
}

export function carWashSerializePortalGallery(urls: string[]): string {
  return JSON.stringify(carWashNormalizePortalGallery(urls));
}

export function carWashPackageSampleImage(index: number): string {
  const list = CAR_WASH_PACKAGE_SAMPLE_IMAGES;
  return list[((index % list.length) + list.length) % list.length]!;
}
