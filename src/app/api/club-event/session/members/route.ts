import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";
import { parseCustomFieldsJson } from "@/systems/club-event/lib/mappers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await clubEventSessionContext(own.ownerId);
    const rows = await prisma.clubEventMember.findMany({
      where: { profileId: profile.id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      members: rows.map((m) => ({
        id: m.id,
        name: m.name,
        phone: m.phone,
        photoUrl: m.photoUrl,
        customFields: parseCustomFieldsJson(m.customFieldsJson),
        isActive: m.isActive,
      })),
    });
  } catch (e) {
    console.error("[club-event/session/members GET]", e);
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
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "กรอกชื่อสมาชิก" }, { status: 400 });

    const row = await prisma.clubEventMember.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        profileId: profile.id,
        name: name.slice(0, 160),
        phone: typeof body.phone === "string" ? body.phone.slice(0, 32) : "",
        photoUrl: typeof body.photoUrl === "string" ? body.photoUrl.slice(0, 512) : null,
        customFieldsJson: body.customFields !== undefined ? JSON.stringify(body.customFields) : "[]",
        isActive: body.isActive !== false,
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
    console.error("[club-event/session/members POST]", e);
    return NextResponse.json({ error: "สร้างไม่สำเร็จ" }, { status: 500 });
  }
}
