import { NextResponse } from "next/server";
import { findLmsPublicProfile } from "@/lib/lms/public-profile";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const url = new URL(req.url);
    const profile = await findLmsPublicProfile(slug, url.searchParams.get("t"));
    if (!profile) {
      return NextResponse.json({ error: "ไม่พบสถาบัน" }, { status: 404 });
    }

    return NextResponse.json({
      institute: {
        slug: profile.slug,
        displayName: profile.displayName,
        logoUrl: profile.logoUrl,
        tagline: profile.tagline,
      },
    });
  } catch (e) {
    console.error("[lms/public/[slug] GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
