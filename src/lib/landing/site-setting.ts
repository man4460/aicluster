import { prisma } from "@/lib/prisma";
import { resolveLandingBannerUrl } from "@/lib/landing/banner-url";

export const SITE_SETTING_DEFAULT_ID = "default";

export async function getLandingBannerUrl(): Promise<string> {
  try {
    const row = await prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_DEFAULT_ID },
      select: { landingBannerUrl: true },
    });
    return resolveLandingBannerUrl(row?.landingBannerUrl);
  } catch {
    return resolveLandingBannerUrl(null);
  }
}
