import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { prismaErrorToApiMessage } from "@/lib/prisma-api-error";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";

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
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  try {
    const scope = await getVillageDataScope(own.ownerId);
    const rows = await prisma.villageCostEntry.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      include: { category: { select: { name: true } } },
      orderBy: { spentAt: "desc" },
    });
    return NextResponse.json({ entries: rows.map((r) => mapEntry(r)) });
  } catch (e) {
    console.error("village/cost-entries GET", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json({ error: msg ?? "โหลดรายการต้นทุนไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const spentAt = new Date(parsed.data.spent_at);
  if (!Number.isFinite(spentAt.getTime())) {
    return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const scope = await getVillageDataScope(own.ownerId);
    const cat = await prisma.villageCostCategory.findFirst({
      where: {
        id: parsed.data.category_id,
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
      },
    });
    if (!cat) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 400 });

    const row = await prisma.villageCostEntry.create({
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
    console.error("village/cost-entries POST", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json({ error: msg ?? "บันทึกรายจ่ายไม่สำเร็จ" }, { status: 500 });
  }
}
