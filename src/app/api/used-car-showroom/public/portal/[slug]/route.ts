import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gateUsedCarShowroomPublicShop } from "@/systems/used-car-showroom/lib/load-public-shop";
import { mapUsedCarShop, mapUsedCarVehicle } from "@/systems/used-car-showroom/lib/mappers";
import { bangkokDateKey } from "@/lib/time/bangkok";

type Ctx = { params: Promise<{ slug: string }> };

/** ร้าน + รถที่เปิดขาย/ติดจอง สำหรับเว็บ /car/[slug] */
export async function GET(req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const url = new URL(req.url);
    const gate = await gateUsedCarShowroomPublicShop(slug, url.searchParams.get("t"));
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }
    const { shop } = gate;
    const today = bangkokDateKey();

    const [vehicles, promotions] = await Promise.all([
      prisma.usedCarVehicle.findMany({
        where: {
          shopId: shop.id,
          status: { in: ["FOR_SALE", "RESERVED"] },
        },
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          videos: { orderBy: { sortOrder: "asc" }, take: 2 },
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 120,
      }),
      prisma.usedCarPromotion.findMany({
        where: {
          shopId: shop.id,
          isActive: true,
          startsOn: { lte: today },
          endsOn: { gte: today },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      shop: mapUsedCarShop(shop),
      vehicles: vehicles.map((v) => mapUsedCarVehicle(v)),
      promotions: promotions.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        kind: p.kind,
        valueBaht: p.valueBaht,
        valuePercent: p.valuePercent,
        giftLabel: p.giftLabel,
        vehicleId: p.vehicleId,
        startsOn: p.startsOn,
        endsOn: p.endsOn,
      })),
      trialSessionId: shop.trialSessionId,
    });
  } catch (e) {
    console.error("[used-car-showroom/public/portal/[slug] GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
