import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { smartGuardTourOwnerFromAuth } from "@/lib/smart-guard-tour/api-owner";
import { smartGuardTourSessionContext } from "@/lib/smart-guard-tour/session-context";

const KINDS = new Set(["RADIO", "FLASHLIGHT", "VEHICLE", "OTHER"]);
const STATUSES = new Set(["AVAILABLE", "IN_USE", "MAINTENANCE", "RETIRED"]);

function mapRow(row: {
  id: string;
  name: string;
  kind: string;
  assetCode: string | null;
  status: string;
  note: string | null;
}) {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    assetCode: row.assetCode,
    status: row.status,
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
    const rows = await prisma.smartGuardAsset.findMany({
      where: { shopId: shop.id },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ assets: rows.map(mapRow) });
  } catch (e) {
    console.error("[smart-guard-tour/assets GET]", e);
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
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
    if (!name) return NextResponse.json({ error: "กรอกชื่ออุปกรณ์" }, { status: 400 });
    const kind = typeof body.kind === "string" && KINDS.has(body.kind) ? body.kind : "OTHER";
    const status =
      typeof body.status === "string" && STATUSES.has(body.status) ? body.status : "AVAILABLE";
    const row = await prisma.smartGuardAsset.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        shopId: shop.id,
        name,
        kind,
        status,
        assetCode:
          typeof body.assetCode === "string" ? body.assetCode.trim().slice(0, 64) || null : null,
        note: typeof body.note === "string" ? body.note.trim().slice(0, 2000) || null : null,
      },
    });
    return NextResponse.json({ asset: mapRow(row) });
  } catch (e) {
    console.error("[smart-guard-tour/assets POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
