import type { PrismaClient } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";

/** แถวที่ seed — รันซ้ำได้โดยตรวจจากคู่นี้ */
const SEED_EXTERNAL_SOURCE = "seed-prod-demo";

function demoEntryDate(daysAgo: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

/** รายการรายรับ–รายจ่ายตัวอย่างสำหรับบัญชี demo */
export async function seedHomeFinanceProdDemoForOwner(db: PrismaClient, ownerUserId: string): Promise<void> {
  const existing = await db.homeFinanceEntry.findFirst({
    where: { ownerUserId, externalSource: SEED_EXTERNAL_SOURCE },
    select: { id: true },
  });
  if (existing) return;

  await db.homeFinanceEntry.createMany({
    data: [
      {
        ownerUserId,
        entryDate: demoEntryDate(7),
        type: "INCOME",
        categoryKey: "salary",
        categoryLabel: "รายได้",
        title: "เงินเดือน (ตัวอย่าง)",
        amount: new Prisma.Decimal("35000.00"),
        externalSource: SEED_EXTERNAL_SOURCE,
        externalId: "income-1",
      },
      {
        ownerUserId,
        entryDate: demoEntryDate(3),
        type: "EXPENSE",
        categoryKey: "utilities",
        categoryLabel: "สาธารณูปโภค",
        title: "ค่าไฟฟ้า (ตัวอย่าง)",
        amount: new Prisma.Decimal("2150.75"),
        externalSource: SEED_EXTERNAL_SOURCE,
        externalId: "expense-util",
      },
      {
        ownerUserId,
        entryDate: demoEntryDate(1),
        type: "EXPENSE",
        categoryKey: "food",
        categoryLabel: "อาหาร",
        title: "ซื้อของห้องครัว (ตัวอย่าง)",
        amount: new Prisma.Decimal("890.00"),
        externalSource: SEED_EXTERNAL_SOURCE,
        externalId: "expense-food",
      },
    ],
  });
}
