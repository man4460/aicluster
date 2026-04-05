import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";

const postSchema = z.object({
  name: z.string().min(1).max(160),
  image_url: z.string().max(512).optional().nullable(),
  sort_order: z.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

const patchSchema = z
  .object({
    name: z.string().min(1).max(160).optional(),
    image_url: z.string().max(512).optional().nullable(),
    sort_order: z.number().int().min(0).max(9999).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "empty" });

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await buildingPosOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getBuildingPosDataScope(own.ownerId);
  const rows = await prisma.buildingPosCategory.findMany({
    where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return NextResponse.json({
    categories: rows.map((r) => ({ id: r.id, name: r.name, image_url: r.imageUrl, sort_order: r.sortOrder, is_active: r.isActive })),
  });
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    let json: unknown;
    try { json = await req.json(); } catch { return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 }); }
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const row = await prisma.buildingPosCategory.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        name: parsed.data.name.trim(),
        imageUrl: parsed.data.image_url?.trim() ?? "",
        sortOrder: parsed.data.sort_order,
        isActive: parsed.data.is_active,
      },
    });
    return NextResponse.json({
      category: { id: row.id, name: row.name, image_url: row.imageUrl, sort_order: row.sortOrder, is_active: row.isActive },
    });
  } catch (e) {
    console.error("[building-pos/session/categories POST]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function PATCH(req: Request) {
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
  const data: {
    name?: string;
    imageUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  } = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
  if (parsed.data.image_url !== undefined) data.imageUrl = parsed.data.image_url?.trim() ?? "";
  if (parsed.data.sort_order !== undefined) data.sortOrder = parsed.data.sort_order;
  if (parsed.data.is_active !== undefined) data.isActive = parsed.data.is_active;
  const n = await prisma.buildingPosCategory.updateMany({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    data,
  });
  if (n.count === 0) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
  const row = await prisma.buildingPosCategory.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
  return NextResponse.json({
    category: { id: row.id, name: row.name, image_url: row.imageUrl, sort_order: row.sortOrder, is_active: row.isActive },
  });
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const inUse = await prisma.buildingPosMenuItem.count({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId, categoryId: id },
    });
    if (inUse > 0) {
      return NextResponse.json(
        { error: "ย้ายหรือลบเมนูในหมวดนี้ก่อน จึงจะลบหมวดหมู่ได้" },
        { status: 400 },
      );
    }
    const n = await prisma.buildingPosCategory.deleteMany({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (n.count === 0) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[building-pos/session/categories DELETE]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
