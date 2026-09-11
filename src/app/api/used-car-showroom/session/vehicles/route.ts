import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { usedCarShowroomSessionContext } from "@/lib/used-car-showroom/session-context";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { findUsedCarFinanceCategoryBySystemKey } from "@/systems/used-car-showroom/lib/ensure-shop";
import { mapUsedCarVehicle } from "@/systems/used-car-showroom/lib/mappers";
import { isUsedCarVehicleStatus } from "@/systems/used-car-showroom/lib/status";

const vehicleInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  videos: { orderBy: { sortOrder: "asc" as const } },
  documents: true,
  costLines: { orderBy: { spentAt: "desc" as const } },
};

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q")?.trim() ?? "";

    const rows = await prisma.usedCarVehicle.findMany({
      where: {
        shopId: shop.id,
        ...(status && isUsedCarVehicleStatus(status) ? { status } : {}),
        ...(q
          ? {
              OR: [
                { brand: { contains: q } },
                { model: { contains: q } },
                { plateNumber: { contains: q } },
                { vin: { contains: q } },
              ],
            }
          : {}),
      },
      include: vehicleInclude,
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ vehicles: rows.map(mapUsedCarVehicle) });
  } catch (e) {
    console.error("[used-car-showroom/session/vehicles GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop, scope } = await usedCarShowroomSessionContext(own.ownerId);
    const body = (await req.json()) as Record<string, unknown>;

    const brand = typeof body.brand === "string" ? body.brand.trim().slice(0, 80) : "";
    const model = typeof body.model === "string" ? body.model.trim().slice(0, 120) : "";
    if (!brand || !model) {
      return NextResponse.json({ error: "กรอกยี่ห้อและรุ่น" }, { status: 400 });
    }
    const purchaseCostBaht = Math.max(0, Math.round(Number(body.purchaseCostBaht) || 0));
    const askingPriceBaht = Math.max(0, Math.round(Number(body.askingPriceBaht) || 0));
    const status = isUsedCarVehicleStatus(body.status) ? body.status : "PREP";

    const vehicle = await prisma.$transaction(async (tx) => {
      const created = await tx.usedCarVehicle.create({
        data: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          shopId: shop.id,
          status,
          brand,
          model,
          year: typeof body.year === "number" ? body.year : body.year ? Number(body.year) : null,
          color: typeof body.color === "string" ? body.color.slice(0, 60) : null,
          mileageKm: typeof body.mileageKm === "number" ? body.mileageKm : null,
          transmission: typeof body.transmission === "string" ? body.transmission.slice(0, 24) : null,
          fuelType: typeof body.fuelType === "string" ? body.fuelType.slice(0, 24) : null,
          bodyType: typeof body.bodyType === "string" ? body.bodyType.slice(0, 24) : null,
          plateNumber: typeof body.plateNumber === "string" ? body.plateNumber.slice(0, 32) : null,
          vin: typeof body.vin === "string" ? body.vin.slice(0, 64) : null,
          engineNumber: typeof body.engineNumber === "string" ? body.engineNumber.slice(0, 64) : null,
          hasRegistrationBook: body.hasRegistrationBook === true,
          purchaseCostBaht,
          askingPriceBaht,
          description: typeof body.description === "string" ? body.description : null,
          note: typeof body.note === "string" ? body.note : null,
          purchasedAt: new Date(),
        },
        include: vehicleInclude,
      });

      if (purchaseCostBaht > 0) {
        const cat = await findUsedCarFinanceCategoryBySystemKey(tx, shop.id, "PURCHASE");
        await tx.usedCarLedgerEntry.create({
          data: {
            ownerUserId: own.ownerId,
            trialSessionId: scope.trialSessionId,
            shopId: shop.id,
            categoryId: cat?.id ?? null,
            vehicleId: created.id,
            kind: "EXPENSE",
            title: `รับซื้อรถ · ${brand} ${model}`,
            amountBaht: purchaseCostBaht,
            entryOn: bangkokDateKey(),
            note: "สร้างอัตโนมัติตอนรับซื้อ",
          },
        });
      }
      return created;
    });

    return NextResponse.json({ vehicle: mapUsedCarVehicle(vehicle) }, { status: 201 });
  } catch (e) {
    console.error("[used-car-showroom/session/vehicles POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
