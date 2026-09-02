import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { laundryOwnerFromAuth } from "@/lib/laundry/api-owner";
import { jsonLaundrySessionError } from "@/lib/laundry/route-errors";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";

const patchSchema = z.object({
  category_id: z.number().int().positive().optional(),
  earned_at: z.string().min(1).optional(),
  amount: z.number().int().min(0).max(99_999_999).optional(),
  item_label: z.string().min(1).max(200).optional(),
  note: z.string().max(500).optional().nullable(),
  slip_photo_url: z.string().max(512).optional().nullable(),
  payment_method: z.string().max(20).optional().nullable(),
});

function mapEntry(r: {
  id: number;
  categoryId: number;
  earnedAt: Date;
  amount: number;
  itemLabel: string;
  note: string;
  slipPhotoUrl: string;
  paymentMethod: string | null;
  createdAt: Date;
  category: { name: string };
}) {
  return {
    id: r.id,
    category_id: r.categoryId,
    category_name: r.category.name,
    earned_at: r.earnedAt.toISOString(),
    amount: r.amount,
    item_label: r.itemLabel,
    note: r.note,
    slip_photo_url: r.slipPhotoUrl,
    payment_method: r.paymentMethod,
    created_at: r.createdAt.toISOString(),
  };
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await laundryOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getLaundryDataScope(own.ownerId);
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
      p.earned_at === undefined &&
      p.amount === undefined &&
      p.note === undefined &&
      p.item_label === undefined &&
      p.slip_photo_url === undefined &&
      p.payment_method === undefined
    ) {
      return NextResponse.json({ error: "ไม่มีข้อมูลที่จะแก้ไข" }, { status: 400 });
    }

    const existing = await prisma.laundryRevenueEntry.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    let categoryId = existing.categoryId;
    if (parsed.data.category_id != null) {
      const cat = await prisma.laundryRevenueCategory.findFirst({
        where: {
          id: parsed.data.category_id,
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
        },
      });
      if (!cat) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 400 });
      categoryId = cat.id;
    }

    let earnedAt = existing.earnedAt;
    if (parsed.data.earned_at != null) {
      const d = new Date(parsed.data.earned_at);
      if (!Number.isFinite(d.getTime())) return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
      earnedAt = d;
    }

    const row = await prisma.laundryRevenueEntry.update({
      where: { id },
      data: {
        categoryId,
        earnedAt,
        ...(parsed.data.amount !== undefined ? { amount: parsed.data.amount } : {}),
        ...(parsed.data.item_label !== undefined ? { itemLabel: parsed.data.item_label.trim() } : {}),
        ...(parsed.data.note !== undefined ? { note: parsed.data.note?.trim() ?? "" } : {}),
        ...(parsed.data.slip_photo_url !== undefined ?
          { slipPhotoUrl: parsed.data.slip_photo_url?.trim() ?? "" }
        : {}),
        ...(parsed.data.payment_method !== undefined ?
          { paymentMethod: parsed.data.payment_method?.trim() || null }
        : {}),
      },
      include: { category: { select: { name: true } } },
    });
    return NextResponse.json({ entry: mapEntry(row) });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/session/revenue-entries/[id] PATCH");
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await laundryOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getLaundryDataScope(own.ownerId);
    const { id: idRaw } = await ctx.params;
    const id = Number(idRaw);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    const existing = await prisma.laundryRevenueEntry.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    await prisma.laundryRevenueEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/session/revenue-entries/[id] DELETE");
  }
}
