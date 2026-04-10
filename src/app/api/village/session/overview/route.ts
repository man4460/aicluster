import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";
import { bangkokMonthKey } from "@/lib/time/bangkok";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getVillageDataScope(own.ownerId);

  const ym = bangkokMonthKey();
  const yearStr = ym.slice(0, 4);

  const [houseCount, pendingSlips, monthRows, profile, residentCount, ytdAgg, pendingFeeRows, twelve] = await Promise.all([
    prisma.villageHouse.count({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId, isActive: true },
    }),
    prisma.villageSlipSubmission.count({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId, status: "PENDING" },
    }),
    prisma.villageCommonFeeRow.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId, yearMonth: ym },
      select: { amountDue: true, amountPaid: true, status: true },
    }),
    prisma.villageProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      },
      select: { displayName: true, defaultMonthlyFee: true, dueDayOfMonth: true },
    }),
    prisma.villageResident.count({
      where: {
        isActive: true,
        house: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId, isActive: true },
      },
    }),
    prisma.villageCommonFeeRow.aggregate({
      where: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        yearMonth: { gte: `${yearStr}-01`, lte: `${yearStr}-12` },
      },
      _sum: { amountDue: true, amountPaid: true },
    }),
    prisma.villageCommonFeeRow.count({
      where: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        yearMonth: ym,
        status: { in: ["PENDING", "PARTIAL"] },
      },
    }),
    prisma.villageCommonFeeRow.groupBy({
      by: ["yearMonth"],
      where: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        yearMonth: { gte: `${yearStr}-01`, lte: `${yearStr}-12` },
      },
      _sum: { amountDue: true, amountPaid: true },
    }),
  ]);

  const totalDue = monthRows.reduce((s, r) => s + r.amountDue, 0);
  const totalPaid = monthRows.reduce((s, r) => s + r.amountPaid, 0);
  const paidHouses = monthRows.filter((r) => r.status === "PAID" || r.amountPaid >= r.amountDue).length;
  const monthCollectionPercent = totalDue > 0 ? Math.round(Math.min(100, (totalPaid / totalDue) * 100)) : 0;

  const ytdDue = Number(ytdAgg._sum.amountDue ?? 0);
  const ytdPaid = Number(ytdAgg._sum.amountPaid ?? 0);
  const ytdPercent = ytdDue > 0 ? Math.round(Math.min(100, (ytdPaid / ytdDue) * 100)) : 0;

  const byMonth = new Map(twelve.map((g) => [g.yearMonth, g]));
  const sparkline = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    const key = `${yearStr}-${m}`;
    const g = byMonth.get(key);
    return {
      year_month: key,
      total_due: g ? Number(g._sum.amountDue ?? 0) : 0,
      total_paid: g ? Number(g._sum.amountPaid ?? 0) : 0,
    };
  });

  return NextResponse.json({
    village_name: profile?.displayName ?? null,
    default_monthly_fee: profile?.defaultMonthlyFee ?? 0,
    due_day_of_month: profile?.dueDayOfMonth ?? 5,
    bangkok_year: Number.parseInt(yearStr, 10),
    current_year_month: ym,
    active_houses: houseCount,
    resident_count: residentCount,
    pending_slips: pendingSlips,
    month_fee_rows: monthRows.length,
    month_total_due: totalDue,
    month_total_paid: totalPaid,
    month_paid_houses: paidHouses,
    month_pending_or_partial_rows: pendingFeeRows,
    month_collection_percent: monthCollectionPercent,
    ytd_total_due: ytdDue,
    ytd_total_paid: ytdPaid,
    ytd_collection_percent: ytdPercent,
    twelve_month_sparkline: sparkline,
  });
}
