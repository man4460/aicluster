import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withInventoryOwnerContext } from "@/systems/inventory/lib/api-auth";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
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

  const existing = await prisma.inventoryCategory.findFirst({
    where: { id, ownerUserId: auth.ctx.ownerUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบหมวด" }, { status: 404 });

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
    const row = await prisma.inventoryCategory.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
      },
    });
    return NextResponse.json({
      category: { id: row.id, name: row.name, sortOrder: row.sortOrder, isActive: row.isActive },
    });
  } catch (e) {
    console.error("inventory categories PATCH", e);
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

  const existing = await prisma.inventoryCategory.findFirst({
    where: { id, ownerUserId: auth.ctx.ownerUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบหมวด" }, { status: 404 });

  try {
    await prisma.inventoryCategory.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("inventory categories DELETE", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 400 });
  }
}
