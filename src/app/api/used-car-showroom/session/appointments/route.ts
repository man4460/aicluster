import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { usedCarShowroomSessionContext } from "@/lib/used-car-showroom/session-context";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { mapUsedCarAppointment } from "@/systems/used-car-showroom/lib/mappers";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const url = new URL(req.url);
    const on = url.searchParams.get("on");
    const todayOnly = url.searchParams.get("today") === "1";
    const today = bangkokDateKey();
    const rows = await prisma.usedCarAppointment.findMany({
      where: {
        shopId: shop.id,
        ...(on && /^\d{4}-\d{2}-\d{2}$/.test(on) ? { appointmentOn: on } : {}),
        ...(todayOnly ? { appointmentOn: today } : {}),
      },
      include: { vehicle: { select: { brand: true, model: true, year: true } } },
      orderBy: [{ appointmentOn: "asc" }, { appointmentHm: "asc" }],
      take: 300,
    });
    return NextResponse.json({ appointments: rows.map(mapUsedCarAppointment) });
  } catch (e) {
    console.error("[used-car-showroom/session/appointments GET]", e);
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
    const row = await prisma.usedCarAppointment.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        shopId: shop.id,
        vehicleId: typeof body.vehicleId === "string" ? body.vehicleId : null,
        customerId: typeof body.customerId === "string" ? body.customerId : null,
        staffId: typeof body.staffId === "string" ? body.staffId : null,
        kind: body.kind === "TEST_DRIVE" ? "TEST_DRIVE" : "VIEW",
        customerName,
        customerPhone,
        appointmentOn,
        appointmentHm,
        status: typeof body.status === "string" ? body.status.slice(0, 24) : "SCHEDULED",
        note: typeof body.note === "string" ? body.note : null,
      },
      include: { vehicle: { select: { brand: true, model: true, year: true } } },
    });
    return NextResponse.json({ appointment: mapUsedCarAppointment(row) }, { status: 201 });
  } catch (e) {
    console.error("[used-car-showroom/session/appointments POST]", e);
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
    const existing = await prisma.usedCarAppointment.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบนัด" }, { status: 404 });
    const row = await prisma.usedCarAppointment.update({
      where: { id },
      data: {
        status: typeof body.status === "string" ? body.status.slice(0, 24) : undefined,
        appointmentOn:
          typeof body.appointmentOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.appointmentOn)
            ? body.appointmentOn
            : undefined,
        appointmentHm:
          typeof body.appointmentHm === "string" && /^\d{2}:\d{2}$/.test(body.appointmentHm)
            ? body.appointmentHm
            : undefined,
        kind: body.kind === "TEST_DRIVE" || body.kind === "VIEW" ? body.kind : undefined,
        note: body.note === null ? null : typeof body.note === "string" ? body.note : undefined,
      },
      include: { vehicle: { select: { brand: true, model: true, year: true } } },
    });
    return NextResponse.json({ appointment: mapUsedCarAppointment(row) });
  } catch (e) {
    console.error("[used-car-showroom/session/appointments PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const id = new URL(req.url).searchParams.get("id")?.trim();
    if (!id) return NextResponse.json({ error: "ระบุ id" }, { status: 400 });
    const existing = await prisma.usedCarAppointment.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบนัด" }, { status: 404 });
    await prisma.usedCarAppointment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[used-car-showroom/session/appointments DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
