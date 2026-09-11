import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { usedCarShowroomSessionContext } from "@/lib/used-car-showroom/session-context";
import { prisma } from "@/lib/prisma";
import { computeFlatInstallment } from "@/systems/used-car-showroom/lib/installment";
import { mapUsedCarFinanceCase } from "@/systems/used-car-showroom/lib/mappers";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    const rows = await prisma.usedCarFinanceCase.findMany({
      where: { shopId: shop.id },
      include: {
        vehicle: { select: { brand: true, model: true, year: true } },
        company: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ cases: rows.map(mapUsedCarFinanceCase) });
  } catch (e) {
    console.error("[used-car-showroom/session/finance-cases GET]", e);
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

    if (body.action === "computeInstallment") {
      const result = computeFlatInstallment({
        priceBaht: Number(body.priceBaht) || 0,
        downPaymentBaht: Number(body.downPaymentBaht) || 0,
        annualInterestPercent: Number(body.annualInterestPercent) || 0,
        months: Number(body.months) || 0,
      });
      if (!result) {
        return NextResponse.json({ error: "ข้อมูลผ่อนไม่ถูกต้อง" }, { status: 400 });
      }
      return NextResponse.json({ installment: result });
    }

    const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId : "";
    if (!vehicleId) return NextResponse.json({ error: "เลือกรถ" }, { status: 400 });
    const vehicle = await prisma.usedCarVehicle.findFirst({ where: { id: vehicleId, shopId: shop.id } });
    if (!vehicle) return NextResponse.json({ error: "ไม่พบรถ" }, { status: 404 });

    let financedAmountBaht = Math.max(0, Math.round(Number(body.financedAmountBaht) || 0));
    let installmentNote: string | null = null;
    if (
      body.priceBaht != null ||
      body.downPaymentBaht != null ||
      body.annualInterestPercent != null ||
      body.months != null
    ) {
      const installment = computeFlatInstallment({
        priceBaht: Number(body.priceBaht) || vehicle.askingPriceBaht,
        downPaymentBaht: Number(body.downPaymentBaht) || 0,
        annualInterestPercent: Number(body.annualInterestPercent) || 0,
        months: Number(body.months) || 0,
      });
      if (installment) {
        if (!financedAmountBaht) financedAmountBaht = installment.financedBaht;
        installmentNote = `ผ่อน ${Number(body.months) || 0} เดือน · ดอกคงที่ · เดือนละ ฿${installment.monthlyPaymentBaht.toLocaleString("th-TH")} · รวมดอก ฿${installment.totalInterestBaht.toLocaleString("th-TH")}`;
      }
    }

    const baseNote = typeof body.note === "string" ? body.note.trim() : "";
    const note = [baseNote || null, installmentNote].filter(Boolean).join("\n") || null;

    const row = await prisma.usedCarFinanceCase.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        shopId: shop.id,
        vehicleId,
        saleId: typeof body.saleId === "string" ? body.saleId : null,
        customerId: typeof body.customerId === "string" ? body.customerId : null,
        companyId: typeof body.companyId === "string" ? body.companyId : null,
        financedAmountBaht,
        status: typeof body.status === "string" ? body.status.slice(0, 24) : "SUBMITTED",
        commissionBaht: Math.max(0, Math.round(Number(body.commissionBaht) || 0)),
        commissionPaid: body.commissionPaid === true,
        insuranceCompany:
          typeof body.insuranceCompany === "string"
            ? body.insuranceCompany.trim().slice(0, 200) || null
            : null,
        signOn:
          typeof body.signOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.signOn)
            ? body.signOn
            : null,
        note,
      },
      include: {
        vehicle: { select: { brand: true, model: true, year: true } },
        company: { select: { name: true } },
      },
    });
    return NextResponse.json({ case: mapUsedCarFinanceCase(row) }, { status: 201 });
  } catch (e) {
    console.error("[used-car-showroom/session/finance-cases POST]", e);
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
    const existing = await prisma.usedCarFinanceCase.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบเคส" }, { status: 404 });
    const row = await prisma.usedCarFinanceCase.update({
      where: { id },
      data: {
        companyId:
          body.companyId === null
            ? null
            : typeof body.companyId === "string"
              ? body.companyId
              : undefined,
        financedAmountBaht:
          body.financedAmountBaht !== undefined
            ? Math.max(0, Math.round(Number(body.financedAmountBaht) || 0))
            : undefined,
        status: typeof body.status === "string" ? body.status.slice(0, 24) : undefined,
        commissionBaht:
          body.commissionBaht !== undefined
            ? Math.max(0, Math.round(Number(body.commissionBaht) || 0))
            : undefined,
        commissionPaid: typeof body.commissionPaid === "boolean" ? body.commissionPaid : undefined,
        insuranceCompany:
          body.insuranceCompany === null
            ? null
            : typeof body.insuranceCompany === "string"
              ? body.insuranceCompany.trim().slice(0, 200) || null
              : undefined,
        signOn:
          body.signOn === null
            ? null
            : typeof body.signOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.signOn)
              ? body.signOn
              : undefined,
        note: body.note === null ? null : typeof body.note === "string" ? body.note : undefined,
      },
      include: {
        vehicle: { select: { brand: true, model: true, year: true } },
        company: { select: { name: true } },
      },
    });
    return NextResponse.json({ case: mapUsedCarFinanceCase(row) });
  } catch (e) {
    console.error("[used-car-showroom/session/finance-cases PATCH]", e);
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
    const existing = await prisma.usedCarFinanceCase.findFirst({ where: { id, shopId: shop.id } });
    if (!existing) return NextResponse.json({ error: "ไม่พบเคส" }, { status: 404 });
    await prisma.usedCarFinanceCase.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[used-car-showroom/session/finance-cases DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
