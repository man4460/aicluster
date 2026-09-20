import type { PrismaClient } from "@/generated/prisma/client";
import { isPrismaUniqueViolation } from "@/lib/prisma-errors";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { ensureSmartGuardDutyTemplates } from "@/systems/smart-guard-tour/lib/work-span";

type Db = Pick<
  PrismaClient,
  "smartGuardShop" | "smartGuardFinanceCategory" | "smartGuardDutyTemplate" | "user"
>;

function defaultSlugFromUser(username: string, ownerUserId: string): string {
  const base = username
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  if (base.length >= 3) return base;
  return `guard-${ownerUserId.slice(0, 8)}`;
}

const DEFAULT_CATEGORIES: {
  kind: "INCOME" | "EXPENSE";
  name: string;
  systemKey: string;
  sortOrder: number;
}[] = [
  { kind: "INCOME", name: "ค่าบริการรักษาความปลอดภัย", systemKey: "SECURITY_SERVICE", sortOrder: 10 },
  { kind: "EXPENSE", name: "ค่าแรง รปภ.", systemKey: "GUARD_WAGES", sortOrder: 20 },
  { kind: "EXPENSE", name: "ค่า OT / เบี้ยขยัน", systemKey: "OT_BONUS", sortOrder: 30 },
  { kind: "EXPENSE", name: "อุปกรณ์สายตรวจ", systemKey: "TOUR_EQUIPMENT", sortOrder: 40 },
  { kind: "EXPENSE", name: "อื่นๆ", systemKey: "OTHER", sortOrder: 50 },
];

async function ensureDefaultFinanceCategories(
  db: Db,
  shopId: string,
  ownerUserId: string,
  trialSessionId: string,
) {
  const existing = await db.smartGuardFinanceCategory.findMany({
    where: { shopId },
    select: { systemKey: true },
  });
  const have = new Set(existing.map((r) => r.systemKey).filter(Boolean));
  for (const cat of DEFAULT_CATEGORIES) {
    if (have.has(cat.systemKey)) continue;
    await db.smartGuardFinanceCategory.create({
      data: {
        ownerUserId,
        trialSessionId,
        shopId,
        kind: cat.kind,
        name: cat.name,
        systemKey: cat.systemKey,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
  }
}

export async function ensureSmartGuardShop(
  db: Db,
  ownerUserId: string,
  trialSessionId: string = TRIAL_PROD_SCOPE,
) {
  const existing = await db.smartGuardShop.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
  if (existing) {
    await ensureDefaultFinanceCategories(db, existing.id, ownerUserId, trialSessionId);
    await ensureSmartGuardDutyTemplates(db, existing.id, ownerUserId, trialSessionId);
    return existing;
  }

  const user = await db.user.findUnique({
    where: { id: ownerUserId },
    select: { username: true },
  });
  const username = user?.username ?? "guard";
  let slug = defaultSlugFromUser(username, ownerUserId);
  let suffix = 0;
  while (
    await db.smartGuardShop.findFirst({
      where: { slug, trialSessionId },
      select: { id: true },
    })
  ) {
    suffix += 1;
    slug = `${defaultSlugFromUser(username, ownerUserId)}-${suffix}`;
  }

  try {
    const shop = await db.smartGuardShop.create({
      data: {
        ownerUserId,
        trialSessionId,
        slug,
        displayName: "จุดตรวจ รปภ. อัจฉริยะ",
        portalEnabled: true,
        portalSosEnabled: true,
      },
    });
    await ensureDefaultFinanceCategories(db, shop.id, ownerUserId, trialSessionId);
    await ensureSmartGuardDutyTemplates(db, shop.id, ownerUserId, trialSessionId);
    return shop;
  } catch (e) {
    if (isPrismaUniqueViolation(e)) {
      const raced = await db.smartGuardShop.findUnique({
        where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
      });
      if (raced) {
        await ensureDefaultFinanceCategories(db, raced.id, ownerUserId, trialSessionId);
        await ensureSmartGuardDutyTemplates(db, raced.id, ownerUserId, trialSessionId);
        return raced;
      }
    }
    throw e;
  }
}

export async function findSmartGuardFinanceCategoryBySystemKey(
  db: Pick<PrismaClient, "smartGuardFinanceCategory">,
  shopId: string,
  systemKey: string,
) {
  return db.smartGuardFinanceCategory.findFirst({
    where: { shopId, systemKey, isActive: true },
  });
}
