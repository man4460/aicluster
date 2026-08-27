import { NextResponse } from "next/server";
import {
  parseTryPromoVideosJson,
  toPublicTryPromoVideos,
} from "@/lib/modules/try-promo";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ slug: string }> };

/** สาธารณะ — หน้า /try/{slug} โหลดวิดีโอที่แอดมินตั้ง */
export async function GET(_req: Request, ctx: Ctx) {
  const { slug: raw } = await ctx.params;
  const slug = decodeURIComponent(raw).trim();
  if (!slug) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const mod = await prisma.appModule.findFirst({
    where: { slug, isActive: true },
    select: {
      slug: true,
      title: true,
      tryPromoVideosJson: true,
      tryPromoBannerUrl: true,
    },
  });
  if (!mod) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    slug: mod.slug,
    title: mod.title,
    bannerUrl: mod.tryPromoBannerUrl,
    videos: toPublicTryPromoVideos(parseTryPromoVideosJson(mod.tryPromoVideosJson)),
  });
}
