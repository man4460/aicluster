import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api-auth";
import {
  normalizeTryPromoVideosFromAdmin,
  parseTryPromoVideosJson,
  serializeTryPromoVideos,
  toPublicTryPromoVideos,
  tryPromoVideoInputSchema,
} from "@/lib/modules/try-promo";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { slug: raw } = await ctx.params;
  const slug = decodeURIComponent(raw).trim();
  if (!slug) return NextResponse.json({ error: "ไม่พบโมดูล" }, { status: 404 });

  const mod = await prisma.appModule.findFirst({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      tryPromoVideosJson: true,
      tryPromoBannerUrl: true,
    },
  });
  if (!mod) return NextResponse.json({ error: "ไม่พบโมดูล" }, { status: 404 });

  const videos = toPublicTryPromoVideos(parseTryPromoVideosJson(mod.tryPromoVideosJson));
  return NextResponse.json({
    slug: mod.slug,
    title: mod.title,
    bannerUrl: mod.tryPromoBannerUrl,
    videos,
  });
}

const patchSchema = z.object({
  videos: z.array(tryPromoVideoInputSchema).max(24),
  bannerUrl: z.string().trim().max(512).nullable().optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { slug: raw } = await ctx.params;
  const slug = decodeURIComponent(raw).trim();
  if (!slug) return NextResponse.json({ error: "ไม่พบโมดูล" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลวิดีโอไม่ถูกต้อง" }, { status: 400 });
  }

  const normalized = normalizeTryPromoVideosFromAdmin(parsed.data.videos);
  if (!normalized.ok) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const exists = await prisma.appModule.findFirst({ where: { slug }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "ไม่พบโมดูล" }, { status: 404 });

  const data: { tryPromoVideosJson: string; tryPromoBannerUrl?: string | null } = {
    tryPromoVideosJson: serializeTryPromoVideos(normalized.videos),
  };
  if (parsed.data.bannerUrl !== undefined) {
    const b = parsed.data.bannerUrl?.trim() || null;
    data.tryPromoBannerUrl = b;
  }

  const updated = await prisma.appModule.update({
    where: { slug },
    data,
    select: {
      slug: true,
      title: true,
      tryPromoVideosJson: true,
      tryPromoBannerUrl: true,
    },
  });

  return NextResponse.json({
    slug: updated.slug,
    title: updated.title,
    bannerUrl: updated.tryPromoBannerUrl,
    videos: toPublicTryPromoVideos(parseTryPromoVideosJson(updated.tryPromoVideosJson)),
  });
}
