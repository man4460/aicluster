import type { PrismaClient } from "@/generated/prisma/client";
import { bangkokMonthKey } from "@/lib/time/bangkok";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

export async function seedVillageTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  await tx.villageProfile.create({
    data: {
      ownerUserId,
      trialSessionId,
      displayName: "หมู่บ้านตัวอย่าง (ทดลอง)",
      address: "ถนนตัวอย่าง — ชุดทดลอง",
      defaultMonthlyFee: 850,
      dueDayOfMonth: 10,
      paymentChannelsNote: "โอนธนาคาร — แนบสลิปในระบบ",
    },
  });

  const h1 = await tx.villageHouse.create({
    data: {
      ownerUserId,
      trialSessionId,
      houseNo: "12/34",
      plotLabel: "A",
      ownerName: "นายสมชาย ใจดี",
      phone: "0811112222",
      sortOrder: 0,
      isActive: true,
    },
  });

  const h2 = await tx.villageHouse.create({
    data: {
      ownerUserId,
      trialSessionId,
      houseNo: "56/78",
      ownerName: "นางสาวสมหญิง รักสงบ",
      phone: "0893334444",
      monthlyFeeOverride: 900,
      sortOrder: 1,
      isActive: true,
    },
  });

  await tx.villageResident.createMany({
    data: [
      { houseId: h1.id, name: "นายสมชาย ใจดี", phone: "0811112222", isPrimary: true, isActive: true },
      { houseId: h1.id, name: "เด็กตัวอย่าง", note: "ลูก", isPrimary: false, isActive: true },
      { houseId: h2.id, name: "นางสาวสมหญิง รักสงบ", phone: "0893334444", isPrimary: true, isActive: true },
    ],
  });

  const ym = bangkokMonthKey();
  await tx.villageCommonFeeRow.createMany({
    data: [
      {
        ownerUserId,
        trialSessionId,
        houseId: h1.id,
        yearMonth: ym,
        amountDue: 850,
        amountPaid: 0,
        status: "PENDING",
      },
      {
        ownerUserId,
        trialSessionId,
        houseId: h2.id,
        yearMonth: ym,
        amountDue: 900,
        amountPaid: 0,
        status: "PENDING",
      },
    ],
  });
}
