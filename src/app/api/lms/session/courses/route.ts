import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { lmsOwnerFromAuth } from "@/lib/lms/api-owner";
import { lmsOwnerWhere, lmsSessionContext } from "@/lib/lms/session-context";
import { prisma } from "@/lib/prisma";
import { mapLmsCourse } from "@/systems/lms/lib/mappers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { profile, scope } = await lmsSessionContext(own.ownerId);
    const rows = await prisma.lmsCourse.findMany({
      where: { profileId: profile.id, ...lmsOwnerWhere(own.ownerId, scope.trialSessionId) },
      include: { _count: { select: { lessons: true, enrollments: true } }, exam: { select: { id: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ courses: rows.map(mapLmsCourse) });
  } catch (e) {
    console.error("[lms/session/courses GET]", e);
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
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "กรอกชื่อคอร์ส" }, { status: 400 });
    const status = body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
    const priceBaht = typeof body.priceBaht === "number" ? Math.max(0, Math.round(body.priceBaht)) : 0;

    const row = await prisma.lmsCourse.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        profileId: profile.id,
        title: title.slice(0, 200),
        description: typeof body.description === "string" ? body.description : "",
        coverImageUrl: typeof body.coverImageUrl === "string" ? body.coverImageUrl.slice(0, 512) : null,
        status,
        priceBaht,
      },
      include: { _count: { select: { lessons: true, enrollments: true } }, exam: { select: { id: true } } },
    });
    return NextResponse.json({ course: mapLmsCourse(row) });
  } catch (e) {
    console.error("[lms/session/courses POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
