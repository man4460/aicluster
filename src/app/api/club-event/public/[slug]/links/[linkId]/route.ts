import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findClubEventPublicProfile } from "@/lib/club-event/public-profile";
import { resolveClubLinkBundledAnnualDues } from "@/systems/club-event/lib/link-bundled-dues";
import { parseDynamicLinkConfig } from "@/systems/club-event/lib/mappers";

type Ctx = { params: Promise<{ slug: string; linkId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { slug, linkId } = await ctx.params;
    const url = new URL(req.url);
    const profile = await findClubEventPublicProfile(slug, url.searchParams.get("t"));
    if (!profile) {
      return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 404 });
    }

    const link = await prisma.clubEventDynamicLink.findFirst({
      where: { id: linkId, profileId: profile.id, isActive: true },
    });
    if (!link) {
      return NextResponse.json({ error: "ไม่พบลิงก์" }, { status: 404 });
    }

    const config = parseDynamicLinkConfig(link.configJson);
    let eventTitle: string | null = null;
    if (config.eventId) {
      const ev = await prisma.clubEventRecord.findFirst({
        where: { id: config.eventId, profileId: profile.id },
        select: { title: true },
      });
      eventTitle = ev?.title ?? null;
    }

    const bundledAnnualDues = resolveClubLinkBundledAnnualDues({
      linkAnnualDues: config.linkAnnualDues,
      profile: {
        duesEnabled: profile.duesEnabled,
        duesAmountBaht: profile.duesAmountBaht,
        duesPeriod: profile.duesPeriod,
      },
    });

    return NextResponse.json({
      ownerId: profile.ownerUserId,
      clubName: profile.displayName,
      paymentRulesNote: profile.paymentRulesNote ?? "",
      bundledAnnualDues,
      link: {
        id: link.id,
        type: link.type,
        title: link.title,
        config,
        eventTitle,
      },
    });
  } catch (e) {
    console.error("[club-event/public links GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
