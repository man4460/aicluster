import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";
import { isPrismaSchemaMismatchError, PRISMA_SYNC_HINT_TH } from "@/lib/prisma-errors";
import { generateVillageFeeRowsForScope } from "@/lib/village/generate-fee-rows";

const ymRegex = /^\d{4}-\d{2}$/;
const postGenSchema = z.object({
  year_month: z.string().regex(ymRegex),
});

function mapFeeRow(r: {
  id: number;
  houseId: number;
  yearMonth: string;
  amountDue: number;
  amountPaid: number;
  status: string;
  note: string | null;
  paidAt: Date | null;
  house: { houseNo: string; ownerName: string | null; feeCycle: string };
  slips: { id: number; amount: number; slipImageUrl: string; submittedAt: Date }[];
}) {
  const pending = r.slips[0] ?? null;
  return {
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
    pending_slip: pending
      ? {
          id: pending.id,
          amount: pending.amount,
          slip_image_url: pending.slipImageUrl,
          submitted_at: pending.submittedAt.toISOString(),
        }
      : null,
  };
}

const feeRowInclude = {
  house: { select: { houseNo: true, ownerName: true, feeCycle: true } },
  slips: {
    where: { status: "PENDING" as const },
    orderBy: { submittedAt: "desc" as const },
    take: 1,
    select: { id: true, amount: true, slipImageUrl: true, submittedAt: true },
  },
};

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
      select: { defaultMonthlyFee: true, dueDayOfMonth: true, autoGenerateFees: true },
    });
    const defaultFee = profile?.defaultMonthlyFee ?? 0;
    const dueDay = profile?.dueDayOfMonth ?? 5;
    const autoGenerateFees = profile?.autoGenerateFees ?? true;

    if (autoGenerateFees) {
      await generateVillageFeeRowsForScope({
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        yearMonth,
      });
    }

    const rows = await prisma.villageCommonFeeRow.findMany({
      where: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        yearMonth,
        ...(statusFilter ? { status: statusFilter as "PENDING" | "PARTIAL" | "PAID" | "WAIVED" } : {}),
      },
      include: feeRowInclude,
      orderBy: [{ house: { sortOrder: "asc" } }, { id: "asc" }],
    });

    return NextResponse.json({
      default_monthly_fee: defaultFee,
      due_day_of_month: dueDay,
      auto_generate_fees: autoGenerateFees,
      fee_rows: rows.map(mapFeeRow),
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
    await generateVillageFeeRowsForScope({
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      yearMonth: ym,
    });

    const rows = await prisma.villageCommonFeeRow.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId, yearMonth: ym },
      include: feeRowInclude,
      orderBy: [{ house: { sortOrder: "asc" } }, { id: "asc" }],
    });

    return NextResponse.json({
      fee_rows: rows.map(mapFeeRow),
    });
  } catch (e) {
    if (isPrismaSchemaMismatchError(e)) {
      return NextResponse.json({ error: PRISMA_SYNC_HINT_TH }, { status: 503 });
    }
    console.error("village fee-rows POST", e);
    return NextResponse.json({ error: "สร้างรายการไม่สำเร็จ" }, { status: 500 });
  }
}
