import type { PrismaClient } from "@/generated/prisma/client";
import { SchoolBankLedgerType } from "@/generated/prisma/enums";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

const DEMO_NOTE = "seed:school-bank-v1";

export async function seedSchoolBankProdDemoForOwner(prisma: PrismaClient, ownerUserId: string): Promise<void> {
  let settings = await prisma.schoolBankSettings.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE } },
  });
  if (!settings) {
    settings = await prisma.schoolBankSettings.create({
      data: {
        ownerUserId,
        trialSessionId: TRIAL_PROD_SCOPE,
        displayName: "ธนาคารโรงเรียน",
      },
    });
  }

  const accCount = await prisma.schoolBankAccount.count({ where: { settingsId: settings.id } });
  if (accCount === 0) {
    await prisma.schoolBankAccount.createMany({
      data: [
        {
          ownerUserId,
          trialSessionId: TRIAL_PROD_SCOPE,
          settingsId: settings.id,
          memberCode: "501",
          memberName: "เด็กชายตัวอย่าง ก.",
          classroomLabel: "ป.6/1",
        },
        {
          ownerUserId,
          trialSessionId: TRIAL_PROD_SCOPE,
          settingsId: settings.id,
          memberCode: "502",
          memberName: "เด็กหญิงตัวอย่าง ข.",
          classroomLabel: "ป.6/1",
        },
      ],
    });
  }

  const accounts = await prisma.schoolBankAccount.findMany({
    where: { settingsId: settings.id },
    orderBy: { memberCode: "asc" },
    take: 4,
  });
  if (accounts.length === 0) return;

  const existingLed = await prisma.schoolBankLedgerEntry.count({
    where: { accountId: { in: accounts.map((a) => a.id) }, note: DEMO_NOTE },
  });
  if (existingLed > 0) return;

  const amountsSatang = [15_000, 8_000, 5_000];
  for (let i = 0; i < Math.min(accounts.length, amountsSatang.length); i++) {
    const acc = accounts[i];
    const amountSatang = amountsSatang[i]!;
    await prisma.$transaction(async (tx) => {
      const row = await tx.schoolBankAccount.findUnique({ where: { id: acc.id } });
      if (!row) return;
      const newBal = row.balanceSatang + amountSatang;
      await tx.schoolBankLedgerEntry.create({
        data: {
          accountId: acc.id,
          type: SchoolBankLedgerType.DEPOSIT,
          amountSatang,
          balanceAfterSatang: newBal,
          note: DEMO_NOTE,
        },
      });
      await tx.schoolBankAccount.update({
        where: { id: acc.id },
        data: { balanceSatang: newBal },
      });
    });
  }
}

export async function seedSchoolBankTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  if (!trialSessionId || trialSessionId === TRIAL_PROD_SCOPE) return;
  const existing = await tx.schoolBankSettings.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
  if (existing) return;
  await tx.schoolBankSettings.create({
    data: {
      ownerUserId,
      trialSessionId,
      displayName: "ธนาคารโรงเรียน (ทดลอง)",
    },
  });
}
