import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";
import { parseDynamicLinkConfig } from "@/systems/club-event/lib/mappers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await clubEventSessionContext(own.ownerId);
    const rows = await prisma.clubEventDynamicLink.findMany({
      where: { profileId: profile.id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      links: rows.map((l) => ({
        id: l.id,
        type: l.type,
        title: l.title,
        config: parseDynamicLinkConfig(l.configJson),
        isActive: l.isActive,
        publicPath: `/club/${profile.slug}/link/${l.id}`,
      })),
    });
  } catch (e) {
    console.error("[club-event/session/links GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await clubEventSessionContext(own.ownerId);
    const body = (await req.json()) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const type =
      body.type === "SURVEY" || body.type === "RSVP" || body.type === "PAYMENT" || body.type === "URL"
        ? body.type
        : null;
    if (!title || !type) return NextResponse.json({ error: "กรอกชื่อและประเภทลิงก์" }, { status: 400 });

    const row = await prisma.clubEventDynamicLink.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        profileId: profile.id,
        type,
        title: title.slice(0, 200),
        configJson: body.config !== undefined ? JSON.stringify(body.config) : "{}",
        isActive: body.isActive !== false,
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
    console.error("[club-event/session/links POST]", e);
    return NextResponse.json({ error: "สร้างไม่สำเร็จ" }, { status: 500 });
  }
}
