import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";
import { parseDynamicLinkConfig } from "@/systems/club-event/lib/mappers";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { profile, scope } = await clubEventSessionContext(own.ownerId);
    const existing = await prisma.clubEventDynamicLink.findFirst({
      where: { id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบลิงก์" }, { status: 404 });

    const body = (await req.json()) as Record<string, unknown>;
    const row = await prisma.clubEventDynamicLink.update({
      where: { id },
      data: {
        title: typeof body.title === "string" ? body.title.trim().slice(0, 200) : existing.title,
        type:
          body.type === "SURVEY" || body.type === "RSVP" || body.type === "PAYMENT" || body.type === "URL"
            ? body.type
            : existing.type,
        configJson: body.config !== undefined ? JSON.stringify(body.config) : existing.configJson,
        isActive: typeof body.isActive === "boolean" ? body.isActive : existing.isActive,
      },
    });

    return NextResponse.json({
      link: {
        id: row.id,
        type: row.type,
        title: row.title,
        config: parseDynamicLinkConfig(row.configJson),
        isActive: row.isActive,
        publicPath: `/club/${profile.slug}/link/${row.id}`,
      },
    });
  } catch (e) {
    console.error("[club-event/session/links/[id] PATCH]", e);
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
    const existing = await prisma.clubEventDynamicLink.findFirst({
      where: { id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบลิงก์" }, { status: 404 });

    await prisma.clubEventDynamicLink.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[club-event/session/links/[id] DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
