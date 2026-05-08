import { prisma } from "@/lib/prisma";

const TARGET_EMAILS = [
  "admin@mawell.local",
  "user@mawell.local",
  "user@mawell.local.com",
] as const;

const TRIAL_SESSION_ID = "prod";

type FeePlan = {
  ym: string;
  due: number;
  paid: number;
  note: string;
  paidAt: string;
};

const FEE_PLANS_BY_HOUSE_INDEX: Record<number, FeePlan[]> = {
  0: [
    { ym: "2026-01", due: 1000, paid: 1000, note: "ชำระตรงเวลา (Q1 demo)", paidAt: "2026-01-05T10:15:00+07:00" },
    { ym: "2026-02", due: 1000, paid: 1000, note: "ชำระผ่านพร้อมเพย์ (Q1 demo)", paidAt: "2026-02-06T11:00:00+07:00" },
    { ym: "2026-03", due: 1000, paid: 900, note: "ทยอยชำระ (Q1 demo)", paidAt: "2026-03-07T13:20:00+07:00" },
  ],
  1: [
    { ym: "2026-01", due: 1200, paid: 1000, note: "คงค้างบางส่วน (Q1 demo)", paidAt: "2026-01-08T18:45:00+07:00" },
    { ym: "2026-02", due: 1200, paid: 1200, note: "ปิดยอดครบ (Q1 demo)", paidAt: "2026-02-08T19:10:00+07:00" },
  ],
  2: [
    { ym: "2026-03", due: 1500, paid: 1500, note: "ชำระครบ (Q1 demo)", paidAt: "2026-03-11T09:30:00+07:00" },
  ],
};

const COST_ITEMS = [
  { category: "สาธารณูปโภค", label: "ค่าไฟไฟถนนส่วนกลาง", amount: 3200, spentAt: "2026-01-10T09:00:00+07:00", note: "Q1 demo" },
  { category: "ดูแลพื้นที่", label: "ค่าทำความสะอาดพื้นที่ส่วนกลาง", amount: 1800, spentAt: "2026-01-22T14:20:00+07:00", note: "Q1 demo" },
  { category: "รปภ.", label: "ค่าเวรเสริมช่วงเทศกาล", amount: 2500, spentAt: "2026-02-08T20:10:00+07:00", note: "Q1 demo" },
  { category: "ซ่อมบำรุง", label: "ซ่อมปั๊มน้ำสำรอง", amount: 2100, spentAt: "2026-02-20T10:50:00+07:00", note: "Q1 demo" },
  { category: "ดูแลพื้นที่", label: "ตัดแต่งต้นไม้และสวน", amount: 1900, spentAt: "2026-03-05T08:40:00+07:00", note: "Q1 demo" },
  { category: "ซ่อมบำรุง", label: "เปลี่ยนอุปกรณ์กล้องทางเข้า", amount: 2600, spentAt: "2026-03-18T16:05:00+07:00", note: "Q1 demo" },
] as const;

async function ensureCategory(ownerUserId: string, name: string) {
  const existed = await prisma.villageCostCategory.findFirst({
    where: { ownerUserId, trialSessionId: TRIAL_SESSION_ID, name },
    select: { id: true },
  });
  if (existed) return existed.id;
  const created = await prisma.villageCostCategory.create({
    data: { ownerUserId, trialSessionId: TRIAL_SESSION_ID, name },
    select: { id: true },
  });
  return created.id;
}

async function ensureQ1Fees(ownerUserId: string, houseIds: number[]) {
  for (let i = 0; i < houseIds.length; i += 1) {
    const plans = FEE_PLANS_BY_HOUSE_INDEX[i];
    if (!plans) continue;
    const houseId = houseIds[i];
    for (const p of plans) {
      const status = p.paid <= 0 ? "PENDING" : p.paid >= p.due ? "PAID" : "PARTIAL";
      await prisma.villageCommonFeeRow.upsert({
        where: {
          ownerUserId_trialSessionId_houseId_yearMonth: {
            ownerUserId,
            trialSessionId: TRIAL_SESSION_ID,
            houseId,
            yearMonth: p.ym,
          },
        },
        update: {
          amountDue: p.due,
          amountPaid: p.paid,
          status,
          note: p.note,
          paidAt: p.paid > 0 ? new Date(p.paidAt) : null,
        },
        create: {
          ownerUserId,
          trialSessionId: TRIAL_SESSION_ID,
          houseId,
          yearMonth: p.ym,
          amountDue: p.due,
          amountPaid: p.paid,
          status,
          note: p.note,
          paidAt: p.paid > 0 ? new Date(p.paidAt) : null,
        },
      });
    }
  }
}

async function ensureQ1Costs(ownerUserId: string) {
  const categoryMap = new Map<string, number>();
  for (const item of COST_ITEMS) {
    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, await ensureCategory(ownerUserId, item.category));
    }
    const categoryId = categoryMap.get(item.category)!;
    const spentAt = new Date(item.spentAt);
    const existed = await prisma.villageCostEntry.findFirst({
      where: {
        ownerUserId,
        trialSessionId: TRIAL_SESSION_ID,
        spentAt,
        itemLabel: item.label,
      },
      select: { id: true },
    });
    if (existed) continue;
    await prisma.villageCostEntry.create({
      data: {
        ownerUserId,
        trialSessionId: TRIAL_SESSION_ID,
        categoryId,
        spentAt,
        amount: item.amount,
        itemLabel: item.label,
        note: item.note,
      },
    });
  }
}

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { in: [...TARGET_EMAILS] } },
    select: { id: true, email: true },
  });
  if (users.length === 0) {
    console.log("No target demo users found.");
    return;
  }

  for (const user of users) {
    const houses = await prisma.villageHouse.findMany({
      where: { ownerUserId: user.id, trialSessionId: TRIAL_SESSION_ID, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      take: 3,
      select: { id: true },
    });
    if (houses.length === 0) {
      console.log(`Skip ${user.email}: no village houses in prod scope`);
      continue;
    }
    await ensureQ1Fees(
      user.id,
      houses.map((h) => h.id),
    );
    await ensureQ1Costs(user.id);
    console.log(`Updated Q1 finance demo data for ${user.email}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
