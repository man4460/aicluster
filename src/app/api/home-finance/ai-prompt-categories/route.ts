import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

const postSchema = z.object({
  name: z.string().trim().min(1).max(80),
  sortOrder: z.number().int().min(1).max(999).optional(),
});

async function requireOwner() {
  const auth = await requireSession();
  if (!auth.ok) {
    return { ok: false as const, res: NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ — ล็อกอินใหม่" }, { status: 401 }) };
  }
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) {
    return {
      ok: false as const,
      res: NextResponse.json(
        {
          error:
            ctx?.isStaff === true
              ? "บัญชีพนักงานไม่สามารถใช้ Prompt AI ในบันทึกส่วนตัวได้"
              : "ไม่มีสิทธิ์เข้าใช้ — ตรวจสอบการสมัครโมดูลบันทึกส่วนตัว",
        },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, billingUserId: ctx.billingUserId };
}

function mapCategory(r: { id: number; name: string; sortOrder: number; createdAt: Date; updatedAt: Date }) {
  return {
    id: r.id,
    name: r.name,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function GET() {
  const guard = await requireOwner();
  if (!guard.ok) return guard.res;

  try {
    const rows = await prisma.homeFinanceAiPromptCategory.findMany({
      where: { ownerUserId: guard.billingUserId },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    return NextResponse.json({ categories: rows.map(mapCategory) });
  } catch (e) {
    console.error("home-finance/ai-prompt-categories GET", e);
    return NextResponse.json({ error: "โหลดหมวด Prompt ไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const guard = await requireOwner();
  if (!guard.ok) return guard.res;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "กรอกชื่อหมวด" }, { status: 400 });

  try {
    const row = await prisma.homeFinanceAiPromptCategory.create({
      data: {
        ownerUserId: guard.billingUserId,
        name: parsed.data.name,
        sortOrder: parsed.data.sortOrder ?? 100,
      },
    });
    return NextResponse.json({ category: mapCategory(row) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "มีชื่อหมวดนี้แล้ว" }, { status: 400 });
  }
}
