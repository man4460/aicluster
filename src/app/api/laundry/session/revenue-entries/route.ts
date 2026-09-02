import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { laundryOwnerFromAuth } from "@/lib/laundry/api-owner";
import { jsonLaundrySessionError, isLaundryRevenueTableMissingP2021 } from "@/lib/laundry/route-errors";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";

const postSchema = z.object({
  category_id: z.number().int().positive(),
  earned_at: z.string().min(1),
  amount: z.number().int().min(0).max(99_999_999),
  item_label: z.string().min(1).max(200),
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

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await laundryOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getLaundryDataScope(own.ownerId);

    const rows = await prisma.laundryRevenueEntry.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      include: { category: { select: { name: true } } },
      orderBy: { earnedAt: "desc" },
    });
    return NextResponse.json({
      entries: rows.map((r) => mapEntry(r)),
    });
  } catch (e) {
    if (isLaundryRevenueTableMissingP2021(e)) {
      console.warn(
        "[laundry/session/revenue-entries GET] ตาราง laundry_revenue_entries ยังไม่มี — รัน npx prisma migrate deploy แล้ว prisma generate",
      );
      return NextResponse.json(
        {
          entries: [] as ReturnType<typeof mapEntry>[],
        },
        {
          headers: {
            "X-Mawell-Laundry-Revenue-Migration": "pending",
          },
        },
      );
    }
    return jsonLaundrySessionError(e, "laundry/session/revenue-entries GET");
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await laundryOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getLaundryDataScope(own.ownerId);

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const cat = await prisma.laundryRevenueCategory.findFirst({
      where: {
        id: parsed.data.category_id,
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
      },
    });
    if (!cat) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 400 });

    const earnedAt = new Date(parsed.data.earned_at);
    if (!Number.isFinite(earnedAt.getTime())) {
      return NextResponse.json({ error: "วันที่ไม่ถูกต้อง" }, { status: 400 });
    }

    const row = await prisma.laundryRevenueEntry.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        categoryId: cat.id,
        earnedAt,
        amount: parsed.data.amount,
        itemLabel: parsed.data.item_label.trim(),
        note: parsed.data.note?.trim() ?? "",
        slipPhotoUrl: parsed.data.slip_photo_url?.trim() ?? "",
        paymentMethod: parsed.data.payment_method?.trim() || null,
      },
      include: { category: { select: { name: true } } },
    });
    return NextResponse.json({ entry: mapEntry(row) });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/session/revenue-entries POST");
  }
}
