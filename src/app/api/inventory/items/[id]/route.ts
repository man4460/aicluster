import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withInventoryOwnerContext } from "@/systems/inventory/lib/api-auth";

const patchSchema = z.object({
  sku: z.string().trim().min(1).max(64).optional(),
  name: z.string().trim().min(1).max(160).optional(),
  categoryId: z.number().int().positive().optional().nullable(),
  unit: z.string().trim().max(24).optional(),
  costPrice: z.number().min(0).max(99999999).optional(),
  salePrice: z.number().min(0).max(99999999).optional(),
  minStock: z.number().int().min(0).max(999999).optional(),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
});

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  const auth = await withInventoryOwnerContext();
  if (!auth.ok) return auth.res;

  const existing = await prisma.inventoryItem.findFirst({
    where: { id, ownerUserId: auth.ctx.ownerUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  try {
    await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(parsed.data.sku !== undefined ? { sku: parsed.data.sku } : {}),
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.categoryId !== undefined
          ? { categoryId: parsed.data.categoryId ?? null }
          : {}),
        ...(parsed.data.unit !== undefined ? { unit: parsed.data.unit?.trim() || "ชิ้น" } : {}),
        ...(parsed.data.costPrice !== undefined ? { costPrice: parsed.data.costPrice } : {}),
        ...(parsed.data.salePrice !== undefined ? { salePrice: parsed.data.salePrice } : {}),
        ...(parsed.data.minStock !== undefined ? { minStock: parsed.data.minStock } : {}),
        ...(parsed.data.imageUrl !== undefined
          ? { imageUrl: parsed.data.imageUrl?.trim() || null }
          : {}),
        ...(parsed.data.note !== undefined ? { note: parsed.data.note?.trim() || null } : {}),
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("inventory_items_owner_sku_uq")) {
      return NextResponse.json({ error: "SKU ซ้ำ — เปลี่ยน SKU ใหม่" }, { status: 400 });
    }
    console.error("inventory items PATCH", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  const auth = await withInventoryOwnerContext();
  if (!auth.ok) return auth.res;

  const existing = await prisma.inventoryItem.findFirst({
    where: { id, ownerUserId: auth.ctx.ownerUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });

  try {
    await prisma.inventoryItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("inventory items DELETE", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 400 });
  }
}
