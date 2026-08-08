import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";

const postSchema = z.object({
  name: z.string().min(1).max(120),
  sort_order: z.number().int().min(0).max(9999).optional(),
});

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const rows = await prisma.buildingPosCostCategory.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    return NextResponse.json({
      categories: rows.map((r) => ({
        id: r.id,
        name: r.name,
        sort_order: r.sortOrder,
      })),
    });
  } catch (e) {
    console.error("[building-pos/session/cost-categories GET]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const maxSort = await prisma.buildingPosCostCategory.aggregate({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      _max: { sortOrder: true },
    });
    const sortOrder = parsed.data.sort_order ?? (maxSort._max.sortOrder ?? 0) + 1;

    const row = await prisma.buildingPosCostCategory.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        name: parsed.data.name.trim(),
        sortOrder,
      },
    });
    return NextResponse.json({
      category: { id: row.id, name: row.name, sort_order: row.sortOrder },
    });
  } catch (e) {
    console.error("[building-pos/session/cost-categories POST]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    if (!Number.isFinite(id)) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const existing = await prisma.buildingPosCostCategory.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });

    const row = await prisma.buildingPosCostCategory.update({
      where: { id },
      data: {
        name: parsed.data.name.trim(),
        ...(parsed.data.sort_order !== undefined ? { sortOrder: parsed.data.sort_order } : {}),
      },
    });
    return NextResponse.json({
      category: { id: row.id, name: row.name, sort_order: row.sortOrder },
    });
  } catch (e) {
    console.error("[building-pos/session/cost-categories PATCH]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    if (!Number.isFinite(id)) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    const existing = await prisma.buildingPosCostCategory.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      include: { _count: { select: { entries: true } } },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
    if (existing._count.entries > 0) {
      return NextResponse.json(
        { error: `มีรายจ่าย ${existing._count.entries} รายการในหมวดนี้ — ย้ายหรือลบรายจ่ายก่อน` },
        { status: 409 },
      );
    }

    await prisma.buildingPosCostCategory.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[building-pos/session/cost-categories DELETE]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
