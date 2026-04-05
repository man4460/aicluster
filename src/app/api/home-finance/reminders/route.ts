import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { writeSystemActivityLog } from "@/lib/audit-log";

const postSchema = z.object({
  title: z.string().trim().min(1).max(160),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().trim().max(400).optional().nullable(),
});

function parseDateOnly(value: string): Date | null {
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ — ล็อกอินใหม่" }, { status: 401 });
  }
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) {
    return NextResponse.json(
      {
        error:
          ctx?.isStaff === true
            ? "บัญชีพนักงานไม่สามารถใช้รายรับ-รายจ่ายได้ — โปรดเข้าด้วยบัญชีเจ้าของ"
            : "ไม่มีสิทธิ์เข้าใช้ — ตรวจสอบการสมัครโมดูลรายรับ–รายจ่าย",
      },
      { status: 403 },
    );
  }

  try {
    const rows = await prisma.homeFinanceReminder.findMany({
      where: { ownerUserId: ctx.billingUserId },
      orderBy: [{ isDone: "asc" }, { dueDate: "asc" }, { id: "desc" }],
    });
    return NextResponse.json({ items: rows });
  } catch (e) {
    console.error("home-finance/reminders GET", e);
    return NextResponse.json({ error: "โหลดแจ้งเตือนจากฐานข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
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
  const dueDate = parseDateOnly(parsed.data.dueDate);
  if (!dueDate) return NextResponse.json({ error: "วันครบกำหนดไม่ถูกต้อง" }, { status: 400 });

  const row = await prisma.homeFinanceReminder.create({
    data: {
      ownerUserId: ctx.billingUserId,
      title: parsed.data.title,
      dueDate,
      note: parsed.data.note?.trim() || null,
      isDone: false,
    },
  });
  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "CREATE",
    modelName: "HomeFinanceReminder",
    payload: { id: row.id, ownerUserId: ctx.billingUserId, title: row.title },
  });
  return NextResponse.json({ item: row });
}
