import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withInventoryOwnerContext } from "@/systems/inventory/lib/api-auth";

const patchSchema = z.object({
  code: z.string().trim().min(1).max(32).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  address: z.string().trim().max(255).optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
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

  const existing = await prisma.inventoryWarehouse.findFirst({
    where: { id, ownerUserId: auth.ctx.ownerUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบคลัง" }, { status: 404 });

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
    const row = await prisma.inventoryWarehouse.update({
      where: { id },
      data: {
        ...(parsed.data.code !== undefined ? { code: parsed.data.code } : {}),
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.address !== undefined
          ? { address: parsed.data.address?.trim() || null }
          : {}),
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
        ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
      },
    });
    return NextResponse.json({
      warehouse: {
        id: row.id,
        code: row.code,
        name: row.name,
        address: row.address,
        isActive: row.isActive,
        sortOrder: row.sortOrder,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("inventory_warehouses_owner_code_uq")) {
      return NextResponse.json({ error: "รหัสคลังซ้ำ — เปลี่ยนรหัสใหม่" }, { status: 400 });
    }
    console.error("inventory warehouses PATCH", e);
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

  const existing = await prisma.inventoryWarehouse.findFirst({
    where: { id, ownerUserId: auth.ctx.ownerUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบคลัง" }, { status: 404 });

  try {
    await prisma.inventoryWarehouse.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("inventory warehouses DELETE", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ — อาจถูกใช้งานอยู่" }, { status: 400 });
  }
}
