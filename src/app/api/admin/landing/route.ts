import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { SITE_SETTING_DEFAULT_ID } from "@/lib/landing/site-setting";
import { isSafeLandingUploadUrl, resolveLandingBannerUrl } from "@/lib/landing/banner-url";

async function readSetting() {
  return prisma.siteSetting.upsert({
    where: { id: SITE_SETTING_DEFAULT_ID },
    create: { id: SITE_SETTING_DEFAULT_ID },
    update: {},
    select: { landingBannerUrl: true },
  });
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const row = await readSetting();
  const stored = row.landingBannerUrl;
  return NextResponse.json({
    landingBannerUrl: stored && isSafeLandingUploadUrl(stored) ? stored : null,
    displayUrl: resolveLandingBannerUrl(stored),
  });
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const body = (await req.json().catch(() => null)) as { landingBannerUrl?: string | null } | null;
  const nextUrl =
    typeof body?.landingBannerUrl === "string" && body.landingBannerUrl.trim()
      ? body.landingBannerUrl.trim()
      : null;
  if (nextUrl && !isSafeLandingUploadUrl(nextUrl)) {
    return NextResponse.json({ error: "URL รูปไม่ถูกต้อง" }, { status: 400 });
  }

  const row = await prisma.siteSetting.upsert({
    where: { id: SITE_SETTING_DEFAULT_ID },
    create: { id: SITE_SETTING_DEFAULT_ID, landingBannerUrl: nextUrl },
    update: { landingBannerUrl: nextUrl },
    select: { landingBannerUrl: true },
  });

  return NextResponse.json({
    landingBannerUrl: row.landingBannerUrl,
    displayUrl: resolveLandingBannerUrl(row.landingBannerUrl),
  });
}
