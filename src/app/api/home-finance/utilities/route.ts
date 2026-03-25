import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

const postSchema = z.object({
  utilityType: z.enum(["ELECTRIC", "WATER"]),
  label: z.string().trim().min(1).max(120),
  provider: z.string().trim().max(120).optional().nullable(),
  accountNumber: z.string().trim().max(80).optional().nullable(),
  meterNumber: z.string().trim().max(80).optional().nullable(),
  defaultDueDay: z.number().int().min(1).max(31).optional().nullable(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  note: z.string().trim().max(400).optional().nullable(),
});

function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.homeUtilityProfile.findMany({
    where: { ownerUserId: ctx.billingUserId },
    orderBy: [{ isActive: "desc" }, { utilityType: "asc" }, { id: "desc" }],
  });
  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const row = await prisma.homeUtilityProfile.create({
    data: {
      ownerUserId: ctx.billingUserId,
      utilityType: parsed.data.utilityType,
      label: parsed.data.label,
      provider: parsed.data.provider?.trim() || null,
      accountNumber: parsed.data.accountNumber?.trim() || null,
      meterNumber: parsed.data.meterNumber?.trim() || null,
      defaultDueDay: parsed.data.defaultDueDay ?? null,
      dueDate: parseDateOnly(parsed.data.dueDate),
      note: parsed.data.note?.trim() || null,
      isActive: true,
    },
  });
  return NextResponse.json({ item: row });
}
