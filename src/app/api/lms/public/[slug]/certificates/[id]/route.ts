import { NextResponse } from "next/server";
import { readLmsLearnerSession } from "@/lib/lms/learner-session";
import { findLmsPublicProfile } from "@/lib/lms/public-profile";
import { prisma } from "@/lib/prisma";
import { mapLmsCertificate, mapLmsCourse, mapLmsLearner, mapLmsProfile } from "@/systems/lms/lib/mappers";

type Ctx = { params: Promise<{ slug: string; id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { slug, id } = await ctx.params;
    const url = new URL(req.url);
    const session = await readLmsLearnerSession();
    if (!session || session.slug !== slug) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const profile = await findLmsPublicProfile(slug, url.searchParams.get("t"));
    if (!profile || profile.id !== session.profileId) {
      return NextResponse.json({ error: "ไม่พบสถาบัน" }, { status: 404 });
    }

    const cert = await prisma.lmsCertificate.findFirst({
      where: { id, learnerId: session.learnerId },
      include: { learner: true, course: true },
    });
    if (!cert) {
      return NextResponse.json({ error: "ไม่พบใบรับรอง" }, { status: 404 });
    }

    return NextResponse.json({
      certificate: mapLmsCertificate(cert),
      learner: mapLmsLearner(cert.learner),
      course: mapLmsCourse(cert.course),
      institute: {
        displayName: profile.displayName,
        logoUrl: profile.logoUrl,
        certSignerName: profile.certSignerName,
        certSignatureUrl: profile.certSignatureUrl,
        certTemplateNote: profile.certTemplateNote,
        address: profile.address,
      },
      profile: mapLmsProfile(profile),
    });
  } catch (e) {
    console.error("[lms/public/[slug]/certificates/[id] GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
