import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { normalizePhone } from "@/lib/car-wash/http";
import { laundryOwnerFromAuth } from "@/lib/laundry/api-owner";
import { laundryOrderStatusZod, normalizeLaundryOrderStatus } from "@/lib/laundry/order-status";
import { jsonLaundrySessionError } from "@/lib/laundry/route-errors";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";

const patchSchema = z
  .object({
    customer_name: z.string().min(1).max(160).optional(),
    customer_phone: z.string().max(32).optional(),
    pickup_address: z.string().min(1).max(500).optional(),
    dropoff_address: z.string().max(500).optional().nullable(),
    service_type: z.string().max(160).optional().nullable(),
    package_id: z.number().int().positive().nullable().optional(),
    package_name: z.string().min(1).max(160).optional(),
    weight_kg: z.number().min(0).max(9999.999).optional(),
    item_count: z.number().int().min(0).max(999_999).optional(),
    final_price: z.number().int().min(0).max(9_999_999).optional(),
    note: z.string().max(1000).optional().nullable(),
    recorded_by_name: z.string().max(160).optional().nullable(),
    order_at: z.string().datetime().optional(),
    status: laundryOrderStatusZod.optional(),
  })
  .refine(
    (d) =>
      d.customer_name !== undefined ||
      d.customer_phone !== undefined ||
      d.pickup_address !== undefined ||
      d.dropoff_address !== undefined ||
      d.service_type !== undefined ||
      d.package_id !== undefined ||
      d.package_name !== undefined ||
      d.weight_kg !== undefined ||
      d.item_count !== undefined ||
      d.final_price !== undefined ||
      d.note !== undefined ||
      d.recorded_by_name !== undefined ||
      d.order_at !== undefined ||
      d.status !== undefined,
    { message: "ต้องส่งอย่างน้อยหนึ่งฟิลด์" },
  );

function orderJson(row: {
  id: number;
  orderAt: Date;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  serviceType: string;
  packageId: number | null;
  packageName: string;
  weightKg: Prisma.Decimal;
  itemCount: number;
  finalPrice: number;
  note: string;
  recordedByName: string;
  status: string;
}) {
  return {
    id: row.id,
    order_at: row.orderAt.toISOString(),
    customer_name: row.customerName,
    customer_phone: row.customerPhone,
    pickup_address: row.pickupAddress,
    dropoff_address: row.dropoffAddress,
    service_type: row.serviceType,
    package_id: row.packageId,
    package_name: row.packageName,
    weight_kg: Number(row.weightKg),
    item_count: row.itemCount,
    final_price: row.finalPrice,
    note: row.note,
    recorded_by_name: row.recordedByName,
    status: normalizeLaundryOrderStatus(row.status),
  };
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await laundryOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getLaundryDataScope(own.ownerId);

    const p = await ctx.params;
    const id = Number(p.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const row = await prisma.laundryOrder.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!row) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

    const d = parsed.data;
    if (d.package_id !== undefined && d.package_id !== null) {
      const pkg = await prisma.laundryPackage.findFirst({
        where: { id: d.package_id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
        select: { id: true },
      });
      if (!pkg) return NextResponse.json({ error: "ไม่พบแพ็กเกจ" }, { status: 400 });
    }

    const updated = await prisma.laundryOrder.update({
      where: { id: row.id },
      data: {
        ...(d.customer_name !== undefined ? { customerName: d.customer_name.trim() } : {}),
        ...(d.customer_phone !== undefined ? { customerPhone: normalizePhone(d.customer_phone) } : {}),
        ...(d.pickup_address !== undefined ? { pickupAddress: d.pickup_address.trim() } : {}),
        ...(d.dropoff_address !== undefined ?
          { dropoffAddress: (d.dropoff_address?.trim() || row.pickupAddress).slice(0, 500) }
        : {}),
        ...(d.service_type !== undefined ? { serviceType: d.service_type?.trim() ?? "" } : {}),
        ...(d.package_id !== undefined ? { packageId: d.package_id } : {}),
        ...(d.package_name !== undefined ? { packageName: d.package_name.trim() } : {}),
        ...(d.weight_kg !== undefined ? { weightKg: new Prisma.Decimal(d.weight_kg) } : {}),
        ...(d.item_count !== undefined ? { itemCount: d.item_count } : {}),
        ...(d.final_price !== undefined ? { finalPrice: d.final_price } : {}),
        ...(d.note !== undefined ? { note: d.note?.trim() ?? "" } : {}),
        ...(d.recorded_by_name !== undefined ? { recordedByName: d.recorded_by_name?.trim() ?? "" } : {}),
        ...(d.order_at !== undefined ? { orderAt: new Date(d.order_at) } : {}),
        ...(d.status !== undefined ? { status: d.status } : {}),
      },
    });

    return NextResponse.json({ order: orderJson(updated) });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/session/orders/[id] PATCH");
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await laundryOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getLaundryDataScope(own.ownerId);

    const p = await ctx.params;
    const id = Number(p.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

    const row = await prisma.laundryOrder.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!row) return NextResponse.json({ ok: false });
    await prisma.laundryOrder.delete({ where: { id: row.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/session/orders/[id] DELETE");
  }
}
