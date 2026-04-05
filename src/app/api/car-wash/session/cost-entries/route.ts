import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { jsonCarWashSessionError } from "@/lib/car-wash/route-errors";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";

const postSchema = z.object({
  category_id: z.number().int().positive(),
  spent_at: z.string().min(1),
  amount: z.number().int().min(0).max(99_999_999),
  item_label: z.string().min(1).max(200),
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

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await carWashOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getCarWashDataScope(own.ownerId);

    const rows = await prisma.carWashCostEntry.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      include: { category: { select: { name: true } } },
      orderBy: { spentAt: "desc" },
    });
    return NextResponse.json({
      entries: rows.map((r) => mapEntry(r)),
    });
  } catch (e) {
    return jsonCarWashSessionError(e, "car-wash/session/cost-entries GET");
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await carWashOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getCarWashDataScope(own.ownerId);

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const cat = await prisma.carWashCostCategory.findFirst({
      where: {
        id: parsed.data.category_id,
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
      },
    });
    if (!cat) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 400 });

    const spentAt = new Date(parsed.data.spent_at);
    if (!Number.isFinite(spentAt.getTime())) {
      return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
    }

    const row = await prisma.carWashCostEntry.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        categoryId: cat.id,
        spentAt,
        amount: parsed.data.amount,
        itemLabel: parsed.data.item_label.trim(),
        note: parsed.data.note?.trim() ?? "",
        slipPhotoUrl: parsed.data.slip_photo_url?.trim() ?? "",
      },
      include: { category: { select: { name: true } } },
    });
    return NextResponse.json({ entry: mapEntry(row) });
  } catch (e) {
    return jsonCarWashSessionError(e, "car-wash/session/cost-entries POST");
  }
}
