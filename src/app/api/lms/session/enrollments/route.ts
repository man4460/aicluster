import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { lmsOwnerFromAuth } from "@/lib/lms/api-owner";
import { lmsOwnerWhere, lmsSessionContext } from "@/lib/lms/session-context";
import { prisma } from "@/lib/prisma";
import { mapLmsEnrollment } from "@/systems/lms/lib/mappers";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { scope } = await lmsSessionContext(own.ownerId);
    const url = new URL(req.url);
    const learnerId = url.searchParams.get("learnerId");
    const courseId = url.searchParams.get("courseId");

    const rows = await prisma.lmsEnrollment.findMany({
      where: {
        ...lmsOwnerWhere(own.ownerId, scope.trialSessionId),
        ...(learnerId ? { learnerId } : {}),
        ...(courseId ? { courseId } : {}),
      },
      orderBy: { enrolledAt: "desc" },
      include: { learner: true, course: true },
    });

    return NextResponse.json({
      enrollments: rows.map(mapLmsEnrollment),
    });
  } catch (e) {
    console.error("[lms/session/enrollments GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { profile, scope } = await lmsSessionContext(own.ownerId);
    const body = (await req.json()) as Record<string, unknown>;
    const learnerId = typeof body.learnerId === "string" ? body.learnerId : "";
    const courseId = typeof body.courseId === "string" ? body.courseId : "";
    if (!learnerId || !courseId) {
      return NextResponse.json({ error: "เลือกนักเรียนและคอร์ส" }, { status: 400 });
    }

    const [learner, course] = await Promise.all([
      prisma.lmsLearner.findFirst({
        where: {
          id: learnerId,
          profileId: profile.id,
          ...lmsOwnerWhere(own.ownerId, scope.trialSessionId),
        },
      }),
      prisma.lmsCourse.findFirst({
        where: {
          id: courseId,
          profileId: profile.id,
          ...lmsOwnerWhere(own.ownerId, scope.trialSessionId),
        },
      }),
    ]);
    if (!learner || !course) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    const existing = await prisma.lmsEnrollment.findUnique({
      where: { learnerId_courseId: { learnerId, courseId } },
    });
    if (existing) return NextResponse.json({ error: "ลงทะเบียนคอร์สนี้แล้ว" }, { status: 409 });

    const row = await prisma.lmsEnrollment.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        learnerId,
        courseId,
        status: "ENROLLED",
        progressPercent: 0,
      },
      include: { learner: true, course: true },
    });
    return NextResponse.json({ enrollment: mapLmsEnrollment(row) });
  } catch (e) {
    console.error("[lms/session/enrollments POST]", e);
    return NextResponse.json({ error: "ลงทะเบียนไม่สำเร็จ" }, { status: 500 });
  }
}
