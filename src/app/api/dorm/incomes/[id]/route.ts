import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { prismaErrorToApiMessage } from "@/lib/prisma-api-error";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteCtx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  const { id } = await ctx.params;

  const existing = await prisma.dormitoryIncomeEntry.findFirst({
    where: { id, ownerUserId: auth.session.sub },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายรับ" }, { status: 404 });

  let body: {
    label?: string;
    amountBaht?: number;
    note?: string | null;
    categoryId?: string;
    paymentSlipUrl?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const scope = await getDormitoryDataScope(auth.session.sub);
    if (body.categoryId) {
      const cat = await prisma.dormitoryIncomeCategory.findFirst({
        where: { id: body.categoryId, ownerUserId: auth.session.sub, trialSessionId: scope.trialSessionId },
      });
      if (!cat) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 400 });
      if (cat.kind !== "CUSTOM" || cat.isBuiltin) {
        return NextResponse.json({ error: "เลือกได้เฉพาะหมวดที่สร้างเอง" }, { status: 400 });
      }
    }

    const label = body.label?.trim();
    const amountBaht = body.amountBaht !== undefined ? Math.round(body.amountBaht) : undefined;
    if (label !== undefined && !label) {
      return NextResponse.json({ error: "กรอกรายการ" }, { status: 400 });
    }
    if (amountBaht !== undefined && amountBaht <= 0) {
      return NextResponse.json({ error: "จำนวนเงินไม่ถูกต้อง" }, { status: 400 });
    }

    const row = await prisma.dormitoryIncomeEntry.update({
      where: { id },
      data: {
        ...(label !== undefined ? { label } : {}),
        ...(amountBaht !== undefined ? { amountBaht } : {}),
        ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
        ...(body.note !== undefined ? { note: body.note?.trim() || null } : {}),
        ...(body.paymentSlipUrl !== undefined
          ? { paymentSlipUrl: body.paymentSlipUrl?.trim() || null }
          : {}),
      },
      include: { category: { select: { id: true, name: true, kind: true } } },
    });

    return NextResponse.json({
      income: {
        id: row.id,
        label: row.label,
        amountBaht: row.amountBaht,
        earnedAt: row.earnedAt.toISOString(),
        note: row.note,
        paymentSlipUrl: row.paymentSlipUrl,
        categoryId: row.categoryId,
        categoryName: row.category.name,
        categoryKind: row.category.kind,
      },
    });
  } catch (e) {
    console.error("dorm/incomes PATCH", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json({ error: msg ?? "บันทึกรายรับไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  const { id } = await ctx.params;

  const existing = await prisma.dormitoryIncomeEntry.findFirst({
    where: { id, ownerUserId: auth.session.sub },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายรับ" }, { status: 404 });

  try {
    await prisma.dormitoryIncomeEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("dorm/incomes DELETE", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json({ error: msg ?? "ลบรายรับไม่สำเร็จ" }, { status: 500 });
  }
}
