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
  const costs = await prisma.parkingCostEntry.findMany({
    where: {
      ownerUserId: auth.ownerUserId,
      trialSessionId: auth.trialSessionId,
      ...(from || to ? { spentAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { spentAt: "desc" },
  });
  return NextResponse.json({
    costs: costs.map((row) => ({
      ...row,
      spentAt: row.spentAt.toISOString(),
      categoryName: row.category.name,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await getParkingOwnerContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as {
    categoryId?: number;
    label?: string;
    amountBaht?: number;
    spentAt?: string;
    note?: string | null;
    paymentSlipUrl?: string | null;
  } | null;
  const categoryId = Number(body?.categoryId);
  const label = body?.label?.trim() ?? "";
  const amountBaht = Math.round(Number(body?.amountBaht ?? 0));
  if (!Number.isInteger(categoryId) || !label || amountBaht <= 0) {
    return NextResponse.json({ error: "เลือกหมวดหมู่และกรอกรายการกับจำนวนเงิน" }, { status: 400 });
  }
  const scope = { ownerUserId: auth.ownerUserId, trialSessionId: auth.trialSessionId };
  const category = await prisma.parkingCostCategory.findFirst({ where: { id: categoryId, ...scope } });
  if (!category) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 400 });
  const spentAt = body?.spentAt ? new Date(body.spentAt) : new Date();
  if (Number.isNaN(spentAt.getTime())) return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
  const cost = await prisma.parkingCostEntry.create({
    data: {
      ...scope,
      categoryId,
      label,
      amountBaht,
      spentAt,
      note: body?.note?.trim() ?? "",
      paymentSlipUrl: body?.paymentSlipUrl?.trim() ?? "",
    },
    include: { category: { select: { id: true, name: true } } },
  });
  return NextResponse.json({
    cost: { ...cost, spentAt: cost.spentAt.toISOString(), categoryName: cost.category.name },
  });
}
