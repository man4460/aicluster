import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import {
  buildingPosNormalizePortalCartItems,
  normalizeBuildingPosPortalPaymentMode,
} from "@/lib/building-pos/portal-booking";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { stampBuildingPosOrderItemsKitchenDept } from "@/lib/building-pos/stamp-order-kitchen";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import { notifyBuildingPosOrderBoard } from "@/systems/building-pos/lib/order-board-sse";
import { mapBuildingPosOrderRow } from "@/lib/building-pos/order-map";

const patchSchema = z.object({
  id: z.string().min(10).max(64),
  status: z.enum(["SCHEDULED", "ARRIVED", "CANCELLED", "COMPLETED"]).optional(),
  sendToKitchen: z.boolean().optional(),
});

function mapReservation(row: {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  tablePreference: string;
  visitDateKey: string;
  visitTimeHm: string;
  itemsJson: unknown;
  itemsTotalBaht: number;
  paymentMode: string;
  payDueBaht: number;
  amountPaidBaht: number;
  paymentMethod: string;
  paymentSlipUrl: string;
  status: string;
  note: string;
  linkedOrderId: number | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    customerName: row.customerName,
    phone: row.phone,
    partySize: row.partySize,
    tablePreference: row.tablePreference || null,
    visitDateKey: row.visitDateKey,
    visitTimeHm: row.visitTimeHm,
    items: buildingPosNormalizePortalCartItems(row.itemsJson),
    itemsTotalBaht: row.itemsTotalBaht,
    paymentMode: normalizeBuildingPosPortalPaymentMode(row.paymentMode),
    payDueBaht: row.payDueBaht,
    amountPaidBaht: row.amountPaidBaht,
    paymentMethod: row.paymentMethod || null,
    paymentSlipUrl: row.paymentSlipUrl || null,
    status: row.status,
    note: row.note || null,
    linkedOrderId: row.linkedOrderId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);

    const url = new URL(req.url);
    const status = url.searchParams.get("status")?.trim();
    const dateKey = url.searchParams.get("date")?.trim();

    const rows = await prisma.buildingPosReservation.findMany({
      where: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        ...(status ? { status } : {}),
        ...(dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? { visitDateKey: dateKey } : {}),
      },
      orderBy: [{ visitDateKey: "asc" }, { visitTimeHm: "asc" }, { createdAt: "desc" }],
      take: 200,
    });

    return NextResponse.json({ reservations: rows.map(mapReservation) });
  } catch (e) {
    console.error("[building-pos/session/reservations GET]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const existing = await prisma.buildingPosReservation.findFirst({
      where: {
        id: parsed.data.id,
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
      },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });

    if (parsed.data.sendToKitchen) {
      if (existing.status === "CANCELLED") {
        return NextResponse.json({ error: "การจองถูกยกเลิกแล้ว" }, { status: 400 });
      }
      if (existing.linkedOrderId) {
        return NextResponse.json({ error: "ส่งเข้าครัวแล้ว" }, { status: 409 });
      }

      const cart = buildingPosNormalizePortalCartItems(existing.itemsJson);
      if (cart.length === 0) {
        return NextResponse.json({ error: "ไม่มีรายการพรีออเดอร์ให้ส่งครัว" }, { status: 400 });
      }

      const orderItems = cart.map((it) => ({
        menu_item_id: it.menuItemId,
        name: it.name,
        price: it.unitPrice,
        qty: it.qty,
        note: "",
      }));
      const stampedItems = await stampBuildingPosOrderItemsKitchenDept(
        own.ownerId,
        scope.trialSessionId,
        orderItems,
      );
      const total = orderItems.reduce((s, x) => s + x.price * x.qty, 0);

      const order = await prisma.buildingPosOrder.create({
        data: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          customerName: existing.customerName,
          tableNo: existing.tablePreference || "",
          status: "NEW",
          itemsJson: stampedItems,
          totalAmount: total,
          note: [
            existing.note,
            `จอง ${existing.visitDateKey} ${existing.visitTimeHm}`,
            `เบอร์ ${existing.phone}`,
            `จำนวน ${existing.partySize} คน`,
          ]
            .filter(Boolean)
            .join(" · ")
            .slice(0, 1000),
        },
      });

      const updated = await prisma.buildingPosReservation.update({
        where: { id: existing.id },
        data: {
          linkedOrderId: order.id,
          status: existing.status === "SCHEDULED" ? "ARRIVED" : existing.status,
        },
      });

      notifyBuildingPosOrderBoard(own.ownerId);

      return NextResponse.json({
        reservation: mapReservation(updated),
        order: mapBuildingPosOrderRow(order),
      });
    }

    if (!parsed.data.status) {
      return NextResponse.json({ error: "ระบุสถานะหรือส่งครัว" }, { status: 400 });
    }

    const updated = await prisma.buildingPosReservation.update({
      where: { id: existing.id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ reservation: mapReservation(updated) });
  } catch (e) {
    console.error("[building-pos/session/reservations PATCH]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
