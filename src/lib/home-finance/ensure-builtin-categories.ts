import type { PrismaClient } from "@/generated/prisma/client";
import { HOME_FINANCE_BUILTIN_CATEGORIES } from "./builtin-categories";

/**
 * upsert หมวด built-in ทั้งหมดสำหรับเจ้าของคนหนึ่ง — เรียกได้บ่อย ปลอดภัย ไม่กระทบรายการที่ถูก rename/ปิดใช้งานไปแล้ว
 *
 * พฤติกรรม:
 * - ถ้ายังไม่มี row ที่ (owner, systemKey) ตรงกัน → สร้างใหม่ด้วย name/sortOrder ตั้งต้น isActive=true
 * - ถ้ามีอยู่แล้ว → ไม่แก้ name/sortOrder/isActive (เคารพการแก้ของผู้ใช้)
 */
export async function ensureHomeFinanceBuiltinCategories(
  prisma: PrismaClient,
  ownerUserId: string,
): Promise<void> {
  const existing = await prisma.homeFinanceCategory.findMany({
    where: { ownerUserId, systemKey: { in: HOME_FINANCE_BUILTIN_CATEGORIES.map((c) => c.key) } },
    select: { systemKey: true },
  });
  const have = new Set(existing.map((r) => r.systemKey).filter((k): k is string => !!k));
  const missing = HOME_FINANCE_BUILTIN_CATEGORIES.filter((c) => !have.has(c.key));
  if (missing.length === 0) return;

  await Promise.all(
    missing.map((c) =>
      prisma.homeFinanceCategory
        .create({
          data: {
            ownerUserId,
            systemKey: c.key,
            isSystem: true,
            name: c.name,
            sortOrder: c.sortOrder,
            isActive: true,
          },
        })
        // ในกรณีชนชื่อ (ผู้ใช้เคยสร้างหมวด custom ชื่อซ้ำกับ built-in) — ข้ามไป
        .catch(() => null),
    ),
  );
}
