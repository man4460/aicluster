import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { lmsOwnerFromAuth } from "@/lib/lms/api-owner";
import { lmsOwnerWhere, lmsSessionContext } from "@/lib/lms/session-context";
import { prisma } from "@/lib/prisma";
import { mapLmsExam, mapLmsQuestion } from "@/systems/lms/lib/mappers";

type Ctx = { params: Promise<{ id: string }> };

type QuestionInput = {
  questionText: string;
  choices: string[];
  correctAnswer: string;
  orderIndex: number;
};

function parseQuestions(raw: unknown): QuestionInput[] | null {
  if (!Array.isArray(raw)) return null;
  const out: QuestionInput[] = [];
  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    if (!row || typeof row !== "object") return null;
    const r = row as Record<string, unknown>;
    const questionText = typeof r.questionText === "string" ? r.questionText.trim() : "";
    const choices = Array.isArray(r.choices)
      ? r.choices.filter((c): c is string => typeof c === "string").map((c) => c.slice(0, 500))
      : [];
    const correctAnswer =
      typeof r.correctAnswer === "string"
        ? r.correctAnswer
        : typeof r.correctAnswer === "number"
          ? String(r.correctAnswer)
          : "";
    if (!questionText || choices.length < 2 || !correctAnswer) return null;
    out.push({
      questionText,
      choices,
      correctAnswer: correctAnswer.slice(0, 200),
      orderIndex: typeof r.orderIndex === "number" ? Math.round(r.orderIndex) : i,
    });
  }
  return out;
}

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

    const exam = await prisma.lmsExam.findUnique({
      where: { courseId },
      include: { questions: { orderBy: { orderIndex: "asc" } } },
    });

    if (!exam) return NextResponse.json({ exam: null });

    return NextResponse.json({
      exam: {
        ...mapLmsExam(exam),
        questions: exam.questions.map((q) => mapLmsQuestion(q, true)),
      },
    });
  } catch (e) {
    console.error("[lms/session/courses/[id]/exam GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: Ctx) {
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
    const questions = parseQuestions(body.questions);
    if (!questions) {
      return NextResponse.json(
        { error: "คำถามต้องเป็นอาร์เรย์และมีตัวเลือกอย่างน้อย 2 ตัวพร้อมคำตอบถูก" },
        { status: 400 },
      );
    }

    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 200)
        : "แบบทดสอบท้ายคอร์ส";
    const passingScorePercent =
      typeof body.passingScorePercent === "number" && Number.isFinite(body.passingScorePercent)
        ? Math.min(100, Math.max(0, Math.round(body.passingScorePercent)))
        : 70;

    const exam = await prisma.$transaction(async (tx) => {
      const upserted = await tx.lmsExam.upsert({
        where: { courseId },
        create: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          courseId,
          title,
          passingScorePercent,
        },
        update: { title, passingScorePercent },
      });

      await tx.lmsQuestion.deleteMany({ where: { examId: upserted.id } });

      if (questions.length > 0) {
        await tx.lmsQuestion.createMany({
          data: questions.map((q) => ({
            ownerUserId: own.ownerId,
            trialSessionId: scope.trialSessionId,
            examId: upserted.id,
            questionText: q.questionText,
            choicesJson: JSON.stringify(q.choices),
            correctAnswer: q.correctAnswer,
            orderIndex: q.orderIndex,
          })),
        });
      }

      return tx.lmsExam.findUniqueOrThrow({
        where: { id: upserted.id },
        include: { questions: { orderBy: { orderIndex: "asc" } } },
      });
    });

    return NextResponse.json({
      exam: {
        ...mapLmsExam(exam),
        questions: exam.questions.map((q) => mapLmsQuestion(q, true)),
      },
    });
  } catch (e) {
    console.error("[lms/session/courses/[id]/exam PUT]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
