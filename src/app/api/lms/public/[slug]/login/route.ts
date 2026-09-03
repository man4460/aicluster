import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import {
  createLmsLearnerToken,
  setLmsLearnerSessionCookie,
} from "@/lib/lms/learner-session";
import { findLmsPublicProfile } from "@/lib/lms/public-profile";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const url = new URL(req.url);
    const profile = await findLmsPublicProfile(slug, url.searchParams.get("t"));
    if (!profile) {
      return NextResponse.json({ error: "ไม่พบสถาบัน" }, { status: 404 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const username =
      typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!username || !password) {
      return NextResponse.json({ error: "กรอกชื่อผู้ใช้และรหัสผ่าน" }, { status: 400 });
    }

    const learner = await prisma.lmsLearner.findFirst({
      where: {
        profileId: profile.id,
        username,
        status: "ACTIVE",
      },
    });
    if (!learner) {
      return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const ok = await verifyPassword(password, learner.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const token = createLmsLearnerToken({
      learnerId: learner.id,
      profileId: profile.id,
      slug: profile.slug,
    });
    await setLmsLearnerSessionCookie(token, req);

    return NextResponse.json({
      ok: true,
      learner: {
        id: learner.id,
        username: learner.username,
        fullName: learner.fullName,
      },
    });
  } catch (e) {
    console.error("[lms/public/[slug]/login POST]", e);
    return NextResponse.json({ error: "เข้าสู่ระบบไม่สำเร็จ" }, { status: 500 });
  }
}
