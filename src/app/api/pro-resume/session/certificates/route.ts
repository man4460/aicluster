import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { proResumeOwnerFromAuth } from "@/lib/pro-resume/api-owner";
import { proResumeOwnerWhere, proResumeSessionContext } from "@/lib/pro-resume/session-context";
import { prisma } from "@/lib/prisma";
import { mapResumeCertificate } from "@/systems/pro-resume/lib/mappers";
import { applyOrderedIds } from "@/systems/pro-resume/lib/helpers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await proResumeOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await proResumeSessionContext(own.ownerId);
    const rows = await prisma.resumeCertificate.findMany({
      where: { profileId: profile.id, ...proResumeOwnerWhere(own.ownerId, scope.trialSessionId) },
      orderBy: { orderIndex: "asc" },
    });
    return NextResponse.json({ certificates: rows.map(mapResumeCertificate) });
  } catch (e) {
    console.error("[pro-resume/session/certificates GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await proResumeOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await proResumeSessionContext(own.ownerId);
    const body = (await req.json()) as Record<string, unknown>;

    if (Array.isArray(body.orderedIds)) {
      const result = await applyOrderedIds(
        prisma.resumeCertificate,
        profile.id,
        own.ownerId,
        scope.trialSessionId,
        body.orderedIds.filter((id): id is string => typeof id === "string"),
      );
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      const rows = await prisma.resumeCertificate.findMany({
        where: { profileId: profile.id },
        orderBy: { orderIndex: "asc" },
      });
      return NextResponse.json({ certificates: rows.map(mapResumeCertificate) });
    }

    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
    if (!name) return NextResponse.json({ error: "กรอกชื่อใบรับรอง" }, { status: 400 });

    const maxOrder = await prisma.resumeCertificate.aggregate({
      where: { profileId: profile.id },
      _max: { orderIndex: true },
    });

    const row = await prisma.resumeCertificate.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        profileId: profile.id,
        name,
        issuedBy: typeof body.issuedBy === "string" ? body.issuedBy.trim().slice(0, 200) : "",
        year: typeof body.year === "number" ? body.year : null,
        fileUrl: typeof body.fileUrl === "string" ? body.fileUrl.slice(0, 512) : null,
        orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
      },
    });
    return NextResponse.json({ certificate: mapResumeCertificate(row) });
  } catch (e) {
    console.error("[pro-resume/session/certificates POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
