import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { usedCarShowroomSessionContext } from "@/lib/used-car-showroom/session-context";
import { prisma } from "@/lib/prisma";
import { mapUsedCarStaff } from "@/systems/used-car-showroom/lib/mappers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const rows = await prisma.usedCarStaff.findMany({
      where: { shopId: shop.id },
      orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
      take: 200,
    });
    return NextResponse.json({ staff: rows.map(mapUsedCarStaff) });
  } catch (e) {
    console.error("[used-car-showroom/session/staff GET]", e);
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
    if (!fullName) return NextResponse.json({ error: "กรอกชื่อพนักงาน" }, { status: 400 });
    const row = await prisma.usedCarStaff.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        shopId: shop.id,
        fullName,
        phone: typeof body.phone === "string" ? body.phone.trim().slice(0, 32) || null : null,
        role: typeof body.role === "string" ? body.role.slice(0, 24) : "SALES",
        commissionPercent: Math.max(0, Math.min(100, Math.round(Number(body.commissionPercent) || 0))),
        bonusNote: typeof body.bonusNote === "string" ? body.bonusNote.slice(0, 500) || null : null,
        startedOn:
          typeof body.startedOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.startedOn)
            ? body.startedOn
            : null,
        isActive: body.isActive === false ? false : true,
        note: typeof body.note === "string" ? body.note : null,
      },
    });
    return NextResponse.json({ staff: mapUsedCarStaff(row) }, { status: 201 });
  } catch (e) {
    console.error("[used-car-showroom/session/staff POST]", e);
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
    const existing = await prisma.usedCarStaff.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบพนักงาน" }, { status: 404 });
    const row = await prisma.usedCarStaff.update({
      where: { id },
      data: {
        fullName: typeof body.fullName === "string" ? body.fullName.trim().slice(0, 200) : undefined,
        phone:
          body.phone === null
            ? null
            : typeof body.phone === "string"
              ? body.phone.trim().slice(0, 32) || null
              : undefined,
        role: typeof body.role === "string" ? body.role.slice(0, 24) : undefined,
        commissionPercent:
          body.commissionPercent !== undefined
            ? Math.max(0, Math.min(100, Math.round(Number(body.commissionPercent) || 0)))
            : undefined,
        isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
        note: body.note === null ? null : typeof body.note === "string" ? body.note : undefined,
      },
    });
    return NextResponse.json({ staff: mapUsedCarStaff(row) });
  } catch (e) {
    console.error("[used-car-showroom/session/staff PATCH]", e);
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
    const existing = await prisma.usedCarStaff.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบพนักงาน" }, { status: 404 });
    await prisma.usedCarStaff.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[used-car-showroom/session/staff DELETE]", e);
    return NextResponse.json({ error: "ปิดใช้งานไม่สำเร็จ" }, { status: 500 });
  }
}
