import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withInventoryOwnerContext } from "@/systems/inventory/lib/api-auth";

const createSchema = z.object({
  code: z.string().trim().min(1).max(32),
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().max(255).optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export async function GET() {
  const auth = await withInventoryOwnerContext();
  if (!auth.ok) return auth.res;
  const rows = await prisma.inventoryWarehouse.findMany({
    where: { ownerUserId: auth.ctx.ownerUserId },
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
  });
  return NextResponse.json({
    warehouses: rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      address: r.address,
      isActive: r.isActive,
      sortOrder: r.sortOrder,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await withInventoryOwnerContext();
  if (!auth.ok) return auth.res;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ — กรอกรหัสและชื่อคลัง" }, { status: 400 });
  }
  try {
    const row = await prisma.inventoryWarehouse.create({
      data: {
        ownerUserId: auth.ctx.ownerUserId,
        code: parsed.data.code,
        name: parsed.data.name,
        address: parsed.data.address?.trim() || null,
        sortOrder: parsed.data.sortOrder ?? 0,
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
    console.error("inventory warehouses POST", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
