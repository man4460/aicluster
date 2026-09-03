import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";
import { deriveEventStatus, mapClubEventRecord } from "@/systems/club-event/lib/mappers";
import { normalizeClubEventYoutubeEmbedUrl } from "@/systems/club-event/lib/youtube";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { scope } = await clubEventSessionContext(own.ownerId);

    const row = await prisma.clubEventRecord.findFirst({
      where: { id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
      include: {
        _count: { select: { gallery: true } },
        gallery: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!row) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });

    return NextResponse.json({
      event: mapClubEventRecord(row),
      gallery: row.gallery.map((g) => ({
        id: g.id,
        eventId: g.eventId,
        imageUrl: g.imageUrl,
        fileName: g.fileName,
        sortOrder: g.sortOrder,
      })),
    });
  } catch (e) {
    console.error("[club-event/session/events/[id] GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { scope } = await clubEventSessionContext(own.ownerId);
    const existing = await prisma.clubEventRecord.findFirst({
      where: { id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });

    const body = (await req.json()) as Record<string, unknown>;
    const eventDate =
      typeof body.eventDate === "string" ? new Date(body.eventDate) : existing.eventDate;
    if (Number.isNaN(eventDate.getTime())) {
      return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
    }

    const status =
      body.status === "UPCOMING" || body.status === "PAST" ? body.status : deriveEventStatus(eventDate);

    let youtubeEmbedUrl = existing.youtubeEmbedUrl;
    if (body.youtubeEmbedUrl === null || body.youtubeEmbedUrl === "") {
      youtubeEmbedUrl = null;
    } else if (typeof body.youtubeEmbedUrl === "string") {
      const normalized = normalizeClubEventYoutubeEmbedUrl(body.youtubeEmbedUrl);
      if (!normalized) {
        return NextResponse.json(
          { error: "ลิงก์ YouTube ไม่ถูกต้อง — วางจาก watch / youtu.be / embed ได้" },
          { status: 400 },
        );
      }
      youtubeEmbedUrl = normalized;
    }

    const row = await prisma.clubEventRecord.update({
      where: { id },
      data: {
        title: typeof body.title === "string" ? body.title.trim().slice(0, 200) : existing.title,
        eventDate,
        status,
        description: typeof body.description === "string" ? body.description : existing.description,
        youtubeEmbedUrl,
      },
      include: { _count: { select: { gallery: true } } },
    });

    return NextResponse.json({ event: mapClubEventRecord(row) });
  } catch (e) {
    console.error("[club-event/session/events/[id] PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { scope } = await clubEventSessionContext(own.ownerId);
    const existing = await prisma.clubEventRecord.findFirst({
      where: { id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });

    await prisma.clubEventRecord.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[club-event/session/events/[id] DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
