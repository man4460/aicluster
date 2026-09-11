import { NextResponse } from "next/server";
import { findLmsPublicProfile } from "@/lib/lms/public-profile";
import { prisma } from "@/lib/prisma";
import { mapLmsCertificate, mapLmsCourse } from "@/systems/lms/lib/mappers";

type Ctx = { params: Promise<{ slug: string; code: string }> };

/** ตรวจสอบใบประกาศสาธารณะด้วยรหัส (สำหรับ QR บนใบประกาศ) — ไม่ต้องล็อกอิน */
export async function GET(req: Request, ctx: Ctx) {
  try {
    const { slug, code } = await ctx.params;
    const url = new URL(req.url);
    const certCode = decodeURIComponent(code || "").trim();
    if (!certCode) {
      return NextResponse.json({ error: "ไม่พบรหัสใบประกาศ" }, { status: 400 });
    }

    const profile = await findLmsPublicProfile(slug, url.searchParams.get("t"));
    if (!profile) {
      return NextResponse.json({ error: "ไม่พบสถาบัน" }, { status: 404 });
    }

    const cert = await prisma.lmsCertificate.findFirst({
      where: {
        certCode,
        ownerUserId: profile.ownerUserId,
        trialSessionId: profile.trialSessionId,
        course: { profileId: profile.id },
      },
      include: { learner: true, course: true },
    });
    if (!cert) {
      return NextResponse.json({ error: "ไม่พบใบประกาศหรือรหัสไม่ถูกต้อง" }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      certificate: mapLmsCertificate(cert),
      learner: {
        fullName: cert.learner.fullName,
      },
      course: mapLmsCourse(cert.course),
      institute: {
        slug: profile.slug,
        displayName: profile.displayName,
        logoUrl: profile.logoUrl,
      },
    });
  } catch (e) {
    console.error("[lms/public/[slug]/certificates/verify/[code] GET]", e);
    return NextResponse.json({ error: "ตรวจสอบไม่สำเร็จ" }, { status: 500 });
  }
}
