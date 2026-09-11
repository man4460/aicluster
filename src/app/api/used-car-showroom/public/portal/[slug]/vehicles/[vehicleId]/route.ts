import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gateUsedCarShowroomPublicShop } from "@/systems/used-car-showroom/lib/load-public-shop";
import { mapUsedCarShop, mapUsedCarVehicle } from "@/systems/used-car-showroom/lib/mappers";
import { bangkokDateKey } from "@/lib/time/bangkok";

type Ctx = { params: Promise<{ slug: string; vehicleId: string }> };

/** รายละเอียดรถสำหรับ /car/[slug]/v/[vehicleId] */
export async function GET(req: Request, ctx: Ctx) {
  try {
    const { slug, vehicleId } = await ctx.params;
    const url = new URL(req.url);
    const gate = await gateUsedCarShowroomPublicShop(slug, url.searchParams.get("t"));
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }
    const { shop } = gate;

    const vehicle = await prisma.usedCarVehicle.findFirst({
      where: {
        id: vehicleId,
        shopId: shop.id,
        status: { in: ["FOR_SALE", "RESERVED"] },
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        videos: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!vehicle) {
      return NextResponse.json({ error: "ไม่พบรถ หรือยังไม่เปิดขาย" }, { status: 404 });
    }

    const today = bangkokDateKey();
    const promotions = await prisma.usedCarPromotion.findMany({
      where: {
        shopId: shop.id,
        isActive: true,
        startsOn: { lte: today },
        endsOn: { gte: today },
        OR: [{ vehicleId: null }, { vehicleId: vehicle.id }],
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      shop: mapUsedCarShop(shop),
      vehicle: mapUsedCarVehicle(vehicle),
      promotions: promotions.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        kind: p.kind,
        valueBaht: p.valueBaht,
        valuePercent: p.valuePercent,
        giftLabel: p.giftLabel,
        vehicleId: p.vehicleId,
      })),
      trialSessionId: shop.trialSessionId,
    });
  } catch (e) {
    console.error("[used-car-showroom/public/portal/[slug]/vehicles GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
