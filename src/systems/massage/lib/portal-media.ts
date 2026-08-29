/** รูปพอร์ทัลลูกค้าร้านนวด — แบนเนอร์ + แกลเลอรี */

export const MASSAGE_PORTAL_GALLERY_MAX = 8;

export function massageNormalizePortalGallery(raw: unknown): string[] {
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
    if (out.length >= MASSAGE_PORTAL_GALLERY_MAX) break;
  }
  return out;
}

export function massageSerializePortalGallery(urls: string[]): string {
  return JSON.stringify(massageNormalizePortalGallery(urls));
}

const Q = "auto=format&fit=crop&q=78";

export const MASSAGE_PORTAL_SAMPLE_BANNER =
  `https://images.unsplash.com/photo-1540555700478-4be289fbecef?${Q}&w=1400&h=560`;

export const MASSAGE_PORTAL_SAMPLE_GALLERY = [
  `https://images.unsplash.com/photo-1600334129128-685c5582fd35?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1519823551278-64ac92734fb1?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1544161515-4ab6ce6db874?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1515377905703-c4788e51af15?${Q}&w=800&h=600`,
] as const;

/** โลโก้ร้านนวดตัวอย่าง */
export const MASSAGE_PORTAL_SAMPLE_LOGO =
  `https://images.unsplash.com/photo-1544161515-4ab6ce6db874?${Q}&w=240&h=240`;

/** รูปโปรไฟล์หมอนวด — ใบหน้าคน (ไม่ใช่รูปมือนวด) */
export const MASSAGE_THERAPIST_SAMPLE_PHOTOS = [
  `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?${Q}&w=400&h=400`,
  `https://images.unsplash.com/photo-1594824476967-48c8b964273f?${Q}&w=400&h=400`,
  `https://images.unsplash.com/photo-1582750433449-648ed127bb54?${Q}&w=400&h=400`,
  `https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?${Q}&w=400&h=400`,
  `https://images.unsplash.com/photo-1622253692010-333f2da6031d?${Q}&w=400&h=400`,
] as const;

/**
 * รูปปกแพ็กเกจตัวอย่าง — บริการนวด/สปา
 * ลำดับ: ไทย · น้ำมัน · เท้า · ประคบ · หัวไหล่ · อโรมา · หินร้อน · ผ่อนคลาย · พรีเมียม · …
 */
export const MASSAGE_PACKAGE_SAMPLE_IMAGES = [
  `https://images.unsplash.com/photo-1544161515-4ab6ce6db874?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1600334129128-685c5582fd35?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1515377905703-c4788e51af15?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1519823551278-64ac92734fb1?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1540555700478-4be289fbecef?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1600618528240-fb9fc964b853?${Q}&w=640&h=640`,
  `https://images.unsplash.com/photo-1540555700478-4be289fbecef?${Q}&w=640&h=640&sat=-20`,
  `https://images.unsplash.com/photo-1515377905703-c4788e51af15?${Q}&w=640&h=640&sat=-15`,
  `https://images.unsplash.com/photo-1600334129128-685c5582fd35?${Q}&w=640&h=640&sat=-10`,
] as const;

export const MASSAGE_PORTAL_SAMPLE_CONTACT = {
  contactLine: "mawell",
  facebookUrl: "https://www.facebook.com/",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Bangkok",
} as const;
