import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";
import { isPrismaSchemaMismatchError, PRISMA_SYNC_HINT_TH } from "@/lib/prisma-errors";
import { villageFeeAmountDueForYearMonth, villageFeeRowStatusAfterRegenerate } from "@/lib/village/house-fee-cycle";

const ymRegex = /^\d{4}-\d{2}$/;
const postGenSchema = z.object({
  year_month: z.string().regex(ymRegex),
});

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getVillageDataScope(own.ownerId);

  const { searchParams } = new URL(req.url);
  const yearMonth = searchParams.get("year_month")?.trim() ?? "";
  if (!ymRegex.test(yearMonth)) {
    return NextResponse.json({ error: "ระบุ year_month เป็น YYYY-MM" }, { status: 400 });
  }

  const statusRaw = searchParams.get("status")?.trim().toUpperCase() ?? "";
  const statusFilter =
    statusRaw === "PENDING" || statusRaw === "PARTIAL" || statusRaw === "PAID" || statusRaw === "WAIVED"
      ? statusRaw
      : null;

  try {
    const profile = await prisma.villageProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      },
      select: { defaultMonthlyFee: true, dueDayOfMonth: true },
    });
    const defaultFee = profile?.defaultMonthlyFee ?? 0;
    const dueDay = profile?.dueDayOfMonth ?? 5;

    const rows = await prisma.villageCommonFeeRow.findMany({
      where: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        yearMonth,
        ...(statusFilter ? { status: statusFilter as "PENDING" | "PARTIAL" | "PAID" | "WAIVED" } : {}),
      },
      include: { house: { select: { houseNo: true, ownerName: true, feeCycle: true } } },
      orderBy: [{ house: { sortOrder: "asc" } }, { id: "asc" }],
    });

    return NextResponse.json({
      default_monthly_fee: defaultFee,
      due_day_of_month: dueDay,
      fee_rows: rows.map((r) => ({
        id: r.id,
        house_id: r.houseId,
        house_no: r.house.houseNo,
        owner_name: r.house.ownerName,
        fee_cycle: r.house.feeCycle,
        year_month: r.yearMonth,
        amount_due: r.amountDue,
        amount_paid: r.amountPaid,
        status: r.status,
        note: r.note,
        paid_at: r.paidAt?.toISOString() ?? null,
      })),
    });
  } catch (e) {
    if (isPrismaSchemaMismatchError(e)) {
      return NextResponse.json({ error: PRISMA_SYNC_HINT_TH }, { status: 503 });
    }
    console.error("village fee-rows GET", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getVillageDataScope(own.ownerId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postGenSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const ym = parsed.data.year_month;

  try {
    const profile = await prisma.villageProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      },
    });
    const defaultFee = profile?.defaultMonthlyFee ?? 0;

    const houses = await prisma.villageHouse.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId, isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    for (const h of houses) {
      const monthlyRate = h.monthlyFeeOverride ?? defaultFee;
      const amountDue = villageFeeAmountDueForYearMonth(h.feeCycle, ym, monthlyRate);
      const whereUnique = {
        ownerUserId_trialSessionId_houseId_yearMonth: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          houseId: h.id,
          yearMonth: ym,
        },
      } as const;
      const existing = await prisma.villageCommonFeeRow.findUnique({ where: whereUnique });
      const amountPaid = existing?.amountPaid ?? 0;
      const status = villageFeeRowStatusAfterRegenerate(amountDue, amountPaid);
      await prisma.villageCommonFeeRow.upsert({
        where: whereUnique,
        create: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          houseId: h.id,
          yearMonth: ym,
          amountDue,
          amountPaid: 0,
          status: amountDue <= 0 ? "WAIVED" : "PENDING",
        },
        update: {
          amountDue,
          status,
        },
      });
    }

    const rows = await prisma.villageCommonFeeRow.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId, yearMonth: ym },
      include: { house: { select: { houseNo: true, ownerName: true, feeCycle: true } } },
      orderBy: [{ house: { sortOrder: "asc" } }, { id: "asc" }],
    });

    return NextResponse.json({
      fee_rows: rows.map((r) => ({
        id: r.id,
        house_id: r.houseId,
        house_no: r.house.houseNo,
        owner_name: r.house.ownerName,
        fee_cycle: r.house.feeCycle,
        year_month: r.yearMonth,
        amount_due: r.amountDue,
        amount_paid: r.amountPaid,
        status: r.status,
        note: r.note,
        paid_at: r.paidAt?.toISOString() ?? null,
      })),
    });
  } catch (e) {
    if (isPrismaSchemaMismatchError(e)) {
      return NextResponse.json({ error: PRISMA_SYNC_HINT_TH }, { status: 503 });
    }
    console.error("village fee-rows POST", e);
    return NextResponse.json({ error: "สร้างรายการไม่สำเร็จ" }, { status: 500 });
  }
}
