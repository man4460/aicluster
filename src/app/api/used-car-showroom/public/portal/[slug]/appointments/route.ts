import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { USED_CAR_SHOWROOM_MODULE_SLUG } from "@/lib/modules/config";
import { ensureOwnerModuleDailyChargeOnPublicUse } from "@/lib/modules/public-portal-access";
import { gateUsedCarShowroomPublicShop } from "@/systems/used-car-showroom/lib/load-public-shop";
import { mapUsedCarAppointment } from "@/systems/used-car-showroom/lib/mappers";
import { bangkokDateKey } from "@/lib/time/bangkok";

type Ctx = { params: Promise<{ slug: string }> };

/** นัดดูรถ / ทดลองขับ จากเว็บ — ไม่มัดจำ (แยกจากจองรถ) */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
    }

    const trialParam =
      typeof body.t === "string" ? body.t : typeof body.trialSessionId === "string" ? body.trialSessionId : null;
    const gate = await gateUsedCarShowroomPublicShop(slug, trialParam);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }
    const { shop } = gate;

    const charge = await ensureOwnerModuleDailyChargeOnPublicUse(
      shop.ownerUserId,
      USED_CAR_SHOWROOM_MODULE_SLUG,
    );
    if (!charge.ok) {
      return NextResponse.json({ error: "ลิงก์ปิดชั่วคราว" }, { status: 403 });
    }

    const customerName =
      typeof body.customerName === "string" ? body.customerName.trim().slice(0, 200) : "";
    const customerPhone =
      typeof body.customerPhone === "string" ? body.customerPhone.trim().slice(0, 32) : "";
    const appointmentOn =
      typeof body.appointmentOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.appointmentOn)
        ? body.appointmentOn
        : "";
    const appointmentHm =
      typeof body.appointmentHm === "string" && /^\d{2}:\d{2}$/.test(body.appointmentHm)
        ? body.appointmentHm
        : "";
    if (!customerName || !customerPhone || !appointmentOn || !appointmentHm) {
      return NextResponse.json({ error: "กรอกชื่อ เบอร์ วัน และเวลา" }, { status: 400 });
    }

    const today = bangkokDateKey();
    if (appointmentOn < today) {
      return NextResponse.json({ error: "ไม่สามารถนัดวันในอดีต" }, { status: 400 });
    }

    let vehicleId: string | null = typeof body.vehicleId === "string" ? body.vehicleId.trim() : null;
    if (vehicleId) {
      const vehicle = await prisma.usedCarVehicle.findFirst({
        where: { id: vehicleId, shopId: shop.id },
      });
      if (!vehicle) return NextResponse.json({ error: "ไม่พบรถ" }, { status: 404 });
    } else {
      vehicleId = null;
    }

    const kind = body.kind === "TEST_DRIVE" ? "TEST_DRIVE" : "VIEW";

    const row = await prisma.usedCarAppointment.create({
      data: {
        ownerUserId: shop.ownerUserId,
        trialSessionId: shop.trialSessionId,
        shopId: shop.id,
        vehicleId,
        kind,
        customerName,
        customerPhone,
        appointmentOn,
        appointmentHm,
        status: "SCHEDULED",
        note: typeof body.note === "string" ? body.note.slice(0, 500) : null,
      },
      include: { vehicle: { select: { brand: true, model: true, year: true } } },
    });

    await prisma.usedCarLead.create({
      data: {
        ownerUserId: shop.ownerUserId,
        trialSessionId: shop.trialSessionId,
        shopId: shop.id,
        vehicleId,
        source: "WEB",
        fullName: customerName,
        phone: customerPhone,
        note: `นัด${kind === "TEST_DRIVE" ? "ทดลองขับ" : "ดูรถ"} ${appointmentOn} ${appointmentHm}`,
        status: "NEW",
      },
    }).catch(() => null);

    return NextResponse.json({ appointment: mapUsedCarAppointment(row) }, { status: 201 });
  } catch (e) {
    console.error("[used-car-showroom public appointments POST]", e);
    return NextResponse.json({ error: "บันทึกนัดไม่สำเร็จ" }, { status: 500 });
  }
}
