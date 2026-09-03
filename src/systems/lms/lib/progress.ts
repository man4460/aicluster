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
