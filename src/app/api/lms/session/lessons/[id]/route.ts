import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { lmsOwnerFromAuth } from "@/lib/lms/api-owner";
import { lmsOwnerWhere, lmsSessionContext } from "@/lib/lms/session-context";
import { prisma } from "@/lib/prisma";
import { mapLmsLesson } from "@/systems/lms/lib/mappers";
import { normalizeLmsYoutubeEmbedUrl } from "@/systems/lms/lib/youtube";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { id } = await ctx.params;
    const { scope } = await lmsSessionContext(own.ownerId);
    const existing = await prisma.lmsLesson.findFirst({
      where: { id, ...lmsOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบบทเรียน" }, { status: 404 });
    const body = (await req.json()) as Record<string, unknown>;

    if (body.swapWithId && typeof body.swapWithId === "string") {
      const other = await prisma.lmsLesson.findFirst({
        where: {
          id: body.swapWithId,
          courseId: existing.courseId,
          ...lmsOwnerWhere(own.ownerId, scope.trialSessionId),
        },
      });
      if (!other) return NextResponse.json({ error: "สลับลำดับไม่สำเร็จ" }, { status: 400 });
      await prisma.$transaction([
        prisma.lmsLesson.update({ where: { id: existing.id }, data: { orderIndex: other.orderIndex } }),
        prisma.lmsLesson.update({ where: { id: other.id }, data: { orderIndex: existing.orderIndex } }),
      ]);
      const refreshed = await prisma.lmsLesson.findUniqueOrThrow({ where: { id } });
      return NextResponse.json({ lesson: mapLmsLesson(refreshed) });
    }

    let youtubeUrl = existing.youtubeUrl;
    if (typeof body.youtubeUrl === "string") {
      const normalized = normalizeLmsYoutubeEmbedUrl(body.youtubeUrl);
      if (!normalized) return NextResponse.json({ error: "ลิงก์ YouTube ไม่ถูกต้อง" }, { status: 400 });
      youtubeUrl = normalized.slice(0, 512);
    }

    const row = await prisma.lmsLesson.update({
      where: { id },
      data: {
        title: typeof body.title === "string" ? body.title.trim().slice(0, 200) : existing.title,
        youtubeUrl,
        durationSec:
          typeof body.durationSec === "number"
            ? Math.max(0, Math.round(body.durationSec))
            : existing.durationSec,
        orderIndex: typeof body.orderIndex === "number" ? Math.round(body.orderIndex) : existing.orderIndex,
      },
    });
    return NextResponse.json({ lesson: mapLmsLesson(row) });
  } catch (e) {
    console.error("[lms/session/lessons PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { id } = await ctx.params;
    const { scope } = await lmsSessionContext(own.ownerId);
    const existing = await prisma.lmsLesson.findFirst({
      where: { id, ...lmsOwnerWhere(own.ownerId, scope.trialSessionId) },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบบทเรียน" }, { status: 404 });
    await prisma.lmsLesson.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[lms/session/lessons DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
