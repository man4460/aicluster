import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { createHomeFinanceQuickEntry, todayYmdBangkok } from "@/lib/home-finance/quick-entry";

const postSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  amount: z.preprocess((v) => {
    if (typeof v === "number") return v;
    if (typeof v === "string") return Number(v.replace(/,/g, "").replace(/\s/g, "").trim());
    return v;
  }, z.number().finite().positive().max(9_999_999.99)),
  description: z.string().max(600).optional().default(""),
  type: z.enum(["income", "expense", "INCOME", "EXPENSE"]),
  category: z.string().max(100).optional().default("อื่นๆ"),
  note: z.string().max(600).optional(),
  billNumber: z.string().max(100).optional(),
  paymentMethod: z.string().max(40).optional(),
});

/** POST /api/personal-finance — บันทึกรายรับ/รายจ่ายแบบย่อ (session cookie) */
export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ — ล็อกอินใหม่" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { amount, description, category, note, billNumber, paymentMethod } = parsed.data;
  const prismaType = parsed.data.type.toUpperCase() === "INCOME" ? ("INCOME" as const) : ("EXPENSE" as const);
  const entryDateYmd = parsed.data.date?.trim() || todayYmdBangkok();
  const title = description.trim() || (prismaType === "INCOME" ? "รายรับ" : "รายจ่าย");

  const created = await createHomeFinanceQuickEntry({
    actorUserId: auth.session.sub,
    entryDateYmd,
    amount,
    title,
    type: prismaType,
    categoryLabel: category.trim() || "อื่นๆ",
    note: note?.trim() || null,
    billNumber: billNumber?.trim() || null,
    paymentMethod: paymentMethod?.trim() || null,
  });

  if (!created.ok) {
    return NextResponse.json({ error: created.error }, { status: created.status });
  }

  return NextResponse.json({ ok: true, id: created.entryId });
}
