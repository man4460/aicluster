import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { lmsOwnerFromAuth } from "@/lib/lms/api-owner";
import { lmsOwnerWhere, lmsSessionContext } from "@/lib/lms/session-context";
import { prisma } from "@/lib/prisma";
import { mapLmsLesson } from "@/systems/lms/lib/mappers";
import { normalizeLmsYoutubeEmbedUrl } from "@/systems/lms/lib/youtube";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id: courseId } = await ctx.params;
    const { scope } = await lmsSessionContext(own.ownerId);
    const course = await prisma.lmsCourse.findFirst({
      where: { id: courseId, ...lmsOwnerWhere(own.ownerId, scope.trialSessionId) },
      select: { id: true },
    });
    if (!course) return NextResponse.json({ error: "ไม่พบคอร์ส" }, { status: 404 });

    const lessons = await prisma.lmsLesson.findMany({
      where: { courseId, ...lmsOwnerWhere(own.ownerId, scope.trialSessionId) },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({ lessons: lessons.map(mapLmsLesson) });
  } catch (e) {
    console.error("[lms/session/courses/[id]/lessons GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id: courseId } = await ctx.params;
    const { scope } = await lmsSessionContext(own.ownerId);
    const course = await prisma.lmsCourse.findFirst({
      where: { id: courseId, ...lmsOwnerWhere(own.ownerId, scope.trialSessionId) },
      select: { id: true },
    });
    if (!course) return NextResponse.json({ error: "ไม่พบคอร์ส" }, { status: 404 });

    const body = (await req.json()) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const youtubeRaw = typeof body.youtubeUrl === "string" ? body.youtubeUrl : "";
    const youtubeUrl = normalizeLmsYoutubeEmbedUrl(youtubeRaw);
    if (!title) return NextResponse.json({ error: "กรอกชื่อบทเรียน" }, { status: 400 });
    if (!youtubeUrl) return NextResponse.json({ error: "ลิงก์ YouTube ไม่ถูกต้อง" }, { status: 400 });

    const maxOrder = await prisma.lmsLesson.aggregate({
      where: { courseId },
      _max: { orderIndex: true },
    });
    const orderIndex =
      typeof body.orderIndex === "number" && Number.isFinite(body.orderIndex)
        ? Math.round(body.orderIndex)
        : (maxOrder._max.orderIndex ?? -1) + 1;

    const row = await prisma.lmsLesson.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        courseId,
        title: title.slice(0, 200),
        youtubeUrl,
        durationSec:
          typeof body.durationSec === "number" && Number.isFinite(body.durationSec)
            ? Math.max(0, Math.round(body.durationSec))
            : 0,
        orderIndex,
      },
    });

    return NextResponse.json({ lesson: mapLmsLesson(row) });
  } catch (e) {
    console.error("[lms/session/courses/[id]/lessons POST]", e);
    return NextResponse.json({ error: "สร้างไม่สำเร็จ" }, { status: 500 });
  }
}
