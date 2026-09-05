import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withEcommerceStoreOwnerContext } from "@/systems/ecommerce-store/lib/api-auth";

const createSchema = z.object({
  label: z.string().trim().min(1).max(160),
  amountBaht: z.number().int().min(1).max(99_999_999),
  categoryId: z.string().trim().min(1),
  spentAt: z.string().datetime().optional(),
  note: z.string().trim().max(300).optional().nullable(),
  paymentSlipUrl: z.string().trim().max(512).optional().nullable(),
});

function mapCost(r: {
  id: string;
  label: string;
  amountBaht: number;
  spentAt: Date;
  note: string | null;
  paymentSlipUrl: string | null;
  categoryId: string | null;
  category: { id: string; name: string } | null;
}) {
  return {
    id: r.id,
    label: r.label,
    amountBaht: r.amountBaht,
    spentAt: r.spentAt.toISOString(),
    note: r.note,
    paymentSlipUrl: r.paymentSlipUrl,
    categoryId: r.categoryId,
    categoryName: r.category?.name ?? null,
  };
}

export async function GET() {
  const auth = await withEcommerceStoreOwnerContext();
  if (!auth.ok) return auth.res;
  const rows = await prisma.ecommerceCostEntry.findMany({
    where: { ownerUserId: auth.ctx.ownerUserId },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { spentAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ costs: rows.map(mapCost) });
}

export async function POST(req: Request) {
  const auth = await withEcommerceStoreOwnerContext();
  if (!auth.ok) return auth.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON ไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "กรอกรายการ จำนวนเงิน และหมวดหมู่" }, { status: 400 });
  }

  const cat = await prisma.ecommerceCostCategory.findFirst({
    where: { id: parsed.data.categoryId, ownerUserId: auth.ctx.ownerUserId },
  });
  if (!cat) {
    return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 400 });
  }

  const row = await prisma.ecommerceCostEntry.create({
    data: {
      ownerUserId: auth.ctx.ownerUserId,
      categoryId: parsed.data.categoryId,
      label: parsed.data.label,
      amountBaht: parsed.data.amountBaht,
      spentAt: parsed.data.spentAt ? new Date(parsed.data.spentAt) : new Date(),
      note: parsed.data.note?.trim() || null,
      paymentSlipUrl: parsed.data.paymentSlipUrl?.trim() || null,
    },
    include: { category: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ cost: mapCost(row) });
}
