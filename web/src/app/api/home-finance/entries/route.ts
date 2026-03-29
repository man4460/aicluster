import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { writeSystemActivityLog } from "@/lib/audit-log";
import type { HomeFinanceEntryType } from "@/generated/prisma/enums";

const postSchema = z.object({
  entryDate: z.string().min(10).max(10),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryKey: z.string().min(2).max(64),
  categoryLabel: z.string().min(1).max(100),
  title: z.string().min(1).max(160),
  amount: z.number().finite().positive().max(9_999_999.99),
  dueDate: z.string().min(10).max(10).optional().nullable(),
  billNumber: z.string().max(100).optional().nullable(),
  vehicleType: z.string().max(40).optional().nullable(),
  serviceCenter: z.string().max(160).optional().nullable(),
  paymentMethod: z.string().max(40).optional().nullable(),
  note: z.string().max(600).optional().nullable(),
});

function parseDateOnly(v: string | null | undefined): Date | null {
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapRow(r: {
  id: number;
  entryDate: Date;
  type: HomeFinanceEntryType;
  categoryKey: string;
  categoryLabel: string;
  title: string;
  amount: unknown;
  dueDate: Date | null;
  billNumber: string | null;
  vehicleType: string | null;
  serviceCenter: string | null;
  paymentMethod: string | null;
  note: string | null;
}) {
  return {
    id: r.id,
    entryDate: r.entryDate.toISOString().slice(0, 10),
    type: r.type,
    categoryKey: r.categoryKey,
    categoryLabel: r.categoryLabel,
    title: r.title,
    amount: Number(r.amount),
    dueDate: r.dueDate ? r.dueDate.toISOString().slice(0, 10) : null,
    billNumber: r.billNumber,
    vehicleType: r.vehicleType,
    serviceCenter: r.serviceCenter,
    paymentMethod: r.paymentMethod,
    note: r.note,
  };
}

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const from = parseDateOnly(searchParams.get("from"));
  const to = parseDateOnly(searchParams.get("to"));
  const type = searchParams.get("type")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() ?? "";
  const q = searchParams.get("q")?.trim() ?? "";
  if (!from || !to) return NextResponse.json({ error: "from/to ไม่ถูกต้อง" }, { status: 400 });
  const toEnd = new Date(to.getTime() + 24 * 60 * 60 * 1000);

  const rows = await prisma.homeFinanceEntry.findMany({
    where: {
      ownerUserId: ctx.billingUserId,
      entryDate: { gte: from, lt: toEnd },
      ...(type === "INCOME" || type === "EXPENSE" ? { type } : {}),
      ...(category ? { categoryKey: category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { note: { contains: q } },
              { billNumber: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ entryDate: "desc" }, { id: "desc" }],
    take: 1000,
  });

  const income = rows.filter((r) => r.type === "INCOME").reduce((s, r) => s + Number(r.amount), 0);
  const expense = rows.filter((r) => r.type === "EXPENSE").reduce((s, r) => s + Number(r.amount), 0);

  return NextResponse.json({
    entries: rows.map(mapRow),
    summary: {
      count: rows.length,
      income,
      expense,
      balance: income - expense,
    },
  });
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

  const entryDate = parseDateOnly(parsed.data.entryDate);
  const dueDate = parseDateOnly(parsed.data.dueDate ?? null);
  if (!entryDate) return NextResponse.json({ error: "วันที่รายการไม่ถูกต้อง" }, { status: 400 });
  if (parsed.data.dueDate && !dueDate) return NextResponse.json({ error: "วันครบกำหนดไม่ถูกต้อง" }, { status: 400 });

  const row = await prisma.homeFinanceEntry.create({
    data: {
      ownerUserId: ctx.billingUserId,
      entryDate,
      type: parsed.data.type,
      categoryKey: parsed.data.categoryKey,
      categoryLabel: parsed.data.categoryLabel.trim().slice(0, 100),
      title: parsed.data.title.trim(),
      amount: parsed.data.amount,
      dueDate,
      billNumber: parsed.data.billNumber?.trim() || null,
      vehicleType: parsed.data.vehicleType?.trim() || null,
      serviceCenter: parsed.data.serviceCenter?.trim() || null,
      paymentMethod: parsed.data.paymentMethod?.trim() || null,
      note: parsed.data.note?.trim() || null,
    },
  });

  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "CREATE",
    modelName: "HomeFinanceEntry",
    payload: { id: row.id, ownerUserId: ctx.billingUserId, title: row.title, amount: Number(row.amount) },
  });

  return NextResponse.json({ entry: mapRow(row) });
}
