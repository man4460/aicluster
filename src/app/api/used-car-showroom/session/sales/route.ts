import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { usedCarShowroomSessionContext } from "@/lib/used-car-showroom/session-context";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { findUsedCarFinanceCategoryBySystemKey } from "@/systems/used-car-showroom/lib/ensure-shop";
import { isUsedCarPaymentMethod } from "@/systems/used-car-showroom/lib/payment-method";

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop, scope } = await usedCarShowroomSessionContext(own.ownerId);
    const body = (await req.json()) as Record<string, unknown>;
    const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : "";
    if (!vehicleId) return NextResponse.json({ error: "ระบุรถ" }, { status: 400 });
    const vehicle = await prisma.usedCarVehicle.findFirst({ where: { id: vehicleId, shopId: shop.id } });
    if (!vehicle) return NextResponse.json({ error: "ไม่พบรถ" }, { status: 404 });
    const salePriceBaht = Math.max(0, Math.round(Number(body.salePriceBaht) || 0));
    if (salePriceBaht <= 0) return NextResponse.json({ error: "ระบุราคาขาย" }, { status: 400 });
    const discountBaht = Math.max(0, Math.round(Number(body.discountBaht) || 0));
    const paymentMethod = isUsedCarPaymentMethod(body.paymentMethod) ? body.paymentMethod : "CASH";
    const soldOn =
      typeof body.soldOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.soldOn)
        ? body.soldOn
        : bangkokDateKey();

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.usedCarSale.create({
        data: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          shopId: shop.id,
          vehicleId,
          customerId: typeof body.customerId === "string" ? body.customerId : null,
          reservationId: typeof body.reservationId === "string" ? body.reservationId : null,
          staffId: typeof body.staffId === "string" ? body.staffId : null,
          salePriceBaht,
          discountBaht,
          taxInvoiceEnabled: body.taxInvoiceEnabled === true,
          paymentMethod,
          slipImageUrl: typeof body.slipImageUrl === "string" ? body.slipImageUrl.slice(0, 512) : null,
          soldOn,
          note: typeof body.note === "string" ? body.note : null,
        },
      });
      await tx.usedCarVehicle.update({
        where: { id: vehicleId },
        data: { status: "SOLD", soldAt: new Date() },
      });
      if (typeof body.reservationId === "string") {
        await tx.usedCarReservation.updateMany({
          where: { id: body.reservationId, shopId: shop.id },
          data: { status: "CONVERTED" },
        });
      }
      const cat = await findUsedCarFinanceCategoryBySystemKey(tx, shop.id, "SALE");
      const net = Math.max(0, salePriceBaht - discountBaht);
      await tx.usedCarLedgerEntry.create({
        data: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          shopId: shop.id,
          categoryId: cat?.id ?? null,
          vehicleId,
          saleId: sale.id,
          kind: "INCOME",
          title: `ขายรถ · ${vehicle.brand} ${vehicle.model}`,
          amountBaht: net,
          entryOn: soldOn,
          paymentMethod,
          slipImageUrl: typeof body.slipImageUrl === "string" ? body.slipImageUrl.slice(0, 512) : null,
        },
      });
      return sale;
    });

    return NextResponse.json({ sale: result }, { status: 201 });
  } catch (e) {
    console.error("[used-car-showroom/session/sales POST]", e);
    return NextResponse.json({ error: "ปิดดีลไม่สำเร็จ" }, { status: 500 });
  }
}
