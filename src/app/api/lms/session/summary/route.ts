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

    const [courseCount, learnerCount, enrollments, finance] = await Promise.all([
      prisma.lmsCourse.count({ where: { profileId: profile.id, ...ow } }),
      prisma.lmsLearner.count({ where: { profileId: profile.id, ...ow } }),
      prisma.lmsEnrollment.findMany({
        where: { ...ow, course: { profileId: profile.id } },
        select: { progressPercent: true, status: true },
      }),
      prisma.lmsFinanceTransaction.findMany({
        where: { profileId: profile.id, ...ow },
        select: { type: true, amountBaht: true, transactedAt: true },
        orderBy: { transactedAt: "asc" },
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

    const byDay = new Map<string, { income: number; expense: number }>();
    for (const row of finance) {
      const key = row.transactedAt.toISOString().slice(0, 10);
      const cur = byDay.get(key) ?? { income: 0, expense: 0 };
      if (row.type === "INCOME") cur.income += row.amountBaht;
      else cur.expense += row.amountBaht;
      byDay.set(key, cur);
    }
    const spark = [...byDay.entries()]
      .slice(-14)
      .map(([date, v]) => ({ date, income: v.income, expense: v.expense }));

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
      spark,
    });
  } catch (e) {
    console.error("[lms/session/summary GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
