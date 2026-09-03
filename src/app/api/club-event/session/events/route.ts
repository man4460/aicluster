import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";
import { deriveEventStatus, mapClubEventRecord } from "@/systems/club-event/lib/mappers";
import {
  assertClubEventYoutubeCount,
  resolveClubEventMediaLimits,
} from "@/systems/club-event/lib/plan-limits";
import {
  normalizeClubEventYoutubeEmbedUrl,
  normalizeClubEventYoutubeVideosFromBody,
  serializeClubEventYoutubeVideos,
} from "@/systems/club-event/lib/youtube";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await clubEventSessionContext(own.ownerId);
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const limits = resolveClubEventMediaLimits(own.access);

    const rows = await prisma.clubEventRecord.findMany({
      where: {
        profileId: profile.id,
        ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId),
        ...(status === "UPCOMING" || status === "PAST" ? { status } : {}),
      },
      orderBy: { eventDate: status === "PAST" ? "desc" : "asc" },
      include: { _count: { select: { gallery: true } } },
    });

    return NextResponse.json({
      events: rows.map(mapClubEventRecord),
      mediaLimits: limits,
    });
  } catch (e) {
    console.error("[club-event/session/events GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await clubEventSessionContext(own.ownerId);
    const body = (await req.json()) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const eventDateRaw = typeof body.eventDate === "string" ? body.eventDate : "";
    if (!title || !eventDateRaw) {
      return NextResponse.json({ error: "กรอกชื่อและวันที่กิจกรรม" }, { status: 400 });
    }
    const eventDate = new Date(eventDateRaw);
    if (Number.isNaN(eventDate.getTime())) {
      return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
    }

    const yt = normalizeClubEventYoutubeVideosFromBody(body);
    if (!yt.ok) return NextResponse.json({ error: yt.error }, { status: 400 });

    const limits = resolveClubEventMediaLimits(own.access);
    const ytGate = assertClubEventYoutubeCount(yt.videos.length, limits);
    if (!ytGate.ok) {
      return NextResponse.json({ error: ytGate.error, code: ytGate.code }, { status: 403 });
    }

    const row = await prisma.clubEventRecord.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        profileId: profile.id,
        title: title.slice(0, 200),
        eventDate,
        status: deriveEventStatus(eventDate),
        description: typeof body.description === "string" ? body.description : "",
        youtubeEmbedUrl: yt.videos[0]
          ? normalizeClubEventYoutubeEmbedUrl(yt.videos[0].youtubeUrl)
          : null,
        youtubeUrlsJson: serializeClubEventYoutubeVideos(yt.videos),
      },
      include: { _count: { select: { gallery: true } } },
    });

    return NextResponse.json({ event: mapClubEventRecord(row), mediaLimits: limits });
  } catch (e) {
    console.error("[club-event/session/events POST]", e);
    return NextResponse.json({ error: "สร้างไม่สำเร็จ" }, { status: 500 });
  }
}
