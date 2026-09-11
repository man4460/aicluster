import { prisma } from "@/lib/prisma";

/** คำนวณ % ความคืบหน้าจากบทเรียนที่ทำครบ แล้วอัปเดต enrollment */
export async function recomputeLmsEnrollmentProgress(opts: {
  ownerUserId: string;
  trialSessionId: string;
  learnerId: string;
  courseId: string;
}) {
  const [lessonCount, completedCount, enrollment] = await Promise.all([
    prisma.lmsLesson.count({ where: { courseId: opts.courseId } }),
    prisma.lmsLessonProgress.count({
      where: {
        learnerId: opts.learnerId,
        completed: true,
        lesson: { courseId: opts.courseId },
      },
    }),
    prisma.lmsEnrollment.findUnique({
      where: {
        learnerId_courseId: { learnerId: opts.learnerId, courseId: opts.courseId },
      },
    }),
  ]);

  if (!enrollment) return null;

  const progressPercent =
    lessonCount <= 0 ? 0 : Math.min(100, Math.round((completedCount / lessonCount) * 100));

  let status = enrollment.status;
  if (status !== "COMPLETED") {
    status = progressPercent > 0 ? "IN_PROGRESS" : "ENROLLED";
  }

  return prisma.lmsEnrollment.update({
    where: { id: enrollment.id },
    data: {
      progressPercent,
      status,
    },
  });
}

export function generateLmsCertCode(courseId: string, learnerId: string): string {
  const stamp = Date.now().toString(36).toUpperCase();
  return `LMS-${courseId.slice(0, 4).toUpperCase()}-${learnerId.slice(0, 4).toUpperCase()}-${stamp}`.slice(
    0,
    64,
  );
}

/**
 * ออกใบประกาศให้นักเรียนที่สถานะ COMPLETED (ถ้ายังไม่มี)
 * วันที่บนใบ = วันที่จบหลักสูตร (completedAt)
 */
export async function ensureLmsCertificateForCompletion(opts: {
  ownerUserId: string;
  trialSessionId: string;
  learnerId: string;
  courseId: string;
  /** ถ้าไม่ส่ง จะใช้ enrollment.completedAt หรือตอนนี้ */
  completedAt?: Date | null;
}) {
  const existing = await prisma.lmsCertificate.findUnique({
    where: {
      learnerId_courseId: { learnerId: opts.learnerId, courseId: opts.courseId },
    },
  });
  if (existing) return existing;

  const enrollment = await prisma.lmsEnrollment.findUnique({
    where: {
      learnerId_courseId: { learnerId: opts.learnerId, courseId: opts.courseId },
    },
  });
  if (!enrollment || enrollment.status !== "COMPLETED") return null;

  const completedAt = opts.completedAt ?? enrollment.completedAt ?? new Date();

  if (!enrollment.completedAt) {
    await prisma.lmsEnrollment.update({
      where: { id: enrollment.id },
      data: { completedAt },
    });
  }

  return prisma.lmsCertificate.create({
    data: {
      ownerUserId: opts.ownerUserId,
      trialSessionId: opts.trialSessionId,
      learnerId: opts.learnerId,
      courseId: opts.courseId,
      issueDate: completedAt,
      certCode: generateLmsCertCode(opts.courseId, opts.learnerId),
    },
  });
}

/** ออกใบประกาศให้ครบทุกคอร์สที่เรียนจบของนักเรียนคนนั้น */
export async function ensureLmsCertificatesForCompletedEnrollments(opts: {
  ownerUserId: string;
  trialSessionId: string;
  learnerId: string;
}) {
  const completed = await prisma.lmsEnrollment.findMany({
    where: { learnerId: opts.learnerId, status: "COMPLETED" },
    select: { courseId: true, completedAt: true },
  });
  const certs = [];
  for (const e of completed) {
    const cert = await ensureLmsCertificateForCompletion({
      ownerUserId: opts.ownerUserId,
      trialSessionId: opts.trialSessionId,
      learnerId: opts.learnerId,
      courseId: e.courseId,
      completedAt: e.completedAt,
    });
    if (cert) certs.push(cert);
  }
  return certs;
}
