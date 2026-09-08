import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

const postSchema = z.object({
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().min(1).max(20000),
  categoryId: z.number().int().positive().optional().nullable(),
  promptType: z.string().trim().min(1).max(80).optional(),
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

function mapRow(r: {
  id: number;
  title: string;
  content: string;
  promptType: string;
  categoryId: number | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    promptType: r.promptType,
    categoryId: r.categoryId,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

async function resolveCategory(
  billingUserId: string,
  categoryId: number | null | undefined,
  promptType: string | undefined,
): Promise<{ categoryId: number | null; promptType: string } | { error: string }> {
  if (categoryId != null) {
    const cat = await prisma.homeFinanceAiPromptCategory.findFirst({
      where: { id: categoryId, ownerUserId: billingUserId },
    });
    if (!cat) return { error: "ไม่พบหมวดที่เลือก" };
    return { categoryId: cat.id, promptType: cat.name };
  }
  const label = (promptType ?? "").trim() || "ทั่วไป";
  return { categoryId: null, promptType: label };
}

export async function GET() {
  const guard = await requireOwner();
  if (!guard.ok) return guard.res;

  try {
    const rows = await prisma.homeFinanceAiPrompt.findMany({
      where: { ownerUserId: guard.billingUserId },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });
    return NextResponse.json(
      { items: rows.map(mapRow) },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (e) {
    console.error("home-finance/ai-prompts GET", e);
    return NextResponse.json({ error: "โหลด Prompt ไม่สำเร็จ" }, { status: 500 });
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
  if (!parsed.success) {
    return NextResponse.json({ error: "กรอกหัวข้อ · รายละเอียด prompt · และหมวด" }, { status: 400 });
  }

  const resolved = await resolveCategory(guard.billingUserId, parsed.data.categoryId, parsed.data.promptType);
  if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: 400 });

  try {
    const row = await prisma.homeFinanceAiPrompt.create({
      data: {
        ownerUserId: guard.billingUserId,
        title: parsed.data.title,
        content: parsed.data.content,
        categoryId: resolved.categoryId,
        promptType: resolved.promptType,
      },
    });
    return NextResponse.json(
      { item: mapRow(row) },
      { status: 201, headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (e) {
    console.error("home-finance/ai-prompts POST", e);
    return NextResponse.json({ error: "บันทึก Prompt ไม่สำเร็จ" }, { status: 500 });
  }
}
