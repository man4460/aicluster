import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";

const createSchema = z.object({
  label: z.string().trim().min(1).max(160),
  amountBaht: z.number().int().min(0).max(99_999_999),
  spentAt: z.string().datetime().optional(),
  note: z.string().trim().max(300).optional().nullable(),
});

export async function GET() {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const rows = await prisma.drinkPosCostEntry.findMany({
    where: { ownerUserId: auth.ctx.ownerUserId },
    orderBy: { spentAt: "desc" },
    take: 200,
  });
  return NextResponse.json({
    costs: rows.map((r) => ({
      id: r.id,
      label: r.label,
      amountBaht: r.amountBaht,
      spentAt: r.spentAt.toISOString(),
      note: r.note,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON ไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const row = await prisma.drinkPosCostEntry.create({
    data: {
      ownerUserId: auth.ctx.ownerUserId,
      label: parsed.data.label,
      amountBaht: parsed.data.amountBaht,
      spentAt: parsed.data.spentAt ? new Date(parsed.data.spentAt) : new Date(),
      note: parsed.data.note?.trim() || null,
    },
  });

  return NextResponse.json({
    cost: {
      id: row.id,
      label: row.label,
      amountBaht: row.amountBaht,
      spentAt: row.spentAt.toISOString(),
      note: row.note,
    },
  });
}
