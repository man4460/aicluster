import {
  LANDING_DAILY_MODULE_SHOWCASE,
  LANDING_FREE_MODULE_SHOWCASE,
} from "@/app/landing/landing-module-showcase-data";
import { isSafeModuleCardImageUrl, isTrustedUnsplashModuleCoverUrl } from "@/lib/module-card-image";
import { SYSTEM_MAP_CATALOG_SLUG } from "@/lib/modules/system-map-catalog";

const SLUG_TO_COVER = new Map<string, string>();
for (const row of [...LANDING_FREE_MODULE_SHOWCASE, ...LANDING_DAILY_MODULE_SHOWCASE]) {
  SLUG_TO_COVER.set(row.slug, row.coverSrc);
}

/** รูปปกค่าเริ่มตาม slug — ชุดเดียวกับหน้า landing */
export function getDefaultModuleCoverImageUrl(slug: string): string | undefined {
  return SLUG_TO_COVER.get(slug);
}

const SYSTEM_MAP_FALLBACK_COVER =
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=900&q=78";

/**
 * รูปสำหรับการ์ดแดชบอร์ด: ใช้รูปจากแอดมิน (public path) ถ้ามีและปลอดภัย;
 * ไม่งั้นใช้รูปชุดเดียวกับ landing ตาม slug
 */
export function resolveModuleCardDisplayImageUrl(
  slug: string,
  cardImageUrl: string | null | undefined,
): string | null {
  if (cardImageUrl && isSafeModuleCardImageUrl(cardImageUrl)) return cardImageUrl;
  if (slug === SYSTEM_MAP_CATALOG_SLUG) return SYSTEM_MAP_FALLBACK_COVER;
  const fallback = getDefaultModuleCoverImageUrl(slug);
  if (fallback && isTrustedUnsplashModuleCoverUrl(fallback)) return fallback;
  return null;
}
