import { NextResponse } from "next/server";
import { readLmsLearnerSession } from "@/lib/lms/learner-session";
import { findLmsPublicProfile } from "@/lib/lms/public-profile";
import { prisma } from "@/lib/prisma";
import {
  mapLmsCertificate,
  mapLmsCourse,
  mapLmsLesson,
  mapLmsLessonProgress,
  mapLmsQuestionPublic,
} from "@/systems/lms/lib/mappers";

type Ctx = { params: Promise<{ slug: string; courseId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { slug, courseId } = await ctx.params;
    const url = new URL(req.url);
    const session = await readLmsLearnerSession();
    if (!session || session.slug !== slug) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const profile = await findLmsPublicProfile(slug, url.searchParams.get("t"));
    if (!profile || profile.id !== session.profileId) {
      return NextResponse.json({ error: "ไม่พบสถาบัน" }, { status: 404 });
    }

    const enrollment = await prisma.lmsEnrollment.findFirst({
      where: { learnerId: session.learnerId, courseId },
      include: {
        course: {
          include: {
            lessons: { orderBy: { orderIndex: "asc" } },
            exam: { include: { questions: { orderBy: { orderIndex: "asc" } } } },
          },
        },
      },
    });
    if (!enrollment?.course) {
      return NextResponse.json({ error: "ไม่พบคอร์สหรือยังไม่ได้ลงทะเบียน" }, { status: 404 });
    }

    const lessonIds = enrollment.course.lessons.map((l) => l.id);
    const progresses = await prisma.lmsLessonProgress.findMany({
      where: { learnerId: session.learnerId, lessonId: { in: lessonIds } },
    });

    const allLessonsCompleted =
      lessonIds.length > 0 &&
      lessonIds.every((id) => progresses.some((p) => p.lessonId === id && p.completed));

    const certificate = await prisma.lmsCertificate.findUnique({
      where: {
        learnerId_courseId: { learnerId: session.learnerId, courseId },
      },
    });

    const exam = enrollment.course.exam;

    return NextResponse.json({
      course: mapLmsCourse(enrollment.course),
      enrollment: {
        id: enrollment.id,
        progressPercent: enrollment.progressPercent,
        status: enrollment.status,
        examScorePercent: enrollment.examScorePercent,
        completedAt: enrollment.completedAt?.toISOString() ?? null,
      },
      lessons: enrollment.course.lessons.map(mapLmsLesson),
      progress: progresses.map(mapLmsLessonProgress),
      examUnlocked: allLessonsCompleted,
      exam: exam
        ? {
            id: exam.id,
            courseId: exam.courseId,
            title: exam.title,
            passingScorePercent: exam.passingScorePercent,
            questions: exam.questions.map(mapLmsQuestionPublic),
          }
        : null,
      certificate: certificate ? mapLmsCertificate(certificate) : null,
    });
  } catch (e) {
    console.error("[lms/public/[slug]/courses/[courseId] GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
