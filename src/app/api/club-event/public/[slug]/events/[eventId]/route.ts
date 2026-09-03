import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findClubEventPublicProfile } from "@/lib/club-event/public-profile";
import { mapClubEventRecord } from "@/systems/club-event/lib/mappers";

type Ctx = { params: Promise<{ slug: string; eventId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { slug, eventId } = await ctx.params;
    const url = new URL(req.url);
    const profile = await findClubEventPublicProfile(slug, url.searchParams.get("t"));
    if (!profile) {
      return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 404 });
    }

    const event = await prisma.clubEventRecord.findFirst({
      where: { id: eventId, profileId: profile.id },
      include: { gallery: { orderBy: { sortOrder: "asc" } } },
    });
    if (!event) {
      return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });
    }

    return NextResponse.json({
      event: mapClubEventRecord(event),
      gallery: event.gallery.map((g) => ({
        id: g.id,
        imageUrl: g.imageUrl,
        fileName: g.fileName,
        sortOrder: g.sortOrder,
      })),
    });
  } catch (e) {
    console.error("[club-event/public/[slug]/events/[eventId] GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
