import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { usedCarShowroomSessionContext } from "@/lib/used-car-showroom/session-context";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { mapUsedCarPromotion } from "@/systems/used-car-showroom/lib/mappers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const rows = await prisma.usedCarPromotion.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ promotions: rows.map(mapUsedCarPromotion) });
  } catch (e) {
    console.error("[used-car-showroom/session/promotions GET]", e);
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
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
    if (!title) return NextResponse.json({ error: "กรอกชื่อโปร" }, { status: 400 });
    const today = bangkokDateKey();
    const row = await prisma.usedCarPromotion.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        shopId: shop.id,
        vehicleId: typeof body.vehicleId === "string" ? body.vehicleId : null,
        title,
        description: typeof body.description === "string" ? body.description : null,
        kind: typeof body.kind === "string" ? body.kind.slice(0, 16) : "AMOUNT",
        valueBaht: Math.max(0, Math.round(Number(body.valueBaht) || 0)),
        valuePercent: Math.max(0, Math.min(100, Math.round(Number(body.valuePercent) || 0))),
        giftLabel: typeof body.giftLabel === "string" ? body.giftLabel.slice(0, 200) || null : null,
        startsOn:
          typeof body.startsOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.startsOn)
            ? body.startsOn
            : today,
        endsOn:
          typeof body.endsOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.endsOn)
            ? body.endsOn
            : today,
        isActive: body.isActive === false ? false : true,
      },
    });
    return NextResponse.json({ promotion: mapUsedCarPromotion(row) }, { status: 201 });
  } catch (e) {
    console.error("[used-car-showroom/session/promotions POST]", e);
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
    const existing = await prisma.usedCarPromotion.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบโปร" }, { status: 404 });
    const row = await prisma.usedCarPromotion.update({
      where: { id },
      data: {
        title: typeof body.title === "string" ? body.title.trim().slice(0, 200) : undefined,
        description:
          body.description === null
            ? null
            : typeof body.description === "string"
              ? body.description
              : undefined,
        kind: typeof body.kind === "string" ? body.kind.slice(0, 16) : undefined,
        valueBaht:
          body.valueBaht !== undefined ? Math.max(0, Math.round(Number(body.valueBaht) || 0)) : undefined,
        valuePercent:
          body.valuePercent !== undefined
            ? Math.max(0, Math.min(100, Math.round(Number(body.valuePercent) || 0)))
            : undefined,
        isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
        startsOn:
          typeof body.startsOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.startsOn)
            ? body.startsOn
            : undefined,
        endsOn:
          typeof body.endsOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.endsOn)
            ? body.endsOn
            : undefined,
      },
    });
    return NextResponse.json({ promotion: mapUsedCarPromotion(row) });
  } catch (e) {
    console.error("[used-car-showroom/session/promotions PATCH]", e);
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
    const existing = await prisma.usedCarPromotion.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบโปร" }, { status: 404 });
    await prisma.usedCarPromotion.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[used-car-showroom/session/promotions DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
