import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { prismaErrorToApiMessage } from "@/lib/prisma-api-error";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";

const patchSchema = z.object({
  category_id: z.number().int().positive().optional(),
  spent_at: z.string().min(1).optional(),
  amount: z.number().int().min(0).max(99_999_999).optional(),
  item_label: z.string().min(1).max(200).optional(),
  note: z.string().max(500).optional().nullable(),
  slip_photo_url: z.string().max(512).optional().nullable(),
});

function mapEntry(r: {
  id: number;
  categoryId: number;
  spentAt: Date;
  amount: number;
  itemLabel: string;
  note: string;
  slipPhotoUrl: string;
  createdAt: Date;
  category: { name: string };
}) {
  return {
    id: r.id,
    category_id: r.categoryId,
    category_name: r.category.name,
    spent_at: r.spentAt.toISOString(),
    amount: r.amount,
    item_label: r.itemLabel,
    note: r.note,
    slip_photo_url: r.slipPhotoUrl,
    created_at: r.createdAt.toISOString(),
  };
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  const scope = await getDormitoryDataScope(auth.session.sub);
  const { id: idRaw } = await ctx.params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const p = parsed.data;
  if (
    p.category_id === undefined &&
    p.spent_at === undefined &&
    p.amount === undefined &&
    p.item_label === undefined &&
    p.note === undefined &&
    p.slip_photo_url === undefined
  ) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่จะแก้ไข" }, { status: 400 });
  }

  const existing = await prisma.dormitoryCostEntry.findFirst({
    where: { id, ownerUserId: auth.session.sub, trialSessionId: scope.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  let categoryId = existing.categoryId;
  if (parsed.data.category_id != null) {
    const cat = await prisma.dormitoryCostCategory.findFirst({
      where: {
        id: parsed.data.category_id,
        ownerUserId: auth.session.sub,
        trialSessionId: scope.trialSessionId,
      },
    });
    if (!cat) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 400 });
    categoryId = cat.id;
  }

  let spentAt = existing.spentAt;
  if (parsed.data.spent_at != null) {
    const d = new Date(parsed.data.spent_at);
    if (!Number.isFinite(d.getTime())) return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
    spentAt = d;
  }

  try {
    const row = await prisma.dormitoryCostEntry.update({
      where: { id },
      data: {
        categoryId,
        spentAt,
        ...(parsed.data.amount !== undefined ? { amount: parsed.data.amount } : {}),
        ...(parsed.data.item_label !== undefined ? { itemLabel: parsed.data.item_label.trim() } : {}),
        ...(parsed.data.note !== undefined ? { note: parsed.data.note?.trim() ?? "" } : {}),
        ...(parsed.data.slip_photo_url !== undefined ?
          { slipPhotoUrl: parsed.data.slip_photo_url?.trim() ?? "" }
        : {}),
      },
      include: { category: { select: { name: true } } },
    });
    return NextResponse.json({ entry: mapEntry(row) });
  } catch (e) {
    console.error("dorm/cost-entries PATCH", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json({ error: msg ?? "แก้ไขรายจ่ายไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  const scope = await getDormitoryDataScope(auth.session.sub);
  const { id: idRaw } = await ctx.params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  const existing = await prisma.dormitoryCostEntry.findFirst({
    where: { id, ownerUserId: auth.session.sub, trialSessionId: scope.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  try {
    await prisma.dormitoryCostEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("dorm/cost-entries DELETE", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json({ error: msg ?? "ลบรายจ่ายไม่สำเร็จ" }, { status: 500 });
  }
}
