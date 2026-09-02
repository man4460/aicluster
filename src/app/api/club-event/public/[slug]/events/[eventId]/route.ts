import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { mapClubEventRecord } from "@/systems/club-event/lib/mappers";

type Ctx = { params: Promise<{ slug: string; eventId: string }> };

async function resolvePublicTrialSessionId(slug: string, trialParam: string | null): Promise<string> {
  if (!trialParam) return TRIAL_PROD_SCOPE;
  const row = await prisma.clubEventProfile.findFirst({
    where: { slug, trialSessionId: trialParam },
    select: { trialSessionId: true },
  });
  if (!row) return TRIAL_PROD_SCOPE;
  const trial = await prisma.trialSession.findFirst({
    where: { id: trialParam, status: "ACTIVE", expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  return trial ? trialParam : TRIAL_PROD_SCOPE;
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { slug, eventId } = await ctx.params;
    const url = new URL(req.url);
    const trialSessionId = await resolvePublicTrialSessionId(slug, url.searchParams.get("t"));

    const profile = await prisma.clubEventProfile.findFirst({
      where: { slug, trialSessionId },
      select: { id: true },
    });
    if (!profile) notFound();

    const event = await prisma.clubEventRecord.findFirst({
      where: { id: eventId, profileId: profile.id },
      include: { gallery: { orderBy: { sortOrder: "asc" } } },
    });
    if (!event) notFound();

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
