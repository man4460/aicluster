import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { smartGuardTourOwnerFromAuth } from "@/lib/smart-guard-tour/api-owner";
import { smartGuardTourSessionContext } from "@/lib/smart-guard-tour/session-context";

function mapRow(row: {
  id: string;
  displayName: string;
  phone: string | null;
  lineId: string | null;
  isActive: boolean;
  note: string | null;
}) {
  return {
    id: row.id,
    displayName: row.displayName,
    phone: row.phone,
    lineId: row.lineId,
    isActive: row.isActive,
    note: row.note,
  };
}

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await smartGuardTourSessionContext(own.ownerId);
    const rows = await prisma.smartGuardContact.findMany({
      where: { shopId: shop.id },
      orderBy: { displayName: "asc" },
    });
    return NextResponse.json({ contacts: rows.map(mapRow) });
  } catch (e) {
    console.error("[smart-guard-tour/contacts GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    if (own.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าของ" }, { status: 403 });
    const { shop, scope } = await smartGuardTourSessionContext(own.ownerId);
    const body = (await req.json()) as Record<string, unknown>;
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim().slice(0, 200) : "";
    if (!displayName) return NextResponse.json({ error: "กรอกชื่อผู้ติดต่อ" }, { status: 400 });
    const row = await prisma.smartGuardContact.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        shopId: shop.id,
        displayName,
        phone: typeof body.phone === "string" ? body.phone.trim().slice(0, 32) || null : null,
        lineId: typeof body.lineId === "string" ? body.lineId.trim().slice(0, 120) || null : null,
        isActive: typeof body.isActive === "boolean" ? body.isActive : true,
        note: typeof body.note === "string" ? body.note.trim().slice(0, 2000) || null : null,
      },
    });
    return NextResponse.json({ contact: mapRow(row) });
  } catch (e) {
    console.error("[smart-guard-tour/contacts POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
