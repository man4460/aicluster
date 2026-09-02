import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import {
  mapClubEventProfile,
  mapClubEventRecord,
  parseCommitteeJson,
  parseDynamicLinkConfig,
} from "@/systems/club-event/lib/mappers";

type Ctx = { params: Promise<{ slug: string }> };

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
    const { slug } = await ctx.params;
    const url = new URL(req.url);
    const trialSessionId = await resolvePublicTrialSessionId(slug, url.searchParams.get("t"));

    const profile = await prisma.clubEventProfile.findFirst({
      where: { slug, trialSessionId },
    });
    if (!profile) notFound();

    const [upcoming, past, links] = await Promise.all([
      prisma.clubEventRecord.findMany({
        where: { profileId: profile.id, status: "UPCOMING" },
        orderBy: { eventDate: "asc" },
        include: { _count: { select: { gallery: true } } },
        take: 20,
      }),
      prisma.clubEventRecord.findMany({
        where: { profileId: profile.id, status: "PAST" },
        orderBy: { eventDate: "desc" },
        include: {
          _count: { select: { gallery: true } },
          gallery: { orderBy: { sortOrder: "asc" }, take: 6 },
        },
        take: 12,
      }),
      prisma.clubEventDynamicLink.findMany({
        where: { profileId: profile.id, isActive: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      profile: mapClubEventProfile(profile),
      committee: parseCommitteeJson(profile.committeeJson),
      upcomingEvents: upcoming.map(mapClubEventRecord),
      pastEvents: past.map((e) => ({
        ...mapClubEventRecord(e),
        galleryPreview: e.gallery.map((g) => ({
          id: g.id,
          imageUrl: g.imageUrl,
          fileName: g.fileName,
        })),
      })),
      links: links.map((l) => ({
        id: l.id,
        type: l.type,
        title: l.title,
        config: parseDynamicLinkConfig(l.configJson),
        publicPath: `/club/${slug}/link/${l.id}`,
      })),
    });
  } catch (e) {
    console.error("[club-event/public/[slug] GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
