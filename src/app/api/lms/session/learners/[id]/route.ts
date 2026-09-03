import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth/password";
import { lmsOwnerFromAuth } from "@/lib/lms/api-owner";
import { lmsOwnerWhere, lmsSessionContext } from "@/lib/lms/session-context";
import { prisma } from "@/lib/prisma";
import { mapLmsLearner } from "@/systems/lms/lib/mappers";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { id } = await ctx.params;
    const { scope } = await lmsSessionContext(own.ownerId);
    const existing = await prisma.lmsLearner.findFirst({
      where: { id, ...lmsOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบนักเรียน" }, { status: 404 });
    const body = (await req.json()) as Record<string, unknown>;

    let passwordHash = existing.passwordHash;
    if (typeof body.password === "string" && body.password.length >= 4) {
      passwordHash = await hashPassword(body.password);
    }

    let username = existing.username;
    if (typeof body.username === "string") {
      const next = body.username.trim().toLowerCase().slice(0, 80);
      if (next.length < 3) {
        return NextResponse.json({ error: "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร" }, { status: 400 });
      }
      if (next !== existing.username) {
        const taken = await prisma.lmsLearner.findFirst({
          where: {
            profileId: existing.profileId,
            username: next,
            NOT: { id: existing.id },
          },
          select: { id: true },
        });
        if (taken) {
          return NextResponse.json({ error: "ชื่อผู้ใช้นี้มีแล้วในสถาบันนี้" }, { status: 409 });
        }
        username = next;
      }
    }

    const row = await prisma.lmsLearner.update({
      where: { id },
      data: {
        username,
        fullName: typeof body.fullName === "string" ? body.fullName.trim().slice(0, 160) : existing.fullName,
        email: typeof body.email === "string" ? body.email.slice(0, 200) : existing.email,
        phone: typeof body.phone === "string" ? body.phone.slice(0, 32) : existing.phone,
        status: body.status === "ACTIVE" || body.status === "INACTIVE" ? body.status : existing.status,
        passwordHash,
      },
      include: { enrollments: { include: { course: { select: { title: true } } } } },
    });
    return NextResponse.json({ learner: mapLmsLearner(row) });
  } catch (e) {
    console.error("[lms/session/learners PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { id } = await ctx.params;
    const { scope } = await lmsSessionContext(own.ownerId);
    const existing = await prisma.lmsLearner.findFirst({
      where: { id, ...lmsOwnerWhere(own.ownerId, scope.trialSessionId) },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบนักเรียน" }, { status: 404 });
    await prisma.lmsLearner.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[lms/session/learners DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
