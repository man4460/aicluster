import { LANDING_HERO_BANNER } from "@/app/landing/landing-media";
import { isTrustedUnsplashModuleCoverUrl } from "@/lib/module-card-image";

export function isSafeLandingUploadUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== "string") return false;
  if (!url.startsWith("/uploads/landing/")) return false;
  if (url.includes("..") || url.length > 512) return false;
  return true;
}

export function isSafeLandingBundledBannerUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== "string") return false;
  if (!url.startsWith("/images/landing/")) return false;
  if (url.includes("..") || url.length > 512) return false;
  return true;
}

export function isSafeLandingBannerDisplayUrl(url: string | null | undefined): url is string {
  return (
    isSafeLandingUploadUrl(url) ||
    isSafeLandingBundledBannerUrl(url) ||
    isTrustedUnsplashModuleCoverUrl(url)
  );
}

export function resolveLandingBannerUrl(stored: string | null | undefined): string {
  const t = stored?.trim();
  if (t && isSafeLandingBannerDisplayUrl(t)) return t;
  return LANDING_HERO_BANNER;
}
