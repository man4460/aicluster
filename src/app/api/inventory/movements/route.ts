import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withInventoryOwnerContext } from "@/systems/inventory/lib/api-auth";

const movementSchema = z
  .object({
    type: z.enum(["IN", "OUT", "TRANSFER", "ADJUST"]),
    itemId: z.number().int().positive(),
    fromWarehouseId: z.number().int().positive().optional().nullable(),
    toWarehouseId: z.number().int().positive().optional().nullable(),
    quantity: z.number().int().min(1).max(999999),
    unitCost: z.number().min(0).max(99999999).optional().nullable(),
    reference: z.string().trim().max(120).optional().nullable(),
    note: z.string().max(2000).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "IN" && !val.toWarehouseId) {
      ctx.addIssue({ code: "custom", message: "รับเข้า ต้องเลือกคลังปลายทาง" });
    }
    if (val.type === "OUT" && !val.fromWarehouseId) {
      ctx.addIssue({ code: "custom", message: "เบิกออก ต้องเลือกคลังต้นทาง" });
    }
    if (val.type === "TRANSFER" && (!val.fromWarehouseId || !val.toWarehouseId)) {
      ctx.addIssue({ code: "custom", message: "โอน ต้องเลือกต้นทางและปลายทาง" });
    }
    if (
      val.type === "TRANSFER" &&
      val.fromWarehouseId &&
      val.toWarehouseId &&
      val.fromWarehouseId === val.toWarehouseId
    ) {
      ctx.addIssue({ code: "custom", message: "ต้นทางและปลายทางต้องต่างกัน" });
    }
    if (val.type === "ADJUST" && !val.fromWarehouseId && !val.toWarehouseId) {
      ctx.addIssue({ code: "custom", message: "ปรับยอด ต้องเลือกคลัง" });
    }
  });

export async function GET(req: Request) {
  const auth = await withInventoryOwnerContext();
  if (!auth.ok) return auth.res;
  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") ?? 50)));
  const itemIdParam = url.searchParams.get("itemId");
  const itemIdFilter = itemIdParam ? Number(itemIdParam) : null;

  const rows = await prisma.inventoryMovement.findMany({
    where: {
      ownerUserId: auth.ctx.ownerUserId,
      ...(itemIdFilter && Number.isFinite(itemIdFilter) ? { itemId: itemIdFilter } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    include: {
      item: { select: { sku: true, name: true } },
      fromWarehouse: { select: { name: true } },
      toWarehouse: { select: { name: true } },
    },
  });

  return NextResponse.json({
    movements: rows.map((r) => ({
      id: r.id,
      type: r.type,
      itemId: r.itemId,
      itemSku: r.item.sku,
      itemName: r.item.name,
      fromWarehouseId: r.fromWarehouseId,
      fromWarehouseName: r.fromWarehouse?.name ?? null,
      toWarehouseId: r.toWarehouseId,
      toWarehouseName: r.toWarehouse?.name ?? null,
      quantity: r.quantity,
      unitCost: r.unitCost ? Number(r.unitCost) : null,
      reference: r.reference,
      note: r.note,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const auth = await withInventoryOwnerContext();
  if (!auth.ok) return auth.res;
  const ownerUserId = auth.ctx.ownerUserId;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = movementSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
    return NextResponse.json({ error: first }, { status: 400 });
  }
  const { type, itemId, fromWarehouseId, toWarehouseId, quantity, unitCost, reference, note } =
    parsed.data;

  const [item, fromWh, toWh] = await Promise.all([
    prisma.inventoryItem.findFirst({
      where: { id: itemId, ownerUserId },
      select: { id: true, costPrice: true, isActive: true },
    }),
    fromWarehouseId
      ? prisma.inventoryWarehouse.findFirst({
          where: { id: fromWarehouseId, ownerUserId },
          select: { id: true, isActive: true },
        })
      : Promise.resolve(null),
    toWarehouseId
      ? prisma.inventoryWarehouse.findFirst({
          where: { id: toWarehouseId, ownerUserId },
          select: { id: true, isActive: true },
        })
      : Promise.resolve(null),
  ]);

  if (!item) return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
  if (fromWarehouseId && !fromWh)
    return NextResponse.json({ error: "ไม่พบคลังต้นทาง" }, { status: 404 });
  if (toWarehouseId && !toWh)
    return NextResponse.json({ error: "ไม่พบคลังปลายทาง" }, { status: 404 });

  try {
    const movement = await prisma.$transaction(async (tx) => {
      // อัปเดต stock ตามประเภท
      if (type === "IN" && toWarehouseId) {
        await tx.inventoryStock.upsert({
          where: { itemId_warehouseId: { itemId, warehouseId: toWarehouseId } },
          create: { ownerUserId, itemId, warehouseId: toWarehouseId, quantity },
          update: { quantity: { increment: quantity } },
        });
      } else if (type === "OUT" && fromWarehouseId) {
        const existing = await tx.inventoryStock.findUnique({
          where: { itemId_warehouseId: { itemId, warehouseId: fromWarehouseId } },
          select: { quantity: true },
        });
        if (!existing || existing.quantity < quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }
        await tx.inventoryStock.update({
          where: { itemId_warehouseId: { itemId, warehouseId: fromWarehouseId } },
          data: { quantity: { decrement: quantity } },
        });
      } else if (type === "TRANSFER" && fromWarehouseId && toWarehouseId) {
        const existing = await tx.inventoryStock.findUnique({
          where: { itemId_warehouseId: { itemId, warehouseId: fromWarehouseId } },
          select: { quantity: true },
        });
        if (!existing || existing.quantity < quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }
        await tx.inventoryStock.update({
          where: { itemId_warehouseId: { itemId, warehouseId: fromWarehouseId } },
          data: { quantity: { decrement: quantity } },
        });
        await tx.inventoryStock.upsert({
          where: { itemId_warehouseId: { itemId, warehouseId: toWarehouseId } },
          create: { ownerUserId, itemId, warehouseId: toWarehouseId, quantity },
          update: { quantity: { increment: quantity } },
        });
      } else if (type === "ADJUST") {
        // ADJUST: ถ้ามี toWarehouseId = เพิ่มยอด · fromWarehouseId = ลดยอด (เลือกอย่างใดอย่างหนึ่งหรือทั้งสอง)
        if (toWarehouseId) {
          await tx.inventoryStock.upsert({
            where: { itemId_warehouseId: { itemId, warehouseId: toWarehouseId } },
            create: { ownerUserId, itemId, warehouseId: toWarehouseId, quantity },
            update: { quantity: { increment: quantity } },
          });
        }
        if (fromWarehouseId) {
          const existing = await tx.inventoryStock.findUnique({
            where: { itemId_warehouseId: { itemId, warehouseId: fromWarehouseId } },
            select: { quantity: true },
          });
          if (!existing || existing.quantity < quantity) {
            throw new Error("INSUFFICIENT_STOCK");
          }
          await tx.inventoryStock.update({
            where: { itemId_warehouseId: { itemId, warehouseId: fromWarehouseId } },
            data: { quantity: { decrement: quantity } },
          });
        }
      }

      // บันทึกประวัติ
      const mv = await tx.inventoryMovement.create({
        data: {
          ownerUserId,
          type,
          itemId,
          fromWarehouseId: fromWarehouseId ?? null,
          toWarehouseId: toWarehouseId ?? null,
          quantity,
          unitCost: unitCost ?? null,
          reference: reference?.trim() || null,
          note: note?.trim() || null,
        },
      });
      return mv;
    });

    return NextResponse.json({ id: movement.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "INSUFFICIENT_STOCK") {
      return NextResponse.json({ error: "สต๊อกในคลังต้นทางไม่พอ" }, { status: 400 });
    }
    console.error("inventory movements POST", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
