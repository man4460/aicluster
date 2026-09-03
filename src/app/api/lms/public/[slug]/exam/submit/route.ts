import { NextResponse } from "next/server";
import { readLmsLearnerSession } from "@/lib/lms/learner-session";
import { findLmsPublicProfile } from "@/lib/lms/public-profile";
import { prisma } from "@/lib/prisma";
import { mapLmsCertificate } from "@/systems/lms/lib/mappers";
import { generateLmsCertCode } from "@/systems/lms/lib/progress";

type Ctx = { params: Promise<{ slug: string }> };

function answersMatch(correct: string, given: unknown, choices: string[]): boolean {
  if (given == null) return false;
  const g = String(given).trim();
  const c = correct.trim();
  if (g === c) return true;
  const idx = Number.parseInt(g, 10);
  if (Number.isFinite(idx) && choices[idx] !== undefined) {
    return choices[idx] === c || String(idx) === c;
  }
  return false;
}

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
    const courseId = typeof body.courseId === "string" ? body.courseId : "";
    const answers =
      body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
        ? (body.answers as Record<string, unknown>)
        : null;
    if (!courseId || !answers) {
      return NextResponse.json({ error: "ส่งคำตอบแบบทดสอบให้ครบ" }, { status: 400 });
    }

    const enrollment = await prisma.lmsEnrollment.findUnique({
      where: {
        learnerId_courseId: { learnerId: session.learnerId, courseId },
      },
    });
    if (!enrollment) {
      return NextResponse.json({ error: "ยังไม่ได้ลงทะเบียนคอร์สนี้" }, { status: 403 });
    }

    const exam = await prisma.lmsExam.findUnique({
      where: { courseId },
      include: { questions: { orderBy: { orderIndex: "asc" } } },
    });
    if (!exam || exam.questions.length === 0) {
      return NextResponse.json({ error: "ยังไม่มีแบบทดสอบ" }, { status: 404 });
    }

    const lessons = await prisma.lmsLesson.findMany({
      where: { courseId },
      select: { id: true },
    });
    const completedCount = await prisma.lmsLessonProgress.count({
      where: {
        learnerId: session.learnerId,
        completed: true,
        lessonId: { in: lessons.map((l) => l.id) },
      },
    });
    if (lessons.length > 0 && completedCount < lessons.length) {
      return NextResponse.json(
        { error: "ต้องเรียนบทเรียนให้ครบก่อนทำแบบทดสอบ" },
        { status: 403 },
      );
    }

    let correct = 0;
    for (const q of exam.questions) {
      let choices: string[] = [];
      try {
        const parsed = JSON.parse(q.choicesJson) as unknown;
        if (Array.isArray(parsed)) {
          choices = parsed.filter((x): x is string => typeof x === "string");
        }
      } catch {
        choices = [];
      }
      if (answersMatch(q.correctAnswer, answers[q.id], choices)) correct += 1;
    }

    const scorePercent = Math.round((correct / exam.questions.length) * 100);
    const passed = scorePercent >= exam.passingScorePercent;

    let certificate = null;
    if (passed) {
      const result = await prisma.$transaction(async (tx) => {
        await tx.lmsEnrollment.update({
          where: { id: enrollment.id },
          data: {
            examScorePercent: scorePercent,
            progressPercent: 100,
            status: "COMPLETED",
            completedAt: enrollment.completedAt ?? new Date(),
          },
        });

        const existingCert = await tx.lmsCertificate.findUnique({
          where: {
            learnerId_courseId: { learnerId: session.learnerId, courseId },
          },
        });
        if (existingCert) return existingCert;

        return tx.lmsCertificate.create({
          data: {
            ownerUserId: profile.ownerUserId,
            trialSessionId: profile.trialSessionId,
            learnerId: session.learnerId,
            courseId,
            issueDate: new Date(),
            certCode: generateLmsCertCode(courseId, session.learnerId),
          },
        });
      });
      certificate = result;
    } else {
      await prisma.lmsEnrollment.update({
        where: { id: enrollment.id },
        data: { examScorePercent: scorePercent },
      });
    }

    return NextResponse.json({
      scorePercent,
      passed,
      passingScorePercent: exam.passingScorePercent,
      correct,
      total: exam.questions.length,
      certificate: certificate ? mapLmsCertificate(certificate) : null,
    });
  } catch (e) {
    console.error("[lms/public/[slug]/exam/submit POST]", e);
    return NextResponse.json({ error: "ส่งแบบทดสอบไม่สำเร็จ" }, { status: 500 });
  }
}
