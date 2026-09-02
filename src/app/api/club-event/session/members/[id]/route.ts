import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";
import { parseCustomFieldsJson } from "@/systems/club-event/lib/mappers";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { scope } = await clubEventSessionContext(own.ownerId);
    const existing = await prisma.clubEventMember.findFirst({
      where: { id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });

    const body = (await req.json()) as Record<string, unknown>;
    const row = await prisma.clubEventMember.update({
      where: { id },
      data: {
        name: typeof body.name === "string" ? body.name.trim().slice(0, 160) : existing.name,
        phone: typeof body.phone === "string" ? body.phone.slice(0, 32) : existing.phone,
        photoUrl:
          typeof body.photoUrl === "string"
            ? body.photoUrl.slice(0, 512)
            : body.photoUrl === null
              ? null
              : existing.photoUrl,
        customFieldsJson:
          body.customFields !== undefined ? JSON.stringify(body.customFields) : existing.customFieldsJson,
        isActive: typeof body.isActive === "boolean" ? body.isActive : existing.isActive,
      },
    });

    return NextResponse.json({
      member: {
        id: row.id,
        name: row.name,
        phone: row.phone,
        photoUrl: row.photoUrl,
        customFields: parseCustomFieldsJson(row.customFieldsJson),
        isActive: row.isActive,
      },
    });
  } catch (e) {
    console.error("[club-event/session/members/[id] PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { scope } = await clubEventSessionContext(own.ownerId);
    const existing = await prisma.clubEventMember.findFirst({
      where: { id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });

    await prisma.clubEventMember.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[club-event/session/members/[id] DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
