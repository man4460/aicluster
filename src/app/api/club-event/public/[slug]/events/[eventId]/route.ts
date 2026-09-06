import { NextResponse } from "next/server";
import { loadClubEventPublicEventDetail } from "@/lib/club-event/load-public-portal";

type Ctx = { params: Promise<{ slug: string; eventId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { slug, eventId } = await ctx.params;
    const url = new URL(req.url);
    const data = await loadClubEventPublicEventDetail(slug, eventId, url.searchParams.get("t"));
    if (!data) {
      return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("[club-event/public/[slug]/events/[eventId] GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
