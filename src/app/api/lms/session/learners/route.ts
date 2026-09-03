import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth/password";
import { lmsOwnerFromAuth } from "@/lib/lms/api-owner";
import { lmsOwnerWhere, lmsSessionContext } from "@/lib/lms/session-context";
import { prisma } from "@/lib/prisma";
import {
  LMS_LEARNER_QUOTA_DAILY,
  resolveLmsLearnerQuotaMax,
} from "@/systems/lms/lib/constants";
import { mapLmsLearner } from "@/systems/lms/lib/mappers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { profile, scope } = await lmsSessionContext(own.ownerId);
    const rows = await prisma.lmsLearner.findMany({
      where: { profileId: profile.id, ...lmsOwnerWhere(own.ownerId, scope.trialSessionId) },
      include: {
        enrollments: {
          include: { course: { select: { title: true } } },
          orderBy: { enrolledAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      learners: rows.map(mapLmsLearner),
      quota: { used: rows.length, max: resolveLmsLearnerQuotaMax(own.access) },
    });
  } catch (e) {
    console.error("[lms/session/learners GET]", e);
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
    const count = await prisma.lmsLearner.count({
      where: { profileId: profile.id, ...lmsOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    const max = resolveLmsLearnerQuotaMax(own.access);
    if (max != null && count >= max) {
      return NextResponse.json(
        {
          error: `โควตาผู้เรียนเต็ม ${count}/${max} (สายรายวันสูงสุด ${LMS_LEARNER_QUOTA_DAILY} คน) กรุณาสมัครแพ็กเกจรายเดือน (Monthly Subscription) เพื่อเพิ่มผู้เรียนไม่จำกัด`,
        },
        { status: 403 },
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    if (!username || username.length < 3 || !password || password.length < 4 || !fullName) {
      return NextResponse.json({ error: "กรอกชื่อผู้ใช้ รหัสผ่าน และชื่อเต็มให้ครบ" }, { status: 400 });
    }

    const taken = await prisma.lmsLearner.findFirst({
      where: { profileId: profile.id, username: username.slice(0, 80) },
      select: { id: true },
    });
    if (taken) return NextResponse.json({ error: "ชื่อผู้ใช้นี้มีแล้วในสถาบันนี้" }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const row = await prisma.lmsLearner.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        profileId: profile.id,
        username: username.slice(0, 80),
        passwordHash,
        fullName: fullName.slice(0, 160),
        email: typeof body.email === "string" ? body.email.slice(0, 200) : "",
        phone: typeof body.phone === "string" ? body.phone.slice(0, 32) : "",
        status: body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      },
      include: { enrollments: { include: { course: { select: { title: true } } } } },
    });
    return NextResponse.json({ learner: mapLmsLearner(row) });
  } catch (e) {
    console.error("[lms/session/learners POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
