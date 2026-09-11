import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { usedCarShowroomSessionContext } from "@/lib/used-car-showroom/session-context";
import { prisma } from "@/lib/prisma";
import { mapUsedCarReservation } from "@/systems/used-car-showroom/lib/mappers";
import { isUsedCarPaymentMethod } from "@/systems/used-car-showroom/lib/payment-method";
import { isUsedCarReservationStatus } from "@/systems/used-car-showroom/lib/status";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const rows = await prisma.usedCarReservation.findMany({
      where: { shopId: shop.id },
      include: {
        vehicle: { select: { brand: true, model: true, year: true, coverImageUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ reservations: rows.map(mapUsedCarReservation) });
  } catch (e) {
    console.error("[used-car-showroom/session/reservations GET]", e);
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
    const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : "";
    const customerName = typeof body.customerName === "string" ? body.customerName.trim().slice(0, 200) : "";
    const customerPhone = typeof body.customerPhone === "string" ? body.customerPhone.trim().slice(0, 32) : "";
    if (!vehicleId || !customerName || !customerPhone) {
      return NextResponse.json({ error: "กรอกรถ ชื่อ และเบอร์" }, { status: 400 });
    }
    const vehicle = await prisma.usedCarVehicle.findFirst({ where: { id: vehicleId, shopId: shop.id } });
    if (!vehicle) return NextResponse.json({ error: "ไม่พบรถ" }, { status: 404 });

    const depositBaht = Math.max(0, Math.round(Number(body.depositBaht) || 0));
    const paymentMethod =
      body.paymentMethod === "NONE"
        ? "NONE"
        : isUsedCarPaymentMethod(body.paymentMethod)
          ? body.paymentMethod
          : "NONE";

    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.usedCarReservation.create({
        data: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          shopId: shop.id,
          vehicleId,
          customerId: typeof body.customerId === "string" ? body.customerId : null,
          staffId: typeof body.staffId === "string" ? body.staffId : null,
          source: body.source === "WEB" ? "WEB" : "STAFF",
          customerName,
          customerPhone,
          depositBaht,
          paymentMethod,
          slipImageUrl: typeof body.slipImageUrl === "string" ? body.slipImageUrl.slice(0, 512) : null,
          status: depositBaht > 0 ? "PAID" : "PENDING",
          expiresOn:
            typeof body.expiresOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.expiresOn)
              ? body.expiresOn
              : null,
          note: typeof body.note === "string" ? body.note : null,
        },
        include: {
          vehicle: { select: { brand: true, model: true, year: true, coverImageUrl: true } },
        },
      });
      if (["PREP", "FOR_SALE"].includes(vehicle.status)) {
        await tx.usedCarVehicle.update({ where: { id: vehicleId }, data: { status: "RESERVED" } });
      }
      return created;
    });

    return NextResponse.json({ reservation: mapUsedCarReservation(row) }, { status: 201 });
  } catch (e) {
    console.error("[used-car-showroom/session/reservations POST]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const body = (await req.json()) as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ error: "ระบุ id" }, { status: 400 });
    const existing = await prisma.usedCarReservation.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบการจอง" }, { status: 404 });

    const statusRaw = typeof body.status === "string" ? body.status : undefined;
    if (statusRaw !== undefined && !isUsedCarReservationStatus(statusRaw)) {
      return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
    }
    const status = statusRaw;
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.usedCarReservation.update({
        where: { id },
        data: {
          status,
          depositBaht:
            typeof body.depositBaht === "number" ? Math.max(0, Math.round(body.depositBaht)) : undefined,
          paymentMethod: typeof body.paymentMethod === "string" ? body.paymentMethod.slice(0, 24) : undefined,
          slipImageUrl:
            body.slipImageUrl === null
              ? null
              : typeof body.slipImageUrl === "string"
                ? body.slipImageUrl.slice(0, 512)
                : undefined,
          note: body.note === null ? null : typeof body.note === "string" ? body.note : undefined,
          expiresOn:
            body.expiresOn === null
              ? null
              : typeof body.expiresOn === "string"
                ? body.expiresOn.slice(0, 10)
                : undefined,
        },
        include: {
          vehicle: { select: { brand: true, model: true, year: true, coverImageUrl: true } },
        },
      });
      if (status === "CANCELLED" || status === "EXPIRED") {
        await tx.usedCarVehicle.updateMany({
          where: { id: existing.vehicleId, status: "RESERVED" },
          data: { status: "FOR_SALE" },
        });
      }
      return row;
    });
    return NextResponse.json({ reservation: mapUsedCarReservation(updated) });
  } catch (e) {
    console.error("[used-car-showroom/session/reservations PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
