import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";
import { villageCostTotalsByMonthForCalendarYear } from "@/lib/village/village-annual-cost-by-month";

function padMonth(m: number): string {
  return `${m}`.padStart(2, "0");
}

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getVillageDataScope(own.ownerId);

  const { searchParams } = new URL(req.url);
  const year = Number.parseInt(searchParams.get("year") ?? "", 10);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "ระบุ year เป็นตัวเลข ค.ศ." }, { status: 400 });
  }

  const months: string[] = [];
  for (let m = 1; m <= 12; m++) months.push(`${year}-${padMonth(m)}`);

  const rows = await prisma.villageCommonFeeRow.groupBy({
    by: ["yearMonth"],
    where: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      yearMonth: { in: months },
    },
    _sum: { amountDue: true, amountPaid: true },
    _count: { id: true },
  });

  const byYm = new Map(rows.map((r) => [r.yearMonth, r]));

  const costByYm = await villageCostTotalsByMonthForCalendarYear(
    own.ownerId,
    scope.trialSessionId,
    year,
    months,
  );

  const table = months.map((ym) => {
    const g = byYm.get(ym);
    return {
      year_month: ym,
      house_rows: g?._count.id ?? 0,
      total_due: Number(g?._sum.amountDue ?? 0),
      total_paid: Number(g?._sum.amountPaid ?? 0),
      total_cost: costByYm.get(ym) ?? 0,
    };
  });

  return NextResponse.json({ year, months: table });
}
