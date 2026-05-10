import { formatBahtFromSatang } from "@/lib/format/money-th";
import { prisma } from "@/lib/prisma";

export type CommunityCoopDashboardDto = Awaited<ReturnType<typeof buildCommunityCoopDashboardDto>>;

export async function buildCommunityCoopDashboardDto(
  settings: { id: string; displayName: string },
  ownerUserId: string,
  trialSessionId: string,
) {
  const whereAcc = { ownerUserId, trialSessionId, isActive: true };

  const [accounts, agg, recent] = await Promise.all([
    prisma.communityCoopAccount.findMany({
      where: whereAcc,
      orderBy: [{ groupLabel: "asc" }, { memberCode: "asc" }],
      select: {
        id: true,
        memberCode: true,
        memberName: true,
        groupLabel: true,
        shareUnits: true,
        balanceSatang: true,
      },
    }),
    prisma.communityCoopAccount.aggregate({
      where: whereAcc,
      _sum: { balanceSatang: true, shareUnits: true },
      _count: { id: true },
    }),
    prisma.communityCoopLedgerEntry.findMany({
      where: { account: { ownerUserId, trialSessionId } },
      orderBy: { createdAt: "desc" },
      take: 14,
      include: {
        account: { select: { memberName: true, memberCode: true } },
      },
    }),
  ]);

  const totalSatang = agg._sum.balanceSatang ?? 0;
  return {
    settingsId: settings.id,
    displayName: settings.displayName,
    accountCount: agg._count.id,
    shareUnitsTotal: agg._sum.shareUnits ?? 0,
    totalSatang,
    totalLabel: formatBahtFromSatang(totalSatang),
    accounts: accounts.map((a) => ({
      ...a,
      balanceLabel: formatBahtFromSatang(a.balanceSatang),
    })),
    recent: recent.map((r) => ({
      id: r.id,
      type: r.type,
      amountSatang: r.amountSatang,
      amountLabel: formatBahtFromSatang(r.amountSatang),
      balanceAfterSatang: r.balanceAfterSatang,
      balanceAfterLabel: formatBahtFromSatang(r.balanceAfterSatang),
      note: r.note,
      createdAt: r.createdAt.toISOString(),
      memberName: r.account.memberName,
      memberCode: r.account.memberCode,
    })),
  };
}
