import { prisma } from "@/lib/prisma";

const BUILTIN_INCOME = [{ kind: "PARKING_SESSION" as const, name: "ค่าจอดรถ", sortOrder: 0 }];
const DEFAULT_CUSTOM_INCOME = [{ name: "รายรับอื่นๆ", sortOrder: 10 }];

/** สร้างหมวดรายรับหลักและหมวดกำหนดเองเริ่มต้น พร้อมเก็บหมวดที่มีรายการใช้งานอยู่ */
export async function ensureParkingIncomeCategories(ownerUserId: string, trialSessionId: string) {
  for (const row of BUILTIN_INCOME) {
    const existing = await prisma.parkingIncomeCategory.findMany({
      where: { ownerUserId, trialSessionId, kind: row.kind, isBuiltin: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    });

    if (existing.length === 0) {
      try {
        await prisma.parkingIncomeCategory.create({
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
        // request อื่นอาจสร้างพร้อมกัน
      }
      continue;
    }

    const [keep, ...dupes] = existing;
    if (keep && keep.name !== row.name) {
      await prisma.parkingIncomeCategory.update({
        where: { id: keep.id },
        data: { name: row.name, sortOrder: row.sortOrder },
      });
    }
    if (dupes.length > 0) {
      const duplicateIds = dupes.map((item) => item.id);
      const used = await prisma.parkingIncomeEntry.groupBy({
        by: ["categoryId"],
        where: { categoryId: { in: duplicateIds } },
        _count: { _all: true },
      });
      const busy = new Set(used.map((item) => item.categoryId));
      const removable = duplicateIds.filter((id) => !busy.has(id));
      if (removable.length > 0) {
        await prisma.parkingIncomeCategory.deleteMany({ where: { id: { in: removable } } });
      }
    }
  }

  const customs = await prisma.parkingIncomeCategory.findMany({
    where: { ownerUserId, trialSessionId, kind: "CUSTOM", isBuiltin: false },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, name: true },
  });
  if (customs.length === 0) {
    for (const row of DEFAULT_CUSTOM_INCOME) {
      try {
        await prisma.parkingIncomeCategory.create({
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
        // request อื่นอาจสร้างพร้อมกัน
      }
    }
  }
}
