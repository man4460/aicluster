import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { lmsOwnerFromAuth } from "@/lib/lms/api-owner";
import { lmsOwnerWhere, lmsSessionContext } from "@/lib/lms/session-context";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await lmsSessionContext(own.ownerId);
    const ow = lmsOwnerWhere(own.ownerId, scope.trialSessionId);

    const [courseCount, learnerCount, enrollments, finance, progressRows] = await Promise.all([
      prisma.lmsCourse.count({ where: { profileId: profile.id, ...ow } }),
      prisma.lmsLearner.count({ where: { profileId: profile.id, ...ow } }),
      prisma.lmsEnrollment.findMany({
        where: { ...ow, course: { profileId: profile.id } },
        select: { progressPercent: true, status: true },
      }),
      prisma.lmsFinanceTransaction.findMany({
        where: { profileId: profile.id, ...ow },
        select: { type: true, amountBaht: true },
      }),
      prisma.lmsEnrollment.findMany({
        where: { ...ow, course: { profileId: profile.id } },
        orderBy: [{ updatedAt: "desc" }],
        take: 16,
        select: {
          id: true,
          progressPercent: true,
          status: true,
          updatedAt: true,
          learner: { select: { fullName: true, username: true } },
          course: { select: { title: true } },
        },
      }),
    ]);

    const completed = enrollments.filter((e) => e.status === "COMPLETED").length;
    const completionRate =
      enrollments.length === 0 ? 0 : Math.round((completed / enrollments.length) * 100);
    const avgProgress =
      enrollments.length === 0
        ? 0
        : Math.round(enrollments.reduce((s, e) => s + e.progressPercent, 0) / enrollments.length);

    const income = finance.filter((r) => r.type === "INCOME").reduce((s, r) => s + r.amountBaht, 0);
    const expense = finance.filter((r) => r.type === "EXPENSE").reduce((s, r) => s + r.amountBaht, 0);

    return NextResponse.json({
      stats: {
        courseCount,
        learnerCount,
        enrollmentCount: enrollments.length,
        completionRate,
        avgProgress,
        income,
        expense,
        balance: income - expense,
      },
      progress: progressRows.map((row) => ({
        id: row.id,
        progressPercent: row.progressPercent,
        status: row.status,
        updatedAt: row.updatedAt.toISOString(),
        learnerName: row.learner.fullName || row.learner.username,
        learnerUsername: row.learner.username,
        courseTitle: row.course.title,
      })),
    });
  } catch (e) {
    console.error("[lms/session/summary GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
