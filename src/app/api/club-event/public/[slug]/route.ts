import { NextResponse } from "next/server";
import { loadClubEventPublicPortal } from "@/lib/club-event/load-public-portal";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const url = new URL(req.url);
    const data = await loadClubEventPublicPortal(slug, url.searchParams.get("t"));
    if (!data) {
      return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("[club-event/public/[slug] GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
