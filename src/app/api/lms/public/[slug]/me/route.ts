import { NextResponse } from "next/server";
import { readLmsLearnerSession } from "@/lib/lms/learner-session";
import { findLmsPublicProfile } from "@/lib/lms/public-profile";
import { prisma } from "@/lib/prisma";
import { mapLmsCertificate, mapLmsCourse, mapLmsEnrollment } from "@/systems/lms/lib/mappers";
import { ensureAccessForPendingPurchases } from "@/systems/lms/lib/purchases";

type Ctx = { params: Promise<{ slug: string }> };

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

    await ensureAccessForPendingPurchases(learner.id);

    const enrollments = await prisma.lmsEnrollment.findMany({
      where: { learnerId: learner.id },
      orderBy: { updatedAt: "desc" },
      include: { course: true },
    });

    const certs = await prisma.lmsCertificate.findMany({
      where: { learnerId: learner.id },
      include: { course: true },
    });

    return NextResponse.json({
      learner: {
        id: learner.id,
        username: learner.username,
        fullName: learner.fullName,
        email: learner.email,
      },
      institute: {
        slug: profile.slug,
        displayName: profile.displayName,
        logoUrl: profile.logoUrl,
      },
      enrollments: enrollments.map((e) => ({
        ...mapLmsEnrollment(e),
        course: e.course ? mapLmsCourse(e.course) : undefined,
      })),
      certificates: certs.map(mapLmsCertificate),
    });
  } catch (e) {
    console.error("[lms/public/[slug]/me GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
