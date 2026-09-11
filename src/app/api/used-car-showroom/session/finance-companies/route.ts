import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { usedCarShowroomSessionContext } from "@/lib/used-car-showroom/session-context";
import { prisma } from "@/lib/prisma";
import { mapUsedCarFinanceCompany } from "@/systems/used-car-showroom/lib/mappers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const rows = await prisma.usedCarFinanceCompany.findMany({
      where: { shopId: shop.id },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      take: 200,
    });
    return NextResponse.json({ companies: rows.map(mapUsedCarFinanceCompany) });
  } catch (e) {
    console.error("[used-car-showroom/session/finance-companies GET]", e);
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
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
    if (!name) return NextResponse.json({ error: "กรอกชื่อไฟแนนซ์" }, { status: 400 });
    const row = await prisma.usedCarFinanceCompany.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        shopId: shop.id,
        name,
        contactName:
          typeof body.contactName === "string" ? body.contactName.trim().slice(0, 120) || null : null,
        contactPhone:
          typeof body.contactPhone === "string" ? body.contactPhone.trim().slice(0, 32) || null : null,
        note: typeof body.note === "string" ? body.note : null,
        isActive: body.isActive === false ? false : true,
      },
    });
    return NextResponse.json({ company: mapUsedCarFinanceCompany(row) }, { status: 201 });
  } catch (e) {
    console.error("[used-car-showroom/session/finance-companies POST]", e);
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
    const existing = await prisma.usedCarFinanceCompany.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบไฟแนนซ์" }, { status: 404 });
    const row = await prisma.usedCarFinanceCompany.update({
      where: { id },
      data: {
        name: typeof body.name === "string" ? body.name.trim().slice(0, 200) : undefined,
        contactName:
          body.contactName === null
            ? null
            : typeof body.contactName === "string"
              ? body.contactName.trim().slice(0, 120) || null
              : undefined,
        contactPhone:
          body.contactPhone === null
            ? null
            : typeof body.contactPhone === "string"
              ? body.contactPhone.trim().slice(0, 32) || null
              : undefined,
        note: body.note === null ? null : typeof body.note === "string" ? body.note : undefined,
        isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
      },
    });
    return NextResponse.json({ company: mapUsedCarFinanceCompany(row) });
  } catch (e) {
    console.error("[used-car-showroom/session/finance-companies PATCH]", e);
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
    const existing = await prisma.usedCarFinanceCompany.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบไฟแนนซ์" }, { status: 404 });
    await prisma.usedCarFinanceCompany.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[used-car-showroom/session/finance-companies DELETE]", e);
    return NextResponse.json({ error: "ปิดใช้งานไม่สำเร็จ" }, { status: 500 });
  }
}
