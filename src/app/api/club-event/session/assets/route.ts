import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await clubEventSessionContext(own.ownerId);
    const rows = await prisma.clubEventAsset.findMany({
      where: { profileId: profile.id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      assets: rows.map((a) => ({
        id: a.id,
        name: a.name,
        quantity: a.quantity,
        status: a.status,
        note: a.note,
      })),
    });
  } catch (e) {
    console.error("[club-event/session/assets GET]", e);
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
    if (!name) return NextResponse.json({ error: "กรอกชื่อทรัพย์สิน" }, { status: 400 });

    const row = await prisma.clubEventAsset.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        profileId: profile.id,
        name: name.slice(0, 200),
        quantity: typeof body.quantity === "number" && body.quantity > 0 ? Math.round(body.quantity) : 1,
        status:
          body.status === "AVAILABLE" ||
          body.status === "IN_USE" ||
          body.status === "DAMAGED" ||
          body.status === "RETIRED"
            ? body.status
            : "AVAILABLE",
        note: typeof body.note === "string" ? body.note.slice(0, 500) : "",
      },
    });

    return NextResponse.json({
      asset: {
        id: row.id,
        name: row.name,
        quantity: row.quantity,
        status: row.status,
        note: row.note,
      },
    });
  } catch (e) {
    console.error("[club-event/session/assets POST]", e);
    return NextResponse.json({ error: "สร้างไม่สำเร็จ" }, { status: 500 });
  }
}
