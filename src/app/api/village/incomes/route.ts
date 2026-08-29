import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { prismaErrorToApiMessage } from "@/lib/prisma-api-error";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";
import { bangkokDayStartEndForDateKey } from "@/lib/barber/bangkok-day";

function mapIncome(row: {
  id: string;
  label: string;
  amountBaht: number;
  earnedAt: Date;
  note: string | null;
  paymentSlipUrl: string | null;
  categoryId: string;
  category: { id: string; name: string; kind: string };
}) {
  return {
    id: row.id,
    label: row.label,
    amountBaht: row.amountBaht,
    earnedAt: row.earnedAt.toISOString(),
    note: row.note,
    paymentSlipUrl: row.paymentSlipUrl,
    categoryId: row.categoryId,
    categoryName: row.category.name,
    categoryKind: row.category.kind as "COMMON_FEE" | "CUSTOM",
  };
}

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const url = new URL(req.url);
  const fromD = url.searchParams.get("from")?.trim() ?? "";
  const toD = url.searchParams.get("to")?.trim() ?? "";

  try {
    const scope = await getVillageDataScope(own.ownerId);
    const where: {
      ownerUserId: string;
      trialSessionId: string;
      earnedAt?: { gte: Date; lt: Date };
    } = {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
    };

    if (fromD && toD) {
      const rangeStart = bangkokDayStartEndForDateKey(fromD <= toD ? fromD : toD).start;
      const rangeEndExclusive = bangkokDayStartEndForDateKey(fromD <= toD ? toD : fromD).end;
      where.earnedAt = { gte: rangeStart, lt: rangeEndExclusive };
    }

    const rows = await prisma.villageIncomeEntry.findMany({
      where,
      include: { category: { select: { id: true, name: true, kind: true } } },
      orderBy: [{ earnedAt: "desc" }],
      take: 500,
    });
    return NextResponse.json({ incomes: rows.map(mapIncome) });
  } catch (e) {
    console.error("village/incomes GET", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json({ error: msg ?? "โหลดรายรับไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

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

  const label = body.label?.trim();
  const amountBaht = Math.round(body.amountBaht ?? 0);
  const categoryId = body.categoryId?.trim() || "";
  if (!label || amountBaht <= 0) {
    return NextResponse.json({ error: "กรอกรายการและจำนวนเงิน" }, { status: 400 });
  }
  if (!categoryId) {
    return NextResponse.json({ error: "เลือกหมวดหมู่รายรับ" }, { status: 400 });
  }

  try {
    const scope = await getVillageDataScope(own.ownerId);
    const cat = await prisma.villageIncomeCategory.findFirst({
      where: { id: categoryId, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!cat) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 400 });
    if (cat.kind !== "CUSTOM" || cat.isBuiltin) {
      return NextResponse.json(
        { error: "บันทึกรายรับเพิ่มได้เฉพาะหมวดที่สร้างเอง — ค่าส่วนกลางมาจากการชำระ" },
        { status: 400 },
      );
    }

    const row = await prisma.villageIncomeEntry.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        categoryId,
        label,
        amountBaht,
        note: body.note?.trim() || null,
        paymentSlipUrl: body.paymentSlipUrl?.trim() || null,
      },
      include: { category: { select: { id: true, name: true, kind: true } } },
    });
    return NextResponse.json({ income: mapIncome(row) });
  } catch (e) {
    console.error("village/incomes POST", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json({ error: msg ?? "บันทึกรายรับไม่สำเร็จ" }, { status: 500 });
  }
}
