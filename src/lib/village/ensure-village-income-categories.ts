import { prisma } from "@/lib/prisma";

const BUILTIN_INCOME = [{ kind: "COMMON_FEE" as const, name: "ค่าส่วนกลาง", sortOrder: 0 }];

const DEFAULT_CUSTOM_INCOME = [{ name: "ค่าเช่าอื่นๆ", sortOrder: 10 }];

/** สร้างหมวดรายรับหลัก (ค่าส่วนกลาง) + หมวด CUSTOM เริ่มต้น — และลบหมวดหลักที่ซ้ำจาก race */
export async function ensureVillageIncomeCategories(ownerUserId: string, trialSessionId: string) {
  for (const row of BUILTIN_INCOME) {
    const existing = await prisma.villageIncomeCategory.findMany({
      where: {
        ownerUserId,
        trialSessionId,
        kind: row.kind,
        isBuiltin: true,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    });

    if (existing.length === 0) {
      try {
        await prisma.villageIncomeCategory.create({
          data: {
            ownerUserId,
            trialSessionId,
            name: row.name,
            kind: row.kind,
            isBuiltin: true,
            sortOrder: row.sortOrder,
          },
        });
      } catch {
        /* race กับ request อื่น — รอบถัดไปจะ dedupe */
      }
      continue;
    }

    const [keep, ...dupes] = existing;
    if (keep && keep.name !== row.name) {
      await prisma.villageIncomeCategory.update({
        where: { id: keep.id },
        data: { name: row.name },
      });
    }
    if (dupes.length > 0) {
      await prisma.villageIncomeCategory.deleteMany({
        where: { id: { in: dupes.map((d) => d.id) } },
      });
    }
  }

  const customs = await prisma.villageIncomeCategory.findMany({
    where: { ownerUserId, trialSessionId, kind: "CUSTOM", isBuiltin: false },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, name: true },
  });

  if (customs.length === 0) {
    for (const row of DEFAULT_CUSTOM_INCOME) {
      try {
        await prisma.villageIncomeCategory.create({
          data: {
            ownerUserId,
            trialSessionId,
            name: row.name,
            kind: "CUSTOM",
            isBuiltin: false,
            sortOrder: row.sortOrder,
          },
        });
      } catch {
        /* ignore race */
      }
    }
    return;
  }

  for (const seedName of DEFAULT_CUSTOM_INCOME.map((r) => r.name)) {
    const sameName = customs.filter((c) => c.name === seedName);
    if (sameName.length <= 1) continue;
    const [, ...extra] = sameName;
    const extraIds = extra.map((c) => c.id);
    const withEntries = await prisma.villageIncomeEntry.groupBy({
      by: ["categoryId"],
      where: { categoryId: { in: extraIds } },
      _count: { _all: true },
    });
    const busy = new Set(withEntries.map((g) => g.categoryId));
    const removable = extraIds.filter((id) => !busy.has(id));
    if (removable.length > 0) {
      await prisma.villageIncomeCategory.deleteMany({
        where: { id: { in: removable } },
      });
    }
  }
}
