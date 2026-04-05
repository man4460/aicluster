import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";

const postSchema = z.object({
  name: z.string().min(1).max(160),
  unit_label: z.string().max(32).optional().nullable(),
  sort_order: z.number().int().min(0).max(9999),
});

const patchSchema = z
  .object({
    name: z.string().min(1).max(160).optional(),
    unit_label: z.string().max(32).optional().nullable(),
    sort_order: z.number().int().min(0).max(9999).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "empty" });

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const rows = await prisma.buildingPosIngredient.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    return NextResponse.json({
      ingredients: rows.map((r) => ({
        id: r.id,
        name: r.name,
        unit_label: r.unitLabel,
        sort_order: r.sortOrder,
      })),
    });
  } catch (e) {
    console.error("[building-pos/session/ingredients GET]", e);
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
    const row = await prisma.buildingPosIngredient.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        name: parsed.data.name.trim(),
        unitLabel: parsed.data.unit_label?.trim() ?? "",
        sortOrder: parsed.data.sort_order,
      },
    });
    return NextResponse.json({
      ingredient: {
        id: row.id,
        name: row.name,
        unit_label: row.unitLabel,
        sort_order: row.sortOrder,
      },
    });
  } catch (e) {
    console.error("[building-pos/session/ingredients POST]", e);
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
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const data: { name?: string; unitLabel?: string; sortOrder?: number } = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
    if (parsed.data.unit_label !== undefined) data.unitLabel = parsed.data.unit_label?.trim() ?? "";
    if (parsed.data.sort_order !== undefined) data.sortOrder = parsed.data.sort_order;
    const row = await prisma.buildingPosIngredient.updateMany({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      data,
    });
    if (row.count === 0) return NextResponse.json({ error: "ไม่พบรายการของ" }, { status: 404 });
    const updated = await prisma.buildingPosIngredient.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!updated) return NextResponse.json({ error: "ไม่พบรายการของ" }, { status: 404 });
    return NextResponse.json({
      ingredient: {
        id: updated.id,
        name: updated.name,
        unit_label: updated.unitLabel,
        sort_order: updated.sortOrder,
      },
    });
  } catch (e) {
    console.error("[building-pos/session/ingredients PATCH]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function DELETE(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await buildingPosOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getBuildingPosDataScope(own.ownerId);
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  try {
    const n = await prisma.buildingPosIngredient.deleteMany({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (n.count === 0) return NextResponse.json({ error: "ไม่พบรายการของ" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json(
        { error: "ลบไม่ได้ — รายการนี้ถูกใช้ในสูตรหรือบันทึกการจ่ายตลาด" },
        { status: 409 },
      );
    }
    console.error("[building-pos/session/ingredients DELETE]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
