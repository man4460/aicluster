import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { smartGuardTourOwnerFromAuth } from "@/lib/smart-guard-tour/api-owner";
import { smartGuardTourSessionContext } from "@/lib/smart-guard-tour/session-context";

type Ctx = { params: Promise<{ id: string }> };

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

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    if (own.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าของ" }, { status: 403 });
    const { shop } = await smartGuardTourSessionContext(own.ownerId);
    const existing = await prisma.smartGuardSchedule.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบตาราง" }, { status: 404 });
    const body = (await req.json()) as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim().slice(0, 200);
    if (body.routeMode === "SEQUENTIAL" || body.routeMode === "FREE") data.routeMode = body.routeMode;
    if (typeof body.intervalMinutes === "number" && body.intervalMinutes >= 15) {
      data.intervalMinutes = Math.min(24 * 60, Math.floor(body.intervalMinutes));
    }
    if (Array.isArray(body.checkpointIds)) {
      const checkpointIds = parseCheckpointIds(body.checkpointIds);
      if (checkpointIds.length === 0) {
        return NextResponse.json({ error: "เลือกจุดตรวจอย่างน้อย 1 จุด" }, { status: 400 });
      }
      const valid = await prisma.smartGuardCheckpoint.count({
        where: { shopId: shop.id, id: { in: checkpointIds } },
      });
      if (valid !== checkpointIds.length) {
        return NextResponse.json({ error: "มีจุดตรวจที่ไม่ถูกต้อง" }, { status: 400 });
      }
      data.checkpointIdsJson = JSON.stringify(checkpointIds);
    }
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;
    const row = await prisma.smartGuardSchedule.update({ where: { id }, data });
    return NextResponse.json({ schedule: mapRow(row) });
  } catch (e) {
    console.error("[smart-guard-tour/schedules PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    if (own.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าของ" }, { status: 403 });
    const { shop } = await smartGuardTourSessionContext(own.ownerId);
    const existing = await prisma.smartGuardSchedule.findFirst({
      where: { id, shopId: shop.id },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบตาราง" }, { status: 404 });
    await prisma.smartGuardSchedule.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[smart-guard-tour/schedules DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
