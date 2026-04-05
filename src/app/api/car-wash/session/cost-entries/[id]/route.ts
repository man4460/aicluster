import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { jsonCarWashSessionError } from "@/lib/car-wash/route-errors";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";

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
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await carWashOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getCarWashDataScope(own.ownerId);
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
      p.note === undefined
    ) {
      return NextResponse.json({ error: "ไม่มีข้อมูลที่จะแก้ไข" }, { status: 400 });
    }

    const existing = await prisma.carWashCostEntry.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    let categoryId = existing.categoryId;
    if (parsed.data.category_id != null) {
      const cat = await prisma.carWashCostCategory.findFirst({
        where: {
          id: parsed.data.category_id,
          ownerUserId: own.ownerId,
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

    const row = await prisma.carWashCostEntry.update({
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
    return jsonCarWashSessionError(e, "car-wash/session/cost-entries/[id] PATCH");
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await carWashOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getCarWashDataScope(own.ownerId);
    const { id: idRaw } = await ctx.params;
    const id = Number(idRaw);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    const existing = await prisma.carWashCostEntry.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    await prisma.carWashCostEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonCarWashSessionError(e, "car-wash/session/cost-entries/[id] DELETE");
  }
}
