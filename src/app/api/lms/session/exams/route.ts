import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { lmsOwnerFromAuth } from "@/lib/lms/api-owner";
import { lmsOwnerWhere, lmsSessionContext } from "@/lib/lms/session-context";
import { prisma } from "@/lib/prisma";
import { mapLmsExam, stringifyChoices } from "@/systems/lms/lib/mappers";

export async function PUT(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { scope } = await lmsSessionContext(own.ownerId);
    const body = (await req.json()) as Record<string, unknown>;
    const courseId = typeof body.courseId === "string" ? body.courseId : "";
    if (!courseId) return NextResponse.json({ error: "ไม่พบคอร์ส" }, { status: 400 });

    const course = await prisma.lmsCourse.findFirst({
      where: { id: courseId, ...lmsOwnerWhere(own.ownerId, scope.trialSessionId) },
      select: { id: true },
    });
    if (!course) return NextResponse.json({ error: "ไม่พบคอร์ส" }, { status: 404 });

    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 200)
        : "แบบทดสอบท้ายคอร์ส";
    const passingScorePercent =
      typeof body.passingScorePercent === "number"
        ? Math.min(100, Math.max(0, Math.round(body.passingScorePercent)))
        : 70;

    const questionsRaw = Array.isArray(body.questions) ? body.questions : [];
    const questions = questionsRaw
      .map((q, idx) => {
        if (typeof q !== "object" || q === null) return null;
        const row = q as Record<string, unknown>;
        const questionText = typeof row.questionText === "string" ? row.questionText.trim() : "";
        const choices = Array.isArray(row.choices)
          ? row.choices.filter((c): c is string => typeof c === "string").map((c) => c.trim()).filter(Boolean)
          : [];
        while (choices.length < 4) choices.push("");
        const correctIndex =
          typeof row.correctIndex === "number" && row.correctIndex >= 0 && row.correctIndex < 4
            ? Math.round(row.correctIndex)
            : 0;
        if (!questionText || choices.filter(Boolean).length < 2) return null;
        return {
          questionText: questionText.slice(0, 2000),
          choicesJson: stringifyChoices(choices.slice(0, 4)),
          correctAnswer: String(correctIndex),
          orderIndex: idx,
        };
      })
      .filter((q): q is NonNullable<typeof q> => q != null);

    const exam = await prisma.$transaction(async (tx) => {
      const existing = await tx.lmsExam.findUnique({ where: { courseId } });
      let examId: string;
      if (existing) {
        await tx.lmsQuestion.deleteMany({ where: { examId: existing.id } });
        const updated = await tx.lmsExam.update({
          where: { id: existing.id },
          data: { title, passingScorePercent },
        });
        examId = updated.id;
      } else {
        const created = await tx.lmsExam.create({
          data: {
            ownerUserId: own.ownerId,
            trialSessionId: scope.trialSessionId,
            courseId,
            title,
            passingScorePercent,
          },
        });
        examId = created.id;
      }
      if (questions.length > 0) {
        await tx.lmsQuestion.createMany({
          data: questions.map((q) => ({
            ownerUserId: own.ownerId,
            trialSessionId: scope.trialSessionId,
            examId,
            ...q,
          })),
        });
      }
      return tx.lmsExam.findUniqueOrThrow({
        where: { id: examId },
        include: { questions: { orderBy: { orderIndex: "asc" } } },
      });
    });

    return NextResponse.json({ exam: mapLmsExam(exam) });
  } catch (e) {
    console.error("[lms/session/exams PUT]", e);
    return NextResponse.json({ error: "บันทึกข้อสอบไม่สำเร็จ" }, { status: 500 });
  }
}
