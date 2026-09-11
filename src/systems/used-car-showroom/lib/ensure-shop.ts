import type { PrismaClient } from "@/generated/prisma/client";
import { isPrismaUniqueViolation } from "@/lib/prisma-errors";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

type Db = Pick<PrismaClient, "usedCarShowroomShop" | "usedCarFinanceCategory" | "user">;

function defaultSlugFromUser(username: string, ownerUserId: string): string {
  const base = username
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  if (base.length >= 3) return base;
  return `car-${ownerUserId.slice(0, 8)}`;
}

const DEFAULT_CATEGORIES: {
  kind: "INCOME" | "EXPENSE";
  name: string;
  systemKey: string;
  sortOrder: number;
}[] = [
  { kind: "EXPENSE", name: "รับซื้อรถ", systemKey: "PURCHASE", sortOrder: 10 },
  { kind: "INCOME", name: "ขายรถ", systemKey: "SALE", sortOrder: 20 },
  { kind: "EXPENSE", name: "ค่าคอม", systemKey: "COMMISSION", sortOrder: 30 },
  { kind: "EXPENSE", name: "อื่นๆ", systemKey: "OTHER", sortOrder: 40 },
  { kind: "INCOME", name: "อื่นๆ", systemKey: "OTHER_INCOME", sortOrder: 50 },
];

async function ensureDefaultFinanceCategories(
  db: Db,
  shopId: string,
  ownerUserId: string,
  trialSessionId: string,
) {
  const existing = await db.usedCarFinanceCategory.findMany({
    where: { shopId },
    select: { systemKey: true },
  });
  const have = new Set(existing.map((r) => r.systemKey).filter(Boolean));
  for (const cat of DEFAULT_CATEGORIES) {
    if (have.has(cat.systemKey)) continue;
    await db.usedCarFinanceCategory.create({
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

export async function ensureUsedCarShowroomShop(
  db: Db,
  ownerUserId: string,
  trialSessionId: string = TRIAL_PROD_SCOPE,
) {
  const existing = await db.usedCarShowroomShop.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
  if (existing) {
    await ensureDefaultFinanceCategories(db, existing.id, ownerUserId, trialSessionId);
    return existing;
  }

  const user = await db.user.findUnique({
    where: { id: ownerUserId },
    select: { username: true },
  });
  const username = user?.username ?? "car";
  let slug = defaultSlugFromUser(username, ownerUserId);
  let suffix = 0;
  while (
    await db.usedCarShowroomShop.findFirst({
      where: { slug, trialSessionId },
      select: { id: true },
    })
  ) {
    suffix += 1;
    slug = `${defaultSlugFromUser(username, ownerUserId)}-${suffix}`;
  }

  try {
    const shop = await db.usedCarShowroomShop.create({
      data: {
        ownerUserId,
        trialSessionId,
        slug,
        displayName: "โชว์รูมรถมือสอง",
        portalEnabled: true,
        portalBookingPaymentMode: "DEPOSIT",
        depositAmountBaht: 5000,
      },
    });
    await ensureDefaultFinanceCategories(db, shop.id, ownerUserId, trialSessionId);
    return shop;
  } catch (e) {
    if (isPrismaUniqueViolation(e)) {
      const raced = await db.usedCarShowroomShop.findUnique({
        where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
      });
      if (raced) {
        await ensureDefaultFinanceCategories(db, raced.id, ownerUserId, trialSessionId);
        return raced;
      }
    }
    throw e;
  }
}

export async function findUsedCarFinanceCategoryBySystemKey(
  db: Pick<PrismaClient, "usedCarFinanceCategory">,
  shopId: string,
  systemKey: string,
) {
  return db.usedCarFinanceCategory.findFirst({
    where: { shopId, systemKey, isActive: true },
  });
}
