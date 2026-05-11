import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withInventoryOwnerContext } from "@/systems/inventory/lib/api-auth";

const createSchema = z.object({
  sku: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(160),
  categoryId: z.number().int().positive().optional().nullable(),
  unit: z.string().trim().max(24).optional(),
  costPrice: z.number().min(0).max(99999999).optional(),
  salePrice: z.number().min(0).max(99999999).optional(),
  minStock: z.number().int().min(0).max(999999).optional(),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
});

export async function GET() {
  const auth = await withInventoryOwnerContext();
  if (!auth.ok) return auth.res;
  const ownerUserId = auth.ctx.ownerUserId;

  const [rows, stocks, categories] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { ownerUserId },
      orderBy: [{ isActive: "desc" }, { id: "desc" }],
    }),
    prisma.inventoryStock.findMany({
      where: { ownerUserId },
      select: {
        itemId: true,
        warehouseId: true,
        quantity: true,
        warehouse: { select: { code: true, name: true, isActive: true } },
      },
    }),
    prisma.inventoryCategory.findMany({
      where: { ownerUserId },
      select: { id: true, name: true },
    }),
  ]);

  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const stockMap = new Map<number, { warehouseId: number; warehouseCode: string; warehouseName: string; quantity: number }[]>();
  for (const s of stocks) {
    if (!s.warehouse?.isActive) continue;
    const arr = stockMap.get(s.itemId) ?? [];
    arr.push({
      warehouseId: s.warehouseId,
      warehouseCode: s.warehouse.code,
      warehouseName: s.warehouse.name,
      quantity: s.quantity,
    });
    stockMap.set(s.itemId, arr);
  }

  return NextResponse.json({
    items: rows.map((r) => {
      const itemStocks = stockMap.get(r.id) ?? [];
      const totalStock = itemStocks.reduce((acc, s) => acc + s.quantity, 0);
      return {
        id: r.id,
        sku: r.sku,
        name: r.name,
        categoryId: r.categoryId,
        categoryName: r.categoryId ? catMap.get(r.categoryId) ?? null : null,
        unit: r.unit,
        costPrice: Number(r.costPrice),
        salePrice: Number(r.salePrice),
        minStock: r.minStock,
        imageUrl: r.imageUrl,
        note: r.note,
        isActive: r.isActive,
        totalStock,
        stocks: itemStocks,
      };
    }),
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
    return NextResponse.json({ error: "ข้อมูลไม่ครบ — กรอก SKU และชื่อสินค้า" }, { status: 400 });
  }
  try {
    const row = await prisma.inventoryItem.create({
      data: {
        ownerUserId: auth.ctx.ownerUserId,
        sku: parsed.data.sku,
        name: parsed.data.name,
        categoryId: parsed.data.categoryId ?? null,
        unit: parsed.data.unit?.trim() || "ชิ้น",
        costPrice: parsed.data.costPrice ?? 0,
        salePrice: parsed.data.salePrice ?? 0,
        minStock: parsed.data.minStock ?? 0,
        imageUrl: parsed.data.imageUrl?.trim() || null,
        note: parsed.data.note?.trim() || null,
      },
    });
    return NextResponse.json({
      item: {
        id: row.id,
        sku: row.sku,
        name: row.name,
        categoryId: row.categoryId,
        categoryName: null,
        unit: row.unit,
        costPrice: Number(row.costPrice),
        salePrice: Number(row.salePrice),
        minStock: row.minStock,
        imageUrl: row.imageUrl,
        note: row.note,
        isActive: row.isActive,
        totalStock: 0,
        stocks: [],
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("inventory_items_owner_sku_uq")) {
      return NextResponse.json({ error: "SKU ซ้ำ — เปลี่ยน SKU ใหม่" }, { status: 400 });
    }
    console.error("inventory items POST", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
