import { NextResponse } from "next/server";
import { readLmsLearnerSession } from "@/lib/lms/learner-session";
import { findLmsPublicProfile } from "@/lib/lms/public-profile";
import { prisma } from "@/lib/prisma";
import { mapLmsEnrollment, mapLmsLessonProgress } from "@/systems/lms/lib/mappers";
import { recomputeLmsEnrollmentProgress } from "@/systems/lms/lib/progress";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const url = new URL(req.url);
    const session = await readLmsLearnerSession();
    if (!session || session.slug !== slug) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const profile = await findLmsPublicProfile(slug, url.searchParams.get("t"));
    if (!profile || profile.id !== session.profileId) {
      return NextResponse.json({ error: "ไม่พบสถาบัน" }, { status: 404 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const lessonId = typeof body.lessonId === "string" ? body.lessonId : "";
    if (!lessonId) {
      return NextResponse.json({ error: "ระบุบทเรียน" }, { status: 400 });
    }

    const lesson = await prisma.lmsLesson.findFirst({
      where: { id: lessonId, course: { profileId: profile.id } },
    });
    if (!lesson) {
      return NextResponse.json({ error: "ไม่พบบทเรียน" }, { status: 404 });
    }

    const enrollment = await prisma.lmsEnrollment.findUnique({
      where: {
        learnerId_courseId: { learnerId: session.learnerId, courseId: lesson.courseId },
      },
    });
    if (!enrollment) {
      return NextResponse.json({ error: "ยังไม่ได้ลงทะเบียนคอร์สนี้" }, { status: 403 });
    }

    const watchedPercent =
      typeof body.watchedPercent === "number" && Number.isFinite(body.watchedPercent)
        ? Math.min(100, Math.max(0, Math.round(body.watchedPercent)))
        : 0;
    const completed =
      typeof body.completed === "boolean" ? body.completed : watchedPercent >= 90;

    const existingProgress = await prisma.lmsLessonProgress.findUnique({
      where: {
        learnerId_lessonId: { learnerId: session.learnerId, lessonId },
      },
    });

    const nextWatched = Math.max(existingProgress?.watchedPercent ?? 0, watchedPercent);
    const nextCompleted = Boolean(existingProgress?.completed || completed);

    const progress = await prisma.lmsLessonProgress.upsert({
      where: {
        learnerId_lessonId: { learnerId: session.learnerId, lessonId },
      },
      create: {
        ownerUserId: profile.ownerUserId,
        trialSessionId: profile.trialSessionId,
        learnerId: session.learnerId,
        lessonId,
        watchedPercent: nextWatched,
        completed: nextCompleted,
      },
      update: {
        watchedPercent: nextWatched,
        completed: nextCompleted,
      },
    });

    const updatedEnrollment = await recomputeLmsEnrollmentProgress({
      ownerUserId: profile.ownerUserId,
      trialSessionId: profile.trialSessionId,
      learnerId: session.learnerId,
      courseId: lesson.courseId,
    });

    return NextResponse.json({
      progress: mapLmsLessonProgress(progress),
      enrollment: updatedEnrollment ? mapLmsEnrollment(updatedEnrollment) : null,
    });
  } catch (e) {
    console.error("[lms/public/[slug]/progress POST]", e);
    return NextResponse.json({ error: "บันทึกความคืบหน้าไม่สำเร็จ" }, { status: 500 });
  }
}
