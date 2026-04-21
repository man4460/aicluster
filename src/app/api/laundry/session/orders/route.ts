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

const postSchema = z.object({
  customer_name: z.string().min(1).max(160),
  customer_phone: z.string().max(32),
  pickup_address: z.string().min(1).max(500),
  dropoff_address: z.string().max(500).optional().nullable(),
  service_type: z.string().max(160).optional().nullable(),
  package_id: z.number().int().positive().nullable(),
  package_name: z.string().min(1).max(160),
  weight_kg: z.number().min(0).max(9999.999),
  item_count: z.number().int().min(0).max(999_999),
  final_price: z.number().int().min(0).max(9_999_999),
  note: z.string().max(1000).optional().nullable(),
  recorded_by_name: z.string().max(160).optional().nullable(),
  order_at: z.string().datetime().optional(),
  status: laundryOrderStatusZod.optional(),
});

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

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await laundryOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getLaundryDataScope(own.ownerId);

    const rows = await prisma.laundryOrder.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      orderBy: { orderAt: "desc" },
    });
    return NextResponse.json({ orders: rows.map(orderJson) });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/session/orders GET");
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await laundryOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getLaundryDataScope(own.ownerId);

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const phone = normalizePhone(parsed.data.customer_phone);
    const dropoff = (parsed.data.dropoff_address?.trim() || parsed.data.pickup_address.trim()).slice(0, 500);
    const serviceType = parsed.data.service_type?.trim() ?? "";
    const status = parsed.data.status ?? "PENDING_PICKUP";
    const packageId = parsed.data.package_id ?? null;

    if (packageId != null) {
      const pkg = await prisma.laundryPackage.findFirst({
        where: { id: packageId, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
        select: { id: true },
      });
      if (!pkg) return NextResponse.json({ error: "ไม่พบแพ็กเกจ" }, { status: 400 });
    }

    const row = await prisma.laundryOrder.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        orderAt: parsed.data.order_at ? new Date(parsed.data.order_at) : new Date(),
        customerName: parsed.data.customer_name.trim(),
        customerPhone: phone,
        pickupAddress: parsed.data.pickup_address.trim(),
        dropoffAddress: dropoff,
        serviceType,
        packageId,
        packageName: parsed.data.package_name.trim(),
        weightKg: new Prisma.Decimal(parsed.data.weight_kg),
        itemCount: parsed.data.item_count,
        finalPrice: parsed.data.final_price,
        note: parsed.data.note?.trim() ?? "",
        recordedByName: parsed.data.recorded_by_name?.trim() ?? "",
        status,
      },
    });

    return NextResponse.json({ order: orderJson(row) });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/session/orders POST");
  }
}
