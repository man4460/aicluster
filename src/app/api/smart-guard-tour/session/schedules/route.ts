import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { smartGuardTourOwnerFromAuth } from "@/lib/smart-guard-tour/api-owner";
import { smartGuardTourSessionContext } from "@/lib/smart-guard-tour/session-context";

function parseCheckpointIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.length > 0).slice(0, 80);
}

function mapRow(row: {
  id: string;
  name: string;
  routeMode: string;
  intervalMinutes: number;
  checkpointIdsJson: string;
  isActive: boolean;
}) {
  let ids: string[] = [];
  try {
    const p = JSON.parse(row.checkpointIdsJson) as unknown;
    if (Array.isArray(p)) ids = p.filter((x): x is string => typeof x === "string");
  } catch {
    /* ignore */
  }
  return {
    id: row.id,
    name: row.name,
    routeMode: row.routeMode,
    intervalMinutes: row.intervalMinutes,
    checkpointIds: ids,
    checkpointCount: ids.length,
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
    const rows = await prisma.smartGuardSchedule.findMany({
      where: { shopId: shop.id },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ schedules: rows.map(mapRow) });
  } catch (e) {
    console.error("[smart-guard-tour/schedules GET]", e);
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
    if (!name) return NextResponse.json({ error: "กรอกชื่อตาราง" }, { status: 400 });
    const checkpointIds = parseCheckpointIds(body.checkpointIds);
    if (checkpointIds.length === 0) {
      return NextResponse.json({ error: "เลือกจุดตรวจอย่างน้อย 1 จุด" }, { status: 400 });
    }
    const valid = await prisma.smartGuardCheckpoint.count({
      where: { shopId: shop.id, id: { in: checkpointIds }, isActive: true },
    });
    if (valid !== checkpointIds.length) {
      return NextResponse.json({ error: "มีจุดตรวจที่ไม่ถูกต้อง" }, { status: 400 });
    }
    const routeMode = body.routeMode === "SEQUENTIAL" ? "SEQUENTIAL" : "FREE";
    const interval =
      typeof body.intervalMinutes === "number" && body.intervalMinutes >= 15
        ? Math.min(24 * 60, Math.floor(body.intervalMinutes))
        : 120;

    const row = await prisma.smartGuardSchedule.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        shopId: shop.id,
        name,
        routeMode,
        intervalMinutes: interval,
        checkpointIdsJson: JSON.stringify(checkpointIds),
        isActive: typeof body.isActive === "boolean" ? body.isActive : true,
      },
    });
    return NextResponse.json({ schedule: mapRow(row) });
  } catch (e) {
    console.error("[smart-guard-tour/schedules POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
