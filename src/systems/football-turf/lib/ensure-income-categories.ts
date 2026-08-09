import { prisma } from "@/lib/prisma";

const BUILTIN_INCOME = [
  { kind: "COURT_RENTAL" as const, name: "ค่าสนาม", sortOrder: 0 },
  { kind: "PROMOTION" as const, name: "โปรโมชัน", sortOrder: 1 },
];

const DEFAULT_CUSTOM_INCOME = [{ name: "เช่าพื้นที่ขายของ", sortOrder: 10 }];

/** สร้างหมวดรายรับหลัก (ค่าสนาม / โปรโมชัน) ถ้ายังไม่มี — ร้านเก่าก็ได้ */
export async function ensureFootballTurfIncomeCategories(ownerUserId: string, trialSessionId: string) {
  for (const row of BUILTIN_INCOME) {
    const existing = await prisma.footballTurfIncomeCategory.findFirst({
      where: {
        ownerUserId,
        trialSessionId,
        kind: row.kind,
        isBuiltin: true,
      },
      select: { id: true, name: true },
    });
    if (existing) {
      if (existing.name !== row.name) {
        await prisma.footballTurfIncomeCategory.update({
          where: { id: existing.id },
          data: { name: row.name },
        });
      }
      continue;
    }
    await prisma.footballTurfIncomeCategory.create({
      data: {
        ownerUserId,
        trialSessionId,
        name: row.name,
        kind: row.kind,
        isBuiltin: true,
        sortOrder: row.sortOrder,
      },
    });
  }

  const customCount = await prisma.footballTurfIncomeCategory.count({
    where: { ownerUserId, trialSessionId, kind: "CUSTOM" },
  });
  if (customCount === 0) {
    for (const row of DEFAULT_CUSTOM_INCOME) {
      await prisma.footballTurfIncomeCategory.create({
        data: {
          ownerUserId,
          trialSessionId,
          name: row.name,
          kind: "CUSTOM",
          isBuiltin: false,
          sortOrder: row.sortOrder,
        },
      });
    }
  }
}
