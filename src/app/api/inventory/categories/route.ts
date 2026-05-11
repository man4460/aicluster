import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withInventoryOwnerContext } from "@/systems/inventory/lib/api-auth";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export async function GET() {
  const auth = await withInventoryOwnerContext();
  if (!auth.ok) return auth.res;
  const rows = await prisma.inventoryCategory.findMany({
    where: { ownerUserId: auth.ctx.ownerUserId },
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
  });
  return NextResponse.json({
    categories: rows.map((r) => ({
      id: r.id,
      name: r.name,
      sortOrder: r.sortOrder,
      isActive: r.isActive,
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
    return NextResponse.json({ error: "ตั้งชื่อหมวด" }, { status: 400 });
  }
  try {
    const row = await prisma.inventoryCategory.create({
      data: {
        ownerUserId: auth.ctx.ownerUserId,
        name: parsed.data.name,
        sortOrder: parsed.data.sortOrder ?? 0,
      },
    });
    return NextResponse.json({
      category: { id: row.id, name: row.name, sortOrder: row.sortOrder, isActive: row.isActive },
    });
  } catch (e) {
    console.error("inventory categories POST", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
