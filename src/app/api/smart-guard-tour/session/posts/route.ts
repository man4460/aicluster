import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { smartGuardTourOwnerFromAuth } from "@/lib/smart-guard-tour/api-owner";
import { smartGuardTourSessionContext } from "@/lib/smart-guard-tour/session-context";

function mapPost(row: {
  id: string;
  name: string;
  code: string | null;
  zoneLabel: string | null;
  buildingLabel: string | null;
  linkedCheckpointIdsJson: string;
  requiredStaffPerShift: number;
  sortOrder: number;
  isActive: boolean;
}) {
  let linked: string[] = [];
  try {
    const p = JSON.parse(row.linkedCheckpointIdsJson) as unknown;
    if (Array.isArray(p)) linked = p.filter((x): x is string => typeof x === "string");
  } catch {
    /* ignore */
  }
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    zoneLabel: row.zoneLabel,
    buildingLabel: row.buildingLabel,
    linkedCheckpointIds: linked,
    requiredStaffPerShift: row.requiredStaffPerShift,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await smartGuardTourSessionContext(own.ownerId);
    const rows = await prisma.smartGuardPost.findMany({
      where: { shopId: shop.id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ posts: rows.map(mapPost) });
  } catch (e) {
    console.error("[smart-guard-tour/posts GET]", e);
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
    if (!name) return NextResponse.json({ error: "กรอกชื่อจุด" }, { status: 400 });
    const code =
      typeof body.code === "string" && body.code.trim()
        ? body.code.trim().slice(0, 40)
        : null;
    const linked = Array.isArray(body.linkedCheckpointIds)
      ? (body.linkedCheckpointIds as unknown[]).filter((x): x is string => typeof x === "string")
      : [];
    const row = await prisma.smartGuardPost.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        shopId: shop.id,
        name,
        code,
        zoneLabel:
          typeof body.zoneLabel === "string" ? body.zoneLabel.trim().slice(0, 120) || null : null,
        buildingLabel:
          typeof body.buildingLabel === "string"
            ? body.buildingLabel.trim().slice(0, 120) || null
            : null,
        linkedCheckpointIdsJson: JSON.stringify(linked.slice(0, 40)),
        requiredStaffPerShift:
          typeof body.requiredStaffPerShift === "number" && body.requiredStaffPerShift >= 1
            ? Math.min(8, Math.floor(body.requiredStaffPerShift))
            : 1,
        isActive: typeof body.isActive === "boolean" ? body.isActive : true,
      },
    });
    return NextResponse.json({ post: mapPost(row) });
  } catch (e) {
    console.error("[smart-guard-tour/posts POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
