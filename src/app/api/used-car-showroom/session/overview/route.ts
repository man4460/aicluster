import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { usedCarShowroomSessionContext } from "@/lib/used-car-showroom/session-context";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey, bangkokMonthKey } from "@/lib/time/bangkok";
import { mapUsedCarAppointment } from "@/systems/used-car-showroom/lib/mappers";
import { computeUsedCarVehiclePnl } from "@/systems/used-car-showroom/lib/pnl";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const today = bangkokDateKey();
    const month = bangkokMonthKey();

    const [vehicles, salesMonth, financePending, appointmentsTodayRows, reservationsPending] =
      await Promise.all([
        prisma.usedCarVehicle.findMany({
          where: { shopId: shop.id },
          select: {
            id: true,
            status: true,
            purchaseCostBaht: true,
            askingPriceBaht: true,
            costLines: { select: { amountBaht: true } },
            ledgerEntries: {
              where: { kind: "EXPENSE", category: { systemKey: "COMMISSION" } },
              select: { amountBaht: true },
            },
            sales: { select: { salePriceBaht: true, discountBaht: true }, take: 1 },
          },
        }),
        prisma.usedCarSale.findMany({
          where: { shopId: shop.id, soldOn: { startsWith: month } },
          select: { salePriceBaht: true, discountBaht: true },
        }),
        prisma.usedCarFinanceCase.count({
          where: {
            shopId: shop.id,
            status: { in: ["SUBMITTED", "WAITING_DOCS"] },
          },
        }),
        prisma.usedCarAppointment.findMany({
          where: {
            shopId: shop.id,
            appointmentOn: today,
            status: { not: "CANCELLED" },
          },
          include: { vehicle: { select: { brand: true, model: true, year: true } } },
          orderBy: [{ appointmentHm: "asc" }],
          take: 50,
        }),
        prisma.usedCarReservation.count({
          where: { shopId: shop.id, status: { in: ["PENDING", "PAID"] } },
        }),
      ]);

    const appointmentsTodayScheduled = appointmentsTodayRows.filter((a) => a.status === "SCHEDULED").length;

    const stockCount = vehicles.filter((v) =>
      ["PREP", "FOR_SALE", "RESERVED"].includes(v.status),
    ).length;
    const prepCount = vehicles.filter((v) => v.status === "PREP").length;
    const salesMonthBaht = salesMonth.reduce(
      (s, r) => s + Math.max(0, r.salePriceBaht - r.discountBaht),
      0,
    );

    let projectedProfitBaht = 0;
    for (const v of vehicles) {
      if (!["FOR_SALE", "RESERVED", "PREP"].includes(v.status)) continue;
      const prep = v.costLines.reduce((s, c) => s + c.amountBaht, 0);
      const commission = v.ledgerEntries.reduce((s, c) => s + c.amountBaht, 0);
      const sale = v.sales[0];
      const pnl = computeUsedCarVehiclePnl({
        purchaseCostBaht: v.purchaseCostBaht,
        prepCostBaht: prep,
        commissionBaht: commission,
        salePriceBaht: sale?.salePriceBaht ?? v.askingPriceBaht,
        discountBaht: sale?.discountBaht ?? 0,
      });
      projectedProfitBaht += pnl.profitBaht;
    }

    return NextResponse.json({
      stats: {
        stockCount,
        prepCount,
        salesMonthBaht,
        salesMonthCount: salesMonth.length,
        projectedProfitBaht,
        financePendingCount: financePending,
        appointmentsTodayCount: appointmentsTodayScheduled,
        reservationsPendingCount: reservationsPending,
      },
      appointmentsToday: appointmentsTodayRows.map(mapUsedCarAppointment),
      today,
      month,
    });
  } catch (e) {
    console.error("[used-car-showroom/session/overview GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
