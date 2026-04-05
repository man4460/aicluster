import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

const postSchema = z.object({
  name: z.string().trim().min(1).max(100),
  sortOrder: z.number().int().min(1).max(999).optional(),
});

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
    const rows = await prisma.homeFinanceCategory.findMany({
      where: { ownerUserId: ctx.billingUserId },
      orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
    });
    return NextResponse.json({
      categories: rows.map((r) => ({
        id: r.id,
        name: r.name,
        isActive: r.isActive,
        sortOrder: r.sortOrder,
      })),
    });
  } catch (e) {
    console.error("home-finance/categories GET", e);
    return NextResponse.json({ error: "โหลดหมวดจากฐานข้อมูลไม่สำเร็จ" }, { status: 500 });
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

  try {
    const row = await prisma.homeFinanceCategory.create({
      data: {
        ownerUserId: ctx.billingUserId,
        name: parsed.data.name,
        sortOrder: parsed.data.sortOrder ?? 100,
        isActive: true,
      },
    });
    return NextResponse.json({ category: row });
  } catch {
    return NextResponse.json({ error: "มีชื่อหมวดนี้แล้ว" }, { status: 400 });
  }
}
