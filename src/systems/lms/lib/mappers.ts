import type {
  LmsCertificate,
  LmsCourse,
  LmsCourseStatus,
  LmsEnrollment,
  LmsEnrollmentStatus,
  LmsExam,
  LmsFinanceTransaction,
  LmsFinanceType,
  LmsLearner,
  LmsLesson,
  LmsLessonProgress,
  LmsProfile,
  LmsQuestion,
} from "@/generated/prisma/client";

export const LMS_COURSE_STATUS_LABELS: Record<LmsCourseStatus, string> = {
  DRAFT: "แบบร่าง",
  PUBLISHED: "เผยแพร่",
};

export const LMS_ENROLLMENT_STATUS_LABELS: Record<LmsEnrollmentStatus, string> = {
  ENROLLED: "ลงทะเบียนแล้ว",
  IN_PROGRESS: "กำลังเรียน",
  COMPLETED: "เรียนจบ",
};

export const LMS_FINANCE_TYPE_LABELS: Record<LmsFinanceType, string> = {
  INCOME: "รายรับ",
  EXPENSE: "รายจ่าย",
};

export type LmsFinanceCategory = {
  id: string;
  name: string;
  type: LmsFinanceType;
};

export function parseLmsFinanceCategoriesJson(raw: string): LmsFinanceCategory[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is LmsFinanceCategory =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as LmsFinanceCategory).id === "string" &&
        typeof (row as LmsFinanceCategory).name === "string" &&
        ((row as LmsFinanceCategory).type === "INCOME" || (row as LmsFinanceCategory).type === "EXPENSE"),
    );
  } catch {
    return [];
  }
}

export const DEFAULT_LMS_FINANCE_CATEGORIES: LmsFinanceCategory[] = [
  { id: "inc-course", name: "ค่าคอร์ส", type: "INCOME" },
  { id: "inc-other", name: "รายรับอื่น", type: "INCOME" },
  { id: "exp-content", name: "ผลิตคอนเทนต์", type: "EXPENSE" },
  { id: "exp-ads", name: "โฆษณา", type: "EXPENSE" },
  { id: "exp-tool", name: "เครื่องมือ/ซอฟต์แวร์", type: "EXPENSE" },
  { id: "exp-other", name: "รายจ่ายอื่น", type: "EXPENSE" },
];

export function sanitizeLmsFinanceCategories(input: unknown): LmsFinanceCategory[] | null {
  if (!Array.isArray(input)) return null;
  const out: LmsFinanceCategory[] = [];
  for (const row of input) {
    if (
      typeof row !== "object" ||
      row === null ||
      typeof (row as LmsFinanceCategory).id !== "string" ||
      typeof (row as LmsFinanceCategory).name !== "string"
    ) {
      continue;
    }
    const type = (row as LmsFinanceCategory).type;
    if (type !== "INCOME" && type !== "EXPENSE") continue;
    const name = (row as LmsFinanceCategory).name.trim().slice(0, 120);
    const id = (row as LmsFinanceCategory).id.trim().slice(0, 64);
    if (!name || !id) continue;
    out.push({ id, name, type });
  }
  return out.slice(0, 80);
}

export type LmsProfileDto = ReturnType<typeof mapLmsProfile>;
export type LmsCourseDto = ReturnType<typeof mapLmsCourse>;
export type LmsLessonDto = ReturnType<typeof mapLmsLesson>;
export type LmsLearnerDto = ReturnType<typeof mapLmsLearner>;
export type LmsEnrollmentDto = ReturnType<typeof mapLmsEnrollment>;
export type LmsExamDto = ReturnType<typeof mapLmsExam>;
export type LmsFinanceDto = ReturnType<typeof mapLmsFinance>;
export type LmsCertificateDto = ReturnType<typeof mapLmsCertificate>;

export function stringifyChoices(choices: string[]): string {
  return JSON.stringify(choices.map((c) => String(c ?? "").slice(0, 500)));
}

export function parseChoicesJson(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === "string");
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function correctIndexFromAnswer(correctAnswer: string, choices: string[]): number {
  const asNum = Number.parseInt(correctAnswer, 10);
  if (Number.isFinite(asNum) && asNum >= 0 && asNum < choices.length) return asNum;
  const idx = choices.findIndex((c) => c === correctAnswer);
  return idx >= 0 ? idx : 0;
}

export function mapLmsProfile(p: LmsProfile) {
  const cats = parseLmsFinanceCategoriesJson(p.financeCategoriesJson ?? "[]");
  return {
    id: p.id,
    slug: p.slug,
    displayName: p.displayName,
    logoUrl: p.logoUrl,
    tagline: p.tagline,
    address: p.address,
    contactPhone: p.contactPhone,
    contactLine: p.contactLine,
    certSignerName: p.certSignerName,
    certSignatureUrl: p.certSignatureUrl,
    certTemplateNote: p.certTemplateNote,
    promptPayPhone: p.promptPayPhone,
    promptPayQrImageUrl: p.promptPayQrImageUrl,
    bankName: p.bankName,
    bankAccountNumber: p.bankAccountNumber,
    bankAccountName: p.bankAccountName,
    taxId: p.taxId,
    slipPaperSize: p.slipPaperSize,
    financeCategories: cats.length > 0 ? cats : DEFAULT_LMS_FINANCE_CATEGORIES,
    publicUrl: `/lms/${p.slug}`,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function mapLmsCourse(
  c: LmsCourse & { _count?: { lessons?: number; enrollments?: number }; exam?: { id: string } | null },
) {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    coverImageUrl: c.coverImageUrl,
    status: c.status,
    priceBaht: c.priceBaht,
    lessonCount: c._count?.lessons ?? 0,
    enrollmentCount: c._count?.enrollments ?? 0,
    hasExam: Boolean(c.exam),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export function mapLmsLesson(l: LmsLesson) {
  return {
    id: l.id,
    courseId: l.courseId,
    title: l.title,
    youtubeUrl: l.youtubeUrl,
    durationSec: l.durationSec,
    orderIndex: l.orderIndex,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

export function mapLmsLearner(
  l: LmsLearner & {
    enrollments?: (LmsEnrollment & { course?: Pick<LmsCourse, "title"> | null })[];
  },
) {
  return {
    id: l.id,
    username: l.username,
    fullName: l.fullName,
    email: l.email,
    phone: l.phone,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    enrollments: (l.enrollments ?? []).map((en) => ({
      id: en.id,
      courseId: en.courseId,
      courseTitle: en.course?.title ?? "",
      progressPercent: en.progressPercent,
      status: en.status,
    })),
  };
}

export function mapLmsEnrollment(
  e: LmsEnrollment & {
    learner?: LmsLearner;
    course?: Pick<LmsCourse, "title"> | LmsCourse | null;
  },
) {
  const courseTitle = e.course?.title;
  const fullCourse =
    e.course && "id" in e.course && "status" in e.course ? mapLmsCourse(e.course as LmsCourse) : undefined;

  return {
    id: e.id,
    learnerId: e.learnerId,
    courseId: e.courseId,
    progressPercent: e.progressPercent,
    status: e.status,
    examScorePercent: e.examScorePercent,
    enrolledAt: e.enrolledAt.toISOString(),
    completedAt: e.completedAt?.toISOString() ?? null,
    updatedAt: e.updatedAt.toISOString(),
    courseTitle,
    learner: e.learner ? mapLmsLearner(e.learner) : undefined,
    course: fullCourse,
  };
}

export function mapLmsLessonProgress(p: LmsLessonProgress) {
  return {
    id: p.id,
    learnerId: p.learnerId,
    lessonId: p.lessonId,
    watchedPercent: p.watchedPercent,
    completed: p.completed,
    updatedAt: p.updatedAt.toISOString(),
  };
}

export type LmsExamQuestionDto = {
  id: string;
  examId: string;
  questionText: string;
  choices: string[];
  orderIndex: number;
  correctIndex: number;
  correctAnswer: string;
};

export function mapLmsQuestionAdmin(q: LmsQuestion): LmsExamQuestionDto {
  const choices = parseChoicesJson(q.choicesJson);
  return {
    id: q.id,
    examId: q.examId,
    questionText: q.questionText,
    choices,
    orderIndex: q.orderIndex,
    correctIndex: correctIndexFromAnswer(q.correctAnswer, choices),
    correctAnswer: q.correctAnswer,
  };
}

export function mapLmsQuestionPublic(q: LmsQuestion) {
  const choices = parseChoicesJson(q.choicesJson);
  return {
    id: q.id,
    examId: q.examId,
    questionText: q.questionText,
    choices,
    orderIndex: q.orderIndex,
  };
}

/** Admin default — มี correctIndex */
export function mapLmsQuestion(q: LmsQuestion, includeCorrect = true) {
  if (!includeCorrect) return mapLmsQuestionPublic(q);
  return mapLmsQuestionAdmin(q);
}

export function mapLmsExam(e: LmsExam & { questions?: LmsQuestion[] }) {
  return {
    id: e.id,
    courseId: e.courseId,
    title: e.title,
    passingScorePercent: e.passingScorePercent,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    questions: (e.questions ?? []).map(mapLmsQuestionAdmin),
  };
}

export function mapLmsCertificate(
  c: LmsCertificate & { learner?: LmsLearner; course?: LmsCourse },
) {
  return {
    id: c.id,
    learnerId: c.learnerId,
    courseId: c.courseId,
    issueDate: c.issueDate.toISOString(),
    certCode: c.certCode,
    createdAt: c.createdAt.toISOString(),
    learner: c.learner ? mapLmsLearner(c.learner) : undefined,
    course: c.course ? mapLmsCourse(c.course) : undefined,
  };
}

export function mapLmsFinance(r: LmsFinanceTransaction) {
  return {
    id: r.id,
    type: r.type,
    category: r.category,
    amountBaht: r.amountBaht,
    transactedAt: r.transactedAt.toISOString(),
    note: r.note,
    slipUrl: r.slipUrl,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
