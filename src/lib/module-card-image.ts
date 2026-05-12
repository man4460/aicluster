/** อนุญาตเฉพาะ path ใต้ public ที่ไม่มี .. — ป้องกัน open redirect / path traversal */
export function isSafeModuleCardImageUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== "string") return false;
  if (!url.startsWith("/")) return false;
  if (url.includes("..")) return false;
  if (url.length > 512) return false;
  return (
    url.startsWith("/uploads/module-cards/") ||
    url.startsWith("/images/module-cards/")
  );
}

const TRUSTED_UNSPLASH_HOST = "images.unsplash.com";

/** รูปปกค่าเริ่มจากแคตตาล็อก (เทียบ landing) — อนุญาตเฉพาะโฮสต์ Unsplash อย่างเดียว */
export function isTrustedUnsplashModuleCoverUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== "string") return false;
  if (url.length > 640 || url.includes("..")) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || u.hostname !== TRUSTED_UNSPLASH_HOST) return false;
    return u.pathname.startsWith("/photo-");
  } catch {
    return false;
  }
}

/** รูปที่แสดงบนการ์ดโมดูลได้: อัปโหลดภายในโปรเจกต์ หรือ Unsplash ที่ไว้ใจ */
export function isSafeModuleCardDisplayUrl(url: string | null | undefined): url is string {
  return isSafeModuleCardImageUrl(url) || isTrustedUnsplashModuleCoverUrl(url);
}
