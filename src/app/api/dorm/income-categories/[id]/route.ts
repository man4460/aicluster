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

  let body: { name?: string; sortOrder?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const scope = await getDormitoryDataScope(auth.session.sub);
    const existing = await prisma.dormitoryIncomeCategory.findFirst({
      where: { id, ownerUserId: auth.session.sub, trialSessionId: scope.trialSessionId },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
    if (existing.isBuiltin || existing.kind !== "CUSTOM") {
      return NextResponse.json({ error: "หมวดหลักแก้ไขไม่ได้" }, { status: 400 });
    }

    const name = body.name?.trim();
    if (name !== undefined && (!name || name.length > 120)) {
      return NextResponse.json({ error: "กรอกชื่อหมวดหมู่" }, { status: 400 });
    }

    const row = await prisma.dormitoryIncomeCategory.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
          ? { sortOrder: Math.round(body.sortOrder) }
          : {}),
      },
    });
    return NextResponse.json({
      category: {
        id: row.id,
        name: row.name,
        kind: row.kind,
        isBuiltin: row.isBuiltin,
        sortOrder: row.sortOrder,
        createdAt: row.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error("dorm/income-categories PATCH", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json({ error: msg ?? "บันทึกหมวดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  const { id } = await ctx.params;

  try {
    const scope = await getDormitoryDataScope(auth.session.sub);
    const existing = await prisma.dormitoryIncomeCategory.findFirst({
      where: { id, ownerUserId: auth.session.sub, trialSessionId: scope.trialSessionId },
      include: { _count: { select: { entries: true } } },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
    if (existing.isBuiltin || existing.kind !== "CUSTOM") {
      return NextResponse.json({ error: "หมวดหลักลบไม่ได้" }, { status: 400 });
    }
    if (existing._count.entries > 0) {
      return NextResponse.json(
        { error: `มีรายรับ ${existing._count.entries} รายการในหมวดนี้ — ย้ายหรือลบรายรับก่อน` },
        { status: 409 },
      );
    }

    await prisma.dormitoryIncomeCategory.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("dorm/income-categories DELETE", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json({ error: msg ?? "ลบหมวดไม่สำเร็จ" }, { status: 500 });
  }
}
