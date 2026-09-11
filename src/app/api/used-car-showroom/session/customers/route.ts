import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { usedCarShowroomSessionContext } from "@/lib/used-car-showroom/session-context";
import { prisma } from "@/lib/prisma";
import { mapUsedCarCustomer } from "@/systems/used-car-showroom/lib/mappers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const rows = await prisma.usedCarCustomer.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return NextResponse.json({ customers: rows.map(mapUsedCarCustomer) });
  } catch (e) {
    console.error("[used-car-showroom/session/customers GET]", e);
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
    const row = await prisma.usedCarCustomer.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        shopId: shop.id,
        fullName,
        phone,
        lineId: typeof body.lineId === "string" ? body.lineId.trim().slice(0, 120) || null : null,
        email: typeof body.email === "string" ? body.email.trim().slice(0, 200) || null : null,
        address: typeof body.address === "string" ? body.address : null,
        nationalId:
          typeof body.nationalId === "string" ? body.nationalId.trim().slice(0, 20) || null : null,
        taxId: typeof body.taxId === "string" ? body.taxId.trim().slice(0, 30) || null : null,
        taxName: typeof body.taxName === "string" ? body.taxName.trim().slice(0, 200) || null : null,
        taxAddress: typeof body.taxAddress === "string" ? body.taxAddress : null,
        note: typeof body.note === "string" ? body.note : null,
      },
    });
    return NextResponse.json({ customer: mapUsedCarCustomer(row) }, { status: 201 });
  } catch (e) {
    console.error("[used-car-showroom/session/customers POST]", e);
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
    const existing = await prisma.usedCarCustomer.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบลูกค้า" }, { status: 404 });
    const str = (k: string, max: number) =>
      typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : undefined;
    const row = await prisma.usedCarCustomer.update({
      where: { id },
      data: {
        fullName: str("fullName", 200),
        phone: str("phone", 32),
        lineId: body.lineId === null ? null : str("lineId", 120),
        email: body.email === null ? null : str("email", 200),
        address: body.address === null ? null : typeof body.address === "string" ? body.address : undefined,
        nationalId: body.nationalId === null ? null : str("nationalId", 20),
        taxId: body.taxId === null ? null : str("taxId", 30),
        taxName: body.taxName === null ? null : str("taxName", 200),
        taxAddress:
          body.taxAddress === null ? null : typeof body.taxAddress === "string" ? body.taxAddress : undefined,
        note: body.note === null ? null : typeof body.note === "string" ? body.note : undefined,
      },
    });
    return NextResponse.json({ customer: mapUsedCarCustomer(row) });
  } catch (e) {
    console.error("[used-car-showroom/session/customers PATCH]", e);
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
    const existing = await prisma.usedCarCustomer.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบลูกค้า" }, { status: 404 });
    await prisma.usedCarCustomer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[used-car-showroom/session/customers DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
