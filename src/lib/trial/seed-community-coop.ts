import type { PrismaClient } from "@/generated/prisma/client";
import { CommunityCoopLedgerType } from "@/generated/prisma/enums";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

const DEMO_NOTE = "seed:community-coop-v1";

export async function seedCommunityCoopProdDemoForOwner(prisma: PrismaClient, ownerUserId: string): Promise<void> {
  let settings = await prisma.communityCoopSettings.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE } },
  });
  if (!settings) {
    settings = await prisma.communityCoopSettings.create({
      data: {
        ownerUserId,
        trialSessionId: TRIAL_PROD_SCOPE,
        displayName: "สหกรณ์ชุมชนตัวอย่าง",
      },
    });
  }

  const accCount = await prisma.communityCoopAccount.count({ where: { settingsId: settings.id } });
  if (accCount === 0) {
    await prisma.communityCoopAccount.createMany({
      data: [
        {
          ownerUserId,
          trialSessionId: TRIAL_PROD_SCOPE,
          settingsId: settings.id,
          memberCode: "C-001",
          memberName: "คุณสมชาย ใจดี",
          groupLabel: "หมู่ 3",
          shareUnits: 10,
        },
        {
          ownerUserId,
          trialSessionId: TRIAL_PROD_SCOPE,
          settingsId: settings.id,
          memberCode: "C-002",
          memberName: "คุณสมหญิง ร่วมพัฒนา",
          groupLabel: "หมู่ 3",
          shareUnits: 6,
        },
      ],
    });
  }

  const accounts = await prisma.communityCoopAccount.findMany({
    where: { settingsId: settings.id },
    orderBy: { memberCode: "asc" },
    take: 4,
  });
  if (accounts.length === 0) return;

  const existingLed = await prisma.communityCoopLedgerEntry.count({
    where: { accountId: { in: accounts.map((a) => a.id) }, note: DEMO_NOTE },
  });
  if (existingLed > 0) return;

  const steps: { idx: number; type: CommunityCoopLedgerType; amountSatang: number }[] = [
    { idx: 0, type: CommunityCoopLedgerType.DEPOSIT, amountSatang: 20_000 },
    { idx: 1, type: CommunityCoopLedgerType.DEPOSIT, amountSatang: 12_000 },
    { idx: 0, type: CommunityCoopLedgerType.DIVIDEND, amountSatang: 3_500 },
  ];

  for (const step of steps) {
    const acc = accounts[step.idx];
    if (!acc) continue;
    await prisma.$transaction(async (tx) => {
      const row = await tx.communityCoopAccount.findUnique({ where: { id: acc.id } });
      if (!row) return;
      const isAdd =
        step.type === CommunityCoopLedgerType.DEPOSIT || step.type === CommunityCoopLedgerType.DIVIDEND;
      const delta = isAdd ? step.amountSatang : -step.amountSatang;
      const newBal = row.balanceSatang + delta;
      if (newBal < 0) return;
      await tx.communityCoopLedgerEntry.create({
        data: {
          accountId: acc.id,
          type: step.type,
          amountSatang: step.amountSatang,
          balanceAfterSatang: newBal,
          note: DEMO_NOTE,
        },
      });
      await tx.communityCoopAccount.update({
        where: { id: acc.id },
        data: { balanceSatang: newBal },
      });
    });
  }
}

export async function seedCommunityCoopTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  if (!trialSessionId || trialSessionId === TRIAL_PROD_SCOPE) return;
  const existing = await tx.communityCoopSettings.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
  if (existing) return;
  await tx.communityCoopSettings.create({
    data: {
      ownerUserId,
      trialSessionId,
      displayName: "สหกรณ์ชุมชน (ทดลอง)",
    },
  });
}
