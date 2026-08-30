import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";

function dateBound(value: string | null, end = false): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return new Date(`${value}T${end ? "23:59:59.999" : "00:00:00"}+07:00`);
}

export async function GET(req: Request) {
  const auth = await getParkingOwnerContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const from = dateBound(url.searchParams.get("from"));
  const to = dateBound(url.searchParams.get("to"), true);
  const incomes = await prisma.parkingIncomeEntry.findMany({
    where: {
      ownerUserId: auth.ownerUserId,
      trialSessionId: auth.trialSessionId,
      ...(from || to ? { earnedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    },
    include: { category: { select: { id: true, name: true, kind: true } } },
    orderBy: { earnedAt: "desc" },
  });
  return NextResponse.json({
    incomes: incomes.map((row) => ({
      ...row,
      earnedAt: row.earnedAt.toISOString(),
      categoryName: row.category.name,
      categoryKind: row.category.kind,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await getParkingOwnerContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as {
    categoryId?: string;
    label?: string;
    amountBaht?: number;
    earnedAt?: string;
    note?: string | null;
    paymentSlipUrl?: string | null;
  } | null;
  const categoryId = body?.categoryId?.trim() ?? "";
  const label = body?.label?.trim() ?? "";
  const amountBaht = Math.round(Number(body?.amountBaht ?? 0));
  if (!categoryId || !label || amountBaht <= 0) {
    return NextResponse.json({ error: "เลือกหมวดหมู่และกรอกรายการกับจำนวนเงิน" }, { status: 400 });
  }
  const scope = { ownerUserId: auth.ownerUserId, trialSessionId: auth.trialSessionId };
  const category = await prisma.parkingIncomeCategory.findFirst({ where: { id: categoryId, ...scope } });
  if (!category) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 400 });
  if (category.kind !== "CUSTOM" || category.isBuiltin) {
    return NextResponse.json(
      { error: "บันทึกรายรับเพิ่มได้เฉพาะหมวดที่สร้างเอง — ค่าจอดรถมาจากรอบจอด" },
      { status: 400 },
    );
  }
  const earnedAt = body?.earnedAt ? new Date(body.earnedAt) : new Date();
  if (Number.isNaN(earnedAt.getTime())) return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
  const income = await prisma.parkingIncomeEntry.create({
    data: {
      ...scope,
      categoryId,
      label,
      amountBaht,
      earnedAt,
      note: body?.note?.trim() || null,
      paymentSlipUrl: body?.paymentSlipUrl?.trim() || null,
    },
    include: { category: { select: { id: true, name: true, kind: true } } },
  });
  return NextResponse.json({
    income: {
      ...income,
      earnedAt: income.earnedAt.toISOString(),
      categoryName: income.category.name,
      categoryKind: income.category.kind,
    },
  });
}
