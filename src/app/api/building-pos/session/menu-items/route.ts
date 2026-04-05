import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";

const postSchema = z.object({
  category_id: z.number().int().positive(),
  name: z.string().min(1).max(160),
  image_url: z.string().max(512).optional().nullable(),
  price: z.number().int().min(0).max(999999),
  description: z.string().max(800).optional().nullable(),
  is_active: z.boolean(),
  is_featured: z.boolean().optional(),
});

const patchSchema = z
  .object({
    category_id: z.number().int().positive().optional(),
    name: z.string().min(1).max(160).optional(),
    image_url: z.string().max(512).optional().nullable(),
    price: z.number().int().min(0).max(999999).optional(),
    description: z.string().max(800).optional().nullable(),
    is_active: z.boolean().optional(),
    is_featured: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "empty" });

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const rows = await prisma.buildingPosMenuItem.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      orderBy: { id: "asc" },
    });
    return NextResponse.json({
      menu_items: rows.map((r) => ({
        id: r.id,
        category_id: r.categoryId,
        name: r.name,
        image_url: r.imageUrl,
        price: r.price,
        description: r.description,
        is_active: r.isActive,
        is_featured: r.isFeatured,
      })),
    });
  } catch (e) {
    console.error("[building-pos/session/menu-items GET]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await buildingPosOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getBuildingPosDataScope(own.ownerId);
  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 }); }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const row = await prisma.buildingPosMenuItem.create({
    data: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      categoryId: parsed.data.category_id,
      name: parsed.data.name.trim(),
      imageUrl: parsed.data.image_url?.trim() ?? "",
      price: parsed.data.price,
      description: parsed.data.description?.trim() ?? "",
      isActive: parsed.data.is_active,
      isFeatured: parsed.data.is_featured ?? false,
    },
  });
  return NextResponse.json({
    menu_item: {
      id: row.id,
      category_id: row.categoryId,
      name: row.name,
      image_url: row.imageUrl,
      price: row.price,
      description: row.description,
      is_active: row.isActive,
      is_featured: row.isFeatured,
    },
  });
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
    const data: {
      categoryId?: number;
      name?: string;
      imageUrl?: string;
      price?: number;
      description?: string;
      isActive?: boolean;
      isFeatured?: boolean;
    } = {};
    if (parsed.data.category_id !== undefined) data.categoryId = parsed.data.category_id;
    if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
    if (parsed.data.image_url !== undefined) data.imageUrl = parsed.data.image_url?.trim() ?? "";
    if (parsed.data.price !== undefined) data.price = parsed.data.price;
    if (parsed.data.description !== undefined) data.description = parsed.data.description?.trim() ?? "";
    if (parsed.data.is_active !== undefined) data.isActive = parsed.data.is_active;
    if (parsed.data.is_featured !== undefined) data.isFeatured = parsed.data.is_featured;
    const row = await prisma.buildingPosMenuItem.updateMany({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      data,
    });
    if (row.count === 0) return NextResponse.json({ error: "ไม่พบเมนู" }, { status: 404 });
    const updated = await prisma.buildingPosMenuItem.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!updated) return NextResponse.json({ error: "ไม่พบเมนู" }, { status: 404 });
    return NextResponse.json({
      menu_item: {
        id: updated.id,
        category_id: updated.categoryId,
        name: updated.name,
        image_url: updated.imageUrl,
        price: updated.price,
        description: updated.description,
        is_active: updated.isActive,
        is_featured: updated.isFeatured,
      },
    });
  } catch (e) {
    console.error("[building-pos/session/menu-items PATCH]", e);
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
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const n = await prisma.buildingPosMenuItem.deleteMany({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (n.count === 0) return NextResponse.json({ error: "ไม่พบเมนู" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[building-pos/session/menu-items DELETE]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
