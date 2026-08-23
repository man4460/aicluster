/** สื่อหน้าแรก — แบนเนอร์ + แกลเลอรีแบบเว็บไซต์จองโรงแรม */

const Q = "auto=format&fit=crop&q=80";

export const LANDING_HERO_BANNER = `https://images.unsplash.com/photo-1571896349842-33c89424de2d?${Q}&w=1920&h=1080`;

export type LandingGalleryItem = {
  src: string;
  label: string;
};

/** แกลเลอรีภาพรวมโมดูล — กดดู lightbox ได้ทั้งชุด */
export const LANDING_GALLERY: LandingGalleryItem[] = [
  {
    label: "โรงแรม / รีสอร์ท",
    src: `https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?${Q}&w=1200&h=900`,
  },
  {
    label: "POS ร้านอาหาร",
    src: `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?${Q}&w=1200&h=800`,
  },
  {
    label: "POS ร้านเครื่องดื่ม",
    src: `https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?${Q}&w=900&h=900`,
  },
  {
    label: "จองคิวอัจฉริยะ",
    src: `https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?${Q}&w=900&h=700`,
  },
  {
    label: "สนามฟุตบอล",
    src: `https://images.unsplash.com/photo-1574629810360-7efbbe195018?${Q}&w=1200&h=800`,
  },
  {
    label: "คาร์แคร์",
    src: `https://images.unsplash.com/photo-1607860108855-64acf2078ed9?${Q}&w=900&h=700`,
  },
  {
    label: "ร้านตัดผม",
    src: `https://images.unsplash.com/photo-1503951914875-452162b0f3f1?${Q}&w=900&h=900`,
  },
  {
    label: "ธนาคารโรงเรียน",
    src: `https://images.unsplash.com/photo-1523240795612-9a054b0db644?${Q}&w=1200&h=800`,
  },
];

export const LANDING_GALLERY_URLS = LANDING_GALLERY.map((g) => g.src);

function unsplashHeroSrc(src: string): string {
  try {
    const u = new URL(src);
    u.searchParams.set("w", "1920");
    u.searchParams.set("h", "1080");
    u.searchParams.set("fit", "crop");
    u.searchParams.set("q", "80");
    u.searchParams.set("auto", "format");
    return u.toString();
  } catch {
    return src;
  }
}

/** แบนเนอร์ฮีโร่ — รูปโมดูลสลับอัตโนมัติ (ความละเอียดเต็มจอ) */
export const LANDING_HERO_SLIDES: LandingGalleryItem[] = [
  ...LANDING_GALLERY.map((g) => ({ label: g.label, src: unsplashHeroSrc(g.src) })),
  {
    label: "ร้านนวด",
    src: unsplashHeroSrc(`https://images.unsplash.com/photo-1544161515-4ab6ce6db874?${Q}&w=1920&h=1080`),
  },
  {
    label: "จัดการหอพัก",
    src: unsplashHeroSrc(`https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?${Q}&w=1920&h=1080`),
  },
];

export const LANDING_HERO_SLIDE_INTERVAL_MS = 5500;
