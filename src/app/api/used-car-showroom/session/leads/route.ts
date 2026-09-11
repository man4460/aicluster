import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { usedCarShowroomSessionContext } from "@/lib/used-car-showroom/session-context";
import { prisma } from "@/lib/prisma";
import { mapUsedCarLead } from "@/systems/used-car-showroom/lib/mappers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const rows = await prisma.usedCarLead.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    return NextResponse.json({ leads: rows.map(mapUsedCarLead) });
  } catch (e) {
    console.error("[used-car-showroom/session/leads GET]", e);
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
    const fullName = typeof body.fullName === "string" ? body.fullName.trim().slice(0, 200) : "";
    const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 32) : "";
    if (!fullName || !phone) {
      return NextResponse.json({ error: "กรอกชื่อและเบอร์" }, { status: 400 });
    }
    const row = await prisma.usedCarLead.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        shopId: shop.id,
        customerId: typeof body.customerId === "string" ? body.customerId : null,
        vehicleId: typeof body.vehicleId === "string" ? body.vehicleId : null,
        staffId: typeof body.staffId === "string" ? body.staffId : null,
        fullName,
        phone,
        source: typeof body.source === "string" ? body.source.slice(0, 24) : "OTHER",
        status: typeof body.status === "string" ? body.status.slice(0, 24) : "NEW",
        note: typeof body.note === "string" ? body.note : null,
      },
    });
    return NextResponse.json({ lead: mapUsedCarLead(row) }, { status: 201 });
  } catch (e) {
    console.error("[used-car-showroom/session/leads POST]", e);
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
    const existing = await prisma.usedCarLead.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบลีด" }, { status: 404 });
    const row = await prisma.usedCarLead.update({
      where: { id },
      data: {
        status: typeof body.status === "string" ? body.status.slice(0, 24) : undefined,
        staffId:
          body.staffId === null
            ? null
            : typeof body.staffId === "string"
              ? body.staffId
              : undefined,
        note: body.note === null ? null : typeof body.note === "string" ? body.note : undefined,
      },
    });
    return NextResponse.json({ lead: mapUsedCarLead(row) });
  } catch (e) {
    console.error("[used-car-showroom/session/leads PATCH]", e);
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
    const existing = await prisma.usedCarLead.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบลีด" }, { status: 404 });
    await prisma.usedCarLead.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[used-car-showroom/session/leads DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
