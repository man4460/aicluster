import { formatBahtFromSatang } from "@/lib/format/money-th";
import { prisma } from "@/lib/prisma";

export type SchoolBankDashboardDto = Awaited<ReturnType<typeof buildSchoolBankDashboardDto>>;

export async function buildSchoolBankDashboardDto(
  settings: { id: string; displayName: string },
  ownerUserId: string,
  trialSessionId: string,
) {
  const whereAcc = { ownerUserId, trialSessionId, isActive: true };

  const [accounts, agg, recent] = await Promise.all([
    prisma.schoolBankAccount.findMany({
      where: whereAcc,
      orderBy: [{ classroomLabel: "asc" }, { memberCode: "asc" }],
      select: {
        id: true,
        memberCode: true,
        memberName: true,
        classroomLabel: true,
        balanceSatang: true,
      },
    }),
    prisma.schoolBankAccount.aggregate({
      where: whereAcc,
      _sum: { balanceSatang: true },
      _count: { id: true },
    }),
    prisma.schoolBankLedgerEntry.findMany({
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
