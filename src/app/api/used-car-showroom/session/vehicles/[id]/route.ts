import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { usedCarShowroomSessionContext } from "@/lib/used-car-showroom/session-context";
import { prisma } from "@/lib/prisma";
import { mapUsedCarVehicle } from "@/systems/used-car-showroom/lib/mappers";
import { isUsedCarVehicleStatus } from "@/systems/used-car-showroom/lib/status";

type Ctx = { params: Promise<{ id: string }> };

const vehicleInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  videos: { orderBy: { sortOrder: "asc" as const } },
  documents: true,
  costLines: { orderBy: { spentAt: "desc" as const } },
};

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const row = await prisma.usedCarVehicle.findFirst({
      where: { id, shopId: shop.id },
      include: vehicleInclude,
    });
    if (!row) return NextResponse.json({ error: "ไม่พบรถ" }, { status: 404 });
    return NextResponse.json({ vehicle: mapUsedCarVehicle(row) });
  } catch (e) {
    console.error("[used-car-showroom/session/vehicles/[id] GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const existing = await prisma.usedCarVehicle.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบรถ" }, { status: 404 });
    const body = (await req.json()) as Record<string, unknown>;

    const updated = await prisma.usedCarVehicle.update({
      where: { id },
      data: {
        status: isUsedCarVehicleStatus(body.status) ? body.status : undefined,
        brand: typeof body.brand === "string" ? body.brand.trim().slice(0, 80) : undefined,
        model: typeof body.model === "string" ? body.model.trim().slice(0, 120) : undefined,
        year: body.year === null ? null : typeof body.year === "number" ? body.year : undefined,
        color: body.color === null ? null : typeof body.color === "string" ? body.color.slice(0, 60) : undefined,
        mileageKm:
          body.mileageKm === null
            ? null
            : typeof body.mileageKm === "number"
              ? body.mileageKm
              : undefined,
        transmission:
          body.transmission === null
            ? null
            : typeof body.transmission === "string"
              ? body.transmission.slice(0, 24)
              : undefined,
        fuelType:
          body.fuelType === null
            ? null
            : typeof body.fuelType === "string"
              ? body.fuelType.slice(0, 24)
              : undefined,
        bodyType:
          body.bodyType === null
            ? null
            : typeof body.bodyType === "string"
              ? body.bodyType.slice(0, 24)
              : undefined,
        plateNumber:
          body.plateNumber === null
            ? null
            : typeof body.plateNumber === "string"
              ? body.plateNumber.slice(0, 32)
              : undefined,
        vin: body.vin === null ? null : typeof body.vin === "string" ? body.vin.slice(0, 64) : undefined,
        engineNumber:
          body.engineNumber === null
            ? null
            : typeof body.engineNumber === "string"
              ? body.engineNumber.slice(0, 64)
              : undefined,
        hasRegistrationBook:
          typeof body.hasRegistrationBook === "boolean" ? body.hasRegistrationBook : undefined,
        purchaseCostBaht:
          typeof body.purchaseCostBaht === "number"
            ? Math.max(0, Math.round(body.purchaseCostBaht))
            : undefined,
        askingPriceBaht:
          typeof body.askingPriceBaht === "number"
            ? Math.max(0, Math.round(body.askingPriceBaht))
            : undefined,
        coverImageUrl:
          body.coverImageUrl === null
            ? null
            : typeof body.coverImageUrl === "string"
              ? body.coverImageUrl.slice(0, 512)
              : undefined,
        description:
          body.description === null
            ? null
            : typeof body.description === "string"
              ? body.description
              : undefined,
        note: body.note === null ? null : typeof body.note === "string" ? body.note : undefined,
      },
      include: vehicleInclude,
    });
    return NextResponse.json({ vehicle: mapUsedCarVehicle(updated) });
  } catch (e) {
    console.error("[used-car-showroom/session/vehicles/[id] PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const existing = await prisma.usedCarVehicle.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบรถ" }, { status: 404 });
    await prisma.usedCarVehicle.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[used-car-showroom/session/vehicles/[id] DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
