import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { proResumeOwnerFromAuth } from "@/lib/pro-resume/api-owner";
import { proResumeOwnerWhere, proResumeSessionContext } from "@/lib/pro-resume/session-context";
import { prisma } from "@/lib/prisma";
import { mapResumeCertificate } from "@/systems/pro-resume/lib/mappers";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await proResumeOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { profile, scope } = await proResumeSessionContext(own.ownerId);
    const existing = await prisma.resumeCertificate.findFirst({
      where: { id, profileId: profile.id, ...proResumeOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

    const body = (await req.json()) as Record<string, unknown>;
    const updated = await prisma.resumeCertificate.update({
      where: { id },
      data: {
        name: typeof body.name === "string" ? body.name.trim().slice(0, 200) : existing.name,
        issuedBy: typeof body.issuedBy === "string" ? body.issuedBy.trim().slice(0, 200) : existing.issuedBy,
        year: typeof body.year === "number" ? body.year : body.year === null ? null : existing.year,
        fileUrl:
          typeof body.fileUrl === "string"
            ? body.fileUrl.slice(0, 512)
            : body.fileUrl === null
              ? null
              : existing.fileUrl,
      },
    });
    return NextResponse.json({ certificate: mapResumeCertificate(updated) });
  } catch (e) {
    console.error("[pro-resume/session/certificates/[id] PUT]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await proResumeOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { profile, scope } = await proResumeSessionContext(own.ownerId);
    const existing = await prisma.resumeCertificate.findFirst({
      where: { id, profileId: profile.id, ...proResumeOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

    await prisma.resumeCertificate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[pro-resume/session/certificates/[id] DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
