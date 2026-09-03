import { NextResponse } from "next/server";
import { readLmsLearnerSession } from "@/lib/lms/learner-session";
import { findLmsPublicProfile } from "@/lib/lms/public-profile";
import { prisma } from "@/lib/prisma";
import { mapLmsCourse } from "@/systems/lms/lib/mappers";
import { mapLmsCoursePurchase } from "@/systems/lms/lib/purchases";

type Ctx = { params: Promise<{ slug: string }> };

/** แคตตาล็อกคอร์สที่ยังไม่ได้เรียน + คำขอซื้อของผู้เรียน */
export async function GET(req: Request, ctx: Ctx) {
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

    const learner = await prisma.lmsLearner.findFirst({
      where: { id: session.learnerId, profileId: profile.id, status: "ACTIVE" },
    });
    if (!learner) {
      return NextResponse.json({ error: "ไม่พบผู้เรียน" }, { status: 401 });
    }

    const [enrolled, courses, purchases] = await Promise.all([
      prisma.lmsEnrollment.findMany({
        where: { learnerId: learner.id },
        select: { courseId: true },
      }),
      prisma.lmsCourse.findMany({
        where: { profileId: profile.id, status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { lessons: true, enrollments: true } }, exam: { select: { id: true } } },
      }),
      prisma.lmsCoursePurchase.findMany({
        where: { learnerId: learner.id },
        orderBy: { createdAt: "desc" },
        include: {
          course: { select: { id: true, title: true, coverImageUrl: true, priceBaht: true } },
        },
      }),
    ]);

    const enrolledIds = new Set(enrolled.map((e) => e.courseId));
    const pendingCourseIds = new Set(
      purchases.filter((p) => p.status === "PENDING_REVIEW").map((p) => p.courseId),
    );

    const available = courses
      .filter((c) => !enrolledIds.has(c.id))
      .map((c) => ({
        ...mapLmsCourse(c),
        pendingPurchase: pendingCourseIds.has(c.id),
      }));

    return NextResponse.json({
      ownerId: profile.ownerUserId,
      payment: {
        promptPayPhone: profile.promptPayPhone,
        bankName: profile.bankName,
        bankAccountNumber: profile.bankAccountNumber,
        bankAccountName: profile.bankAccountName,
        displayName: profile.displayName,
      },
      courses: available,
      purchases: purchases.map(mapLmsCoursePurchase),
    });
  } catch (e) {
    console.error("[lms/public/[slug]/catalog GET]", e);
    return NextResponse.json({ error: "โหลดแคตตาล็อกไม่สำเร็จ" }, { status: 500 });
  }
}
