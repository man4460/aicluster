import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import type { PosOrderItem } from "@/systems/building-pos/building-pos-service";

const orderItemSchema = z.object({
  menu_item_id: z.number().int().positive(),
  name: z.string().min(1).max(160),
  price: z.number().int().min(0),
  qty: z.number().int().min(1).max(100),
  note: z.string().max(300),
});

const postSchema = z.object({
  customer_name: z.string().max(160).optional().nullable(),
  table_no: z.string().max(40).optional().nullable(),
  status: z.enum(["NEW", "PREPARING", "SERVED", "PAID"]),
  items: z.array(orderItemSchema).min(1),
  note: z.string().max(1000).optional().nullable(),
});

const patchSchema = z.object({
  status: z.enum(["NEW", "PREPARING", "SERVED", "PAID"]).optional(),
  payment_slip_url: z.string().max(2048).optional().nullable(),
});

function mapOrder(r: {
  id: number;
  createdAt: Date;
  customerName: string;
  tableNo: string;
  status: string;
  itemsJson: unknown;
  totalAmount: number;
  note: string;
  paymentSlipUrl?: string | null;
}) {
  const slip =
    typeof r.paymentSlipUrl === "string" ? r.paymentSlipUrl.trim() : "";
  const createdAt =
    r.createdAt instanceof Date && !Number.isNaN(r.createdAt.getTime()) ?
      r.createdAt.toISOString()
    : new Date().toISOString();
  return {
    id: r.id,
    created_at: createdAt,
    customer_name: r.customerName,
    table_no: r.tableNo,
    status: r.status as "NEW" | "PREPARING" | "SERVED" | "PAID",
    items: Array.isArray(r.itemsJson) ? (r.itemsJson as PosOrderItem[]) : [],
    total_amount: r.totalAmount,
    note: r.note,
    payment_slip_url: slip,
  };
}

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const rows = await prisma.buildingPosOrder.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ orders: rows.map(mapOrder) });
  } catch (e) {
    console.error("[building-pos/session/orders GET]", e);
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
  const total = parsed.data.items.reduce((s, x) => s + x.price * x.qty, 0);
  try {
    const row = await prisma.buildingPosOrder.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        customerName: parsed.data.customer_name?.trim() ?? "",
        tableNo: parsed.data.table_no?.trim() ?? "",
        status: parsed.data.status,
        itemsJson: parsed.data.items,
        totalAmount: total,
        note: parsed.data.note?.trim() ?? "",
      },
    });
    return NextResponse.json({ order: mapOrder(row) });
  } catch (e) {
    console.error("[building-pos/session/orders POST]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function PATCH(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await buildingPosOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getBuildingPosDataScope(own.ownerId);
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id") || "");
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });
  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  if (parsed.data.status === undefined && parsed.data.payment_slip_url === undefined) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่อัปเดต" }, { status: 400 });
  }
  try {
    const row = await prisma.buildingPosOrder.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!row) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });
    const updated = await prisma.buildingPosOrder.update({
      where: { id: row.id },
      data: {
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        ...(parsed.data.payment_slip_url !== undefined ?
          { paymentSlipUrl: parsed.data.payment_slip_url?.trim() ?? "" }
        : {}),
      },
    });
    return NextResponse.json({ order: mapOrder(updated) });
  } catch (e) {
    console.error("[building-pos/session/orders PATCH]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
