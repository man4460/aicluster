import { dashboardModuleCardDescription } from "@/lib/modules/dashboard-card-descriptions";
import { getDefaultModuleCoverImageUrl } from "@/lib/modules/dashboard-module-cover-images";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import {
  BUILDING_POS_TRY_BANNER,
  BUILDING_POS_TRY_FEATURES,
  BUILDING_POS_TRY_VIDEOS,
} from "@/systems/building-pos/lib/try-promo-content";

const GENERIC_BANNER =
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1920&q=80";

export type ModuleTryPromoFeature = { title: string; hint: string };

export type ModuleTryPromoFallbackVideo = {
  id: string;
  title: string;
  hint: string;
  href: string;
  thumb: string;
};

export type ModuleTryPromoCopy = {
  eyebrow: string;
  tagline: string;
  features: ModuleTryPromoFeature[];
  defaultBanner: string;
  /** คลิปสำรองเมื่อแอดมินยังไม่ตั้ง (มีเฉพาะบางโมดูล เช่น building-pos) */
  fallbackVideos: ModuleTryPromoFallbackVideo[];
};

function featuresFromCardDescription(slug: string): ModuleTryPromoFeature[] {
  const lines = dashboardModuleCardDescription(slug)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const fromDesc = lines.map((line) => ({
    title: line,
    hint: "ใช้งานได้ในแดชบอร์ดจริง",
  }));
  const extras: ModuleTryPromoFeature[] = [
    { title: "ทดลองใช้งานจริง", hint: "เข้าแดชบอร์ดผ่านปุ่มทดลองด้านบน" },
    { title: "วิดีโอเรียนรู้", hint: "กดดูคลิปบนหน้านี้เมื่อแอดมินเพิ่มแล้ว" },
  ];
  return [...fromDesc, ...extras].slice(0, 4);
}

/** สำเนาหน้าโฆษณา /try/{slug} — building-pos มีเนื้อหาเฉพาะ · โมดูลอื่นจากคำอธิบายการ์ด */
export function getModuleTryPromoCopy(slug: string, title: string): ModuleTryPromoCopy {
  if (slug === BUILDING_POS_MODULE_SLUG) {
    return {
      eyebrow: "Restaurant POS",
      tagline: "รับออเดอร์ · คิวครัว · QR สั่งที่โต๊ะ · จองออนไลน์ · การเงิน ในโมดูลเดียว",
      features: BUILDING_POS_TRY_FEATURES,
      defaultBanner: BUILDING_POS_TRY_BANNER,
      fallbackVideos: BUILDING_POS_TRY_VIDEOS.map((v) => ({
        id: v.id,
        title: v.title,
        hint: v.hint,
        href: v.href,
        thumb: v.thumb,
      })),
    };
  }

  const lines = dashboardModuleCardDescription(slug)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    eyebrow: "ทดลองใช้งาน",
    tagline: lines.join(" · ") || `ทดลอง ${title} บนแพลตฟอร์ม MAWELL`,
    features: featuresFromCardDescription(slug),
    defaultBanner: getDefaultModuleCoverImageUrl(slug) ?? GENERIC_BANNER,
    fallbackVideos: [],
  };
}
