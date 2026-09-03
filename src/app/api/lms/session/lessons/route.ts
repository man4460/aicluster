import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { lmsOwnerFromAuth } from "@/lib/lms/api-owner";
import { lmsOwnerWhere, lmsSessionContext } from "@/lib/lms/session-context";
import { prisma } from "@/lib/prisma";
import { mapLmsLesson } from "@/systems/lms/lib/mappers";
import { normalizeLmsYoutubeEmbedUrl } from "@/systems/lms/lib/youtube";

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { scope } = await lmsSessionContext(own.ownerId);
    const body = (await req.json()) as Record<string, unknown>;
    const courseId = typeof body.courseId === "string" ? body.courseId : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const youtubeRaw = typeof body.youtubeUrl === "string" ? body.youtubeUrl : "";
    const youtubeUrl = normalizeLmsYoutubeEmbedUrl(youtubeRaw);
    if (!courseId || !title || !youtubeUrl) {
      return NextResponse.json({ error: "กรอกชื่อบทเรียนและลิงก์ YouTube ที่ถูกต้อง" }, { status: 400 });
    }
    const course = await prisma.lmsCourse.findFirst({
      where: { id: courseId, ...lmsOwnerWhere(own.ownerId, scope.trialSessionId) },
      select: { id: true },
    });
    if (!course) return NextResponse.json({ error: "ไม่พบคอร์ส" }, { status: 404 });

    const maxOrder = await prisma.lmsLesson.aggregate({
      where: { courseId },
      _max: { orderIndex: true },
    });
    const orderIndex =
      typeof body.orderIndex === "number" ? Math.round(body.orderIndex) : (maxOrder._max.orderIndex ?? -1) + 1;

    const row = await prisma.lmsLesson.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        courseId,
        title: title.slice(0, 200),
        youtubeUrl: youtubeUrl.slice(0, 512),
        durationSec: typeof body.durationSec === "number" ? Math.max(0, Math.round(body.durationSec)) : 0,
        orderIndex,
      },
    });
    return NextResponse.json({ lesson: mapLmsLesson(row) });
  } catch (e) {
    console.error("[lms/session/lessons POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
