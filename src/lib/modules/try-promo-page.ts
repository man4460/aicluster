import { dashboardModuleCardDescription } from "@/lib/modules/dashboard-card-descriptions";
import { getDefaultModuleCoverImageUrl } from "@/lib/modules/dashboard-module-cover-images";
import {
  getModuleTryPromoFeatures,
  getModuleTryPromoPack,
  type ModuleTryPromoFeature,
} from "@/lib/modules/try-promo-features";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import {
  BUILDING_POS_TRY_BANNER,
  BUILDING_POS_TRY_VIDEOS,
} from "@/systems/building-pos/lib/try-promo-content";

export type { ModuleTryPromoFeature };

const GENERIC_BANNER =
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1920&q=80";

export type ModuleTryPromoFallbackVideo = {
  id: string;
  title: string;
  hint: string;
  href: string;
  thumb: string;
};

export type ModuleTryPromoCopy = {
  eyebrow: string;
  /** หัวข้อสั้นใต้ชื่อโมดูล (hook จากแพ็ก) */
  tagline: string;
  /** ย่อหน้าขายใต้หัวข้อความสามารถ */
  pitch: string;
  features: ModuleTryPromoFeature[];
  defaultBanner: string;
  /** คลิปสำรองเมื่อแอดมินยังไม่ตั้ง (มีเฉพาะบางโมดูล เช่น building-pos) */
  fallbackVideos: ModuleTryPromoFallbackVideo[];
};

function featuresFromCardDescription(slug: string): ModuleTryPromoFeature[] {
  const catalog = getModuleTryPromoFeatures(slug);
  if (catalog && catalog.length > 0) return catalog;

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
  return [...fromDesc, ...extras];
}

function fallbackTagline(slug: string, title: string, features: ModuleTryPromoFeature[]): string {
  const pack = getModuleTryPromoPack(slug);
  if (pack?.hook) return pack.hook;

  const lines = dashboardModuleCardDescription(slug)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return (
    lines.join(" · ") ||
    features
      .slice(0, 3)
      .map((f) => f.title)
      .join(" · ") ||
    `ทดลอง ${title} บนแพลตฟอร์ม MAWELL`
  );
}

/** สำเนาหน้าโฆษณา /try/{slug} — ฟีเจอร์จากแคตตาล็อกความสามารถต่อโมดูล */
export function getModuleTryPromoCopy(slug: string, title: string): ModuleTryPromoCopy {
  const pack = getModuleTryPromoPack(slug);
  const features = featuresFromCardDescription(slug);
  const tagline = fallbackTagline(slug, title, features);
  const pitch =
    pack?.pitch ||
    `ทดลอง ${title} ในแดชบอร์ดจริง — ฟีเจอร์ด้านล่างมาจากเมนูใช้งานจริง ไม่แต่งเกินความสามารถในระบบ`;

  if (slug === BUILDING_POS_MODULE_SLUG) {
    return {
      eyebrow: "Restaurant POS",
      tagline: pack?.hook ?? "ระบบ POS ร้านอาหาร ครบจบในระบบเดียว — ออเดอร์ คิวครัว QR และจองโต๊ะ",
      pitch:
        pack?.pitch ??
        "รับออเดอร์หน้าร้าน ส่งครัวเรียลไทม์ ให้ลูกค้าสแกน QR สั่งที่โต๊ะ จองโต๊ะออนไลน์พร้อมมัดจำ ปิดบิลดูกราฟ และสะสมแต้มในโมดูลเดียว",
      features: getModuleTryPromoFeatures(slug) ?? features,
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

  return {
    eyebrow: "ทดลองใช้งาน",
    tagline,
    pitch,
    features,
    defaultBanner: getDefaultModuleCoverImageUrl(slug) ?? GENERIC_BANNER,
    fallbackVideos: [],
  };
}
