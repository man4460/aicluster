import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { usedCarShowroomSessionContext } from "@/lib/used-car-showroom/session-context";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { findUsedCarFinanceCategoryBySystemKey } from "@/systems/used-car-showroom/lib/ensure-shop";
import { mapUsedCarLedgerEntry } from "@/systems/used-car-showroom/lib/mappers";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const url = new URL(req.url);
    const from = url.searchParams.get("from") ?? "";
    const to = url.searchParams.get("to") ?? "";
    const kind = url.searchParams.get("kind");

    const [entries, categories] = await Promise.all([
      prisma.usedCarLedgerEntry.findMany({
        where: {
          shopId: shop.id,
          ...(kind === "INCOME" || kind === "EXPENSE" ? { kind } : {}),
          ...(from || to
            ? {
                entryOn: {
                  ...(from ? { gte: from } : {}),
                  ...(to ? { lte: to } : {}),
                },
              }
            : {}),
        },
        include: { category: true },
        orderBy: [{ entryOn: "desc" }, { createdAt: "desc" }],
        take: 500,
      }),
      prisma.usedCarFinanceCategory.findMany({
        where: { shopId: shop.id },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
    ]);

    return NextResponse.json({
      entries: entries.map(mapUsedCarLedgerEntry),
      categories: categories.map((c) => ({
        id: c.id,
        kind: c.kind,
        name: c.name,
        systemKey: c.systemKey,
        sortOrder: c.sortOrder,
        isActive: c.isActive,
      })),
    });
  } catch (e) {
    console.error("[used-car-showroom/session/ledger GET]", e);
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

    if (body.action === "createCategory") {
      const kind = body.kind === "INCOME" || body.kind === "EXPENSE" ? body.kind : null;
      const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
      if (!kind || !name) return NextResponse.json({ error: "กรอกชนิดและชื่อหมวด" }, { status: 400 });
      const cat = await prisma.usedCarFinanceCategory.create({
        data: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          shopId: shop.id,
          kind,
          name,
          sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 100,
        },
      });
      return NextResponse.json({ category: cat }, { status: 201 });
    }

    const kind = body.kind === "INCOME" || body.kind === "EXPENSE" ? body.kind : null;
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
    const amountBaht = Math.max(0, Math.round(Number(body.amountBaht) || 0));
    if (!kind || !title || amountBaht <= 0) {
      return NextResponse.json({ error: "กรอกชนิด หัวข้อ และยอด" }, { status: 400 });
    }
    const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : null;
    let categoryId = typeof body.categoryId === "string" ? body.categoryId : null;

    let categoryMeta: { systemKey: string | null; name: string } | null = null;
    if (categoryId) {
      categoryMeta = await prisma.usedCarFinanceCategory.findFirst({
        where: { id: categoryId, shopId: shop.id },
        select: { systemKey: true, name: true },
      });
    }

    const titleLooksCommission =
      typeof body.title === "string" && body.title.includes("ค่าคอม");
    const isCommission =
      body.systemKey === "COMMISSION" ||
      categoryMeta?.systemKey === "COMMISSION" ||
      categoryMeta?.name.includes("ค่าคอม") ||
      titleLooksCommission;

    if (isCommission) {
      if (!vehicleId) {
        return NextResponse.json({ error: "ค่าคอมต้องผูกรถ (vehicleId)" }, { status: 400 });
      }
      const cat = await findUsedCarFinanceCategoryBySystemKey(prisma, shop.id, "COMMISSION");
      categoryId = cat?.id ?? categoryId;
    }

    const entryOn =
      typeof body.entryOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.entryOn)
        ? body.entryOn
        : bangkokDateKey();

    const row = await prisma.usedCarLedgerEntry.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        shopId: shop.id,
        categoryId,
        vehicleId,
        saleId: typeof body.saleId === "string" ? body.saleId : null,
        kind,
        title,
        amountBaht,
        entryOn,
        paymentMethod: typeof body.paymentMethod === "string" ? body.paymentMethod.slice(0, 24) : null,
        slipImageUrl: typeof body.slipImageUrl === "string" ? body.slipImageUrl.slice(0, 512) : null,
        note: typeof body.note === "string" ? body.note : null,
      },
      include: { category: true },
    });
    return NextResponse.json({ entry: mapUsedCarLedgerEntry(row) }, { status: 201 });
  } catch (e) {
    console.error("[used-car-showroom/session/ledger POST]", e);
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
    const existing = await prisma.usedCarLedgerEntry.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
    const updated = await prisma.usedCarLedgerEntry.update({
      where: { id },
      data: {
        title: typeof body.title === "string" ? body.title.trim().slice(0, 200) : undefined,
        amountBaht:
          typeof body.amountBaht === "number" ? Math.max(0, Math.round(body.amountBaht)) : undefined,
        entryOn:
          typeof body.entryOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.entryOn)
            ? body.entryOn
            : undefined,
        categoryId: body.categoryId === null ? null : typeof body.categoryId === "string" ? body.categoryId : undefined,
        vehicleId: body.vehicleId === null ? null : typeof body.vehicleId === "string" ? body.vehicleId : undefined,
        paymentMethod:
          body.paymentMethod === null
            ? null
            : typeof body.paymentMethod === "string"
              ? body.paymentMethod.slice(0, 24)
              : undefined,
        slipImageUrl:
          body.slipImageUrl === null
            ? null
            : typeof body.slipImageUrl === "string"
              ? body.slipImageUrl.slice(0, 512)
              : undefined,
        note: body.note === null ? null : typeof body.note === "string" ? body.note : undefined,
      },
      include: { category: true },
    });
    return NextResponse.json({ entry: mapUsedCarLedgerEntry(updated) });
  } catch (e) {
    console.error("[used-car-showroom/session/ledger PATCH]", e);
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
    const existing = await prisma.usedCarLedgerEntry.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
    await prisma.usedCarLedgerEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[used-car-showroom/session/ledger DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
