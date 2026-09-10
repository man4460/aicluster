/** สื่อหน้าแรก — แบนเนอร์ + แกลเลอรีแบบเว็บไซต์จองโรงแรม */

import {
  LANDING_DAILY_MODULE_SHOWCASE,
  LANDING_FREE_MODULE_SHOWCASE,
} from "@/app/landing/landing-module-showcase-data";
import { displayAppModuleTitle } from "@/lib/modules/config";

const Q = "auto=format&fit=crop&q=80";

export const LANDING_HERO_BANNER = `https://images.unsplash.com/photo-1571896349842-33c89424de2d?${Q}&w=1920&h=1080`;

export type LandingGalleryItem = {
  src: string;
  label: string;
  /** เมื่อมี — คลิกแบนเนอร์/ชื่อไปหน้าทดลอง `/try/{slug}` */
  slug?: string;
};

/** แกลเลอรีภาพรวมโมดูล — กดดู lightbox ได้ทั้งชุด */
export const LANDING_GALLERY: LandingGalleryItem[] = [
  {
    label: "โรงแรม / รีสอร์ท",
    slug: "hotel-resort",
    src: `https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?${Q}&w=1200&h=900`,
  },
  {
    label: "POS ร้านอาหาร",
    slug: "building-pos",
    src: `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?${Q}&w=1200&h=800`,
  },
  {
    label: "POS ร้านเครื่องดื่ม",
    slug: "drink-pos",
    src: `https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?${Q}&w=900&h=900`,
  },
  {
    label: "จองคิวอัจฉริยะ",
    slug: "appointment-queue",
    src: `https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?${Q}&w=900&h=700`,
  },
  {
    label: "สนามฟุตบอล",
    slug: "football-turf",
    src: `https://images.unsplash.com/photo-1574629810360-7efbbe195018?${Q}&w=1200&h=800`,
  },
  {
    label: "คาร์แคร์",
    slug: "car-wash",
    src: `https://images.unsplash.com/photo-1607860108855-64acf2078ed9?${Q}&w=900&h=700`,
  },
  {
    label: "ร้านตัดผม",
    slug: "barber",
    src: `https://images.unsplash.com/photo-1503951914875-452162b0f3f1?${Q}&w=900&h=900`,
  },
  {
    label: "ธนาคารโรงเรียน",
    slug: "school-bank",
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

/** ทุกโมดูลบน landing (1 บาท/วัน + ฟรี) — ใช้สร้างแบนเนอร์ฮีโร่ครบชุด */
const LANDING_ALL_MODULE_SHOWCASE = [...LANDING_DAILY_MODULE_SHOWCASE, ...LANDING_FREE_MODULE_SHOWCASE];

/** แบนเนอร์ฮีโร่ — รูปทุกโมดูลสลับอัตโนมัติ (ความละเอียดเต็มจอ) */
export const LANDING_HERO_SLIDES: LandingGalleryItem[] = LANDING_ALL_MODULE_SHOWCASE.map((item) => ({
  slug: item.slug,
  label: displayAppModuleTitle(item.slug, item.slug),
  src: unsplashHeroSrc(item.coverSrc),
}));

export const LANDING_HERO_SLIDE_INTERVAL_MS = 5500;
