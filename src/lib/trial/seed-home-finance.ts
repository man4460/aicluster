import type { PrismaClient } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";

/** แถวที่ seed — รันซ้ำได้ ลบเฉพาะข้อมูลที่มีแท็กนี้ก่อนแทรกใหม่ */
const SEED_EXTERNAL_SOURCE = "seed-prod-demo";
const SEED_TITLE_PREFIX = "(ตัวอย่าง)";

const DEMO_SLIP_FOOD = "https://picsum.photos/seed/hf-food/960/1280.jpg";
const DEMO_SLIP_INCOME = "https://picsum.photos/seed/hf-income/960/1280.jpg";
const DEMO_SLIP_UTIL = "https://picsum.photos/seed/hf-util/960/1280.jpg";
const DEMO_DOC_ID = "https://picsum.photos/seed/hf-doc-id/800/500.jpg";

const CATEGORY_SEEDS = [
  { name: "เงินเดือน", sortOrder: 10 },
  { name: "รายได้เสริม", sortOrder: 20 },
  { name: "ค่าอาหาร", sortOrder: 30 },
  { name: "ค่าเดินทาง", sortOrder: 40 },
  { name: "ค่าสาธารณูปโภค", sortOrder: 50 },
  { name: "ของใช้ในบ้าน", sortOrder: 60 },
] as const;

function demoEntryDate(daysAgo: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function categoryKeyFromId(id: number): string {
  return `CUSTOM_${id}`;
}

async function ensureCategories(db: PrismaClient, ownerUserId: string) {
  const map = new Map<string, number>();
  for (const c of CATEGORY_SEEDS) {
    const row = await db.homeFinanceCategory.upsert({
      where: { ownerUserId_name: { ownerUserId, name: c.name } },
      create: {
        ownerUserId,
        name: c.name,
        sortOrder: c.sortOrder,
        isActive: true,
        isSystem: false,
        systemKey: null,
      },
      update: { sortOrder: c.sortOrder, isActive: true },
      select: { id: true, name: true },
    });
    map.set(row.name, row.id);
  }
  return map;
}

async function clearSeedTaggedRows(db: PrismaClient, ownerUserId: string) {
  await db.homeFinanceEntry.deleteMany({
    where: { ownerUserId, externalSource: SEED_EXTERNAL_SOURCE },
  });
  await db.homeFinanceReminder.deleteMany({
    where: { ownerUserId, title: { startsWith: SEED_TITLE_PREFIX } },
  });
  await db.homeFinancePersonalDocument.deleteMany({
    where: { ownerUserId, title: { startsWith: SEED_TITLE_PREFIX } },
  });
}

/** รายรับ–รายจ่าย + หมวด + แจ้งเตือน + เอกสารส่วนตัว สำหรับบัญชี demo */
export async function seedHomeFinanceProdDemoForOwner(db: PrismaClient, ownerUserId: string): Promise<void> {
  await clearSeedTaggedRows(db, ownerUserId);
  const categories = await ensureCategories(db, ownerUserId);

  const cat = (name: (typeof CATEGORY_SEEDS)[number]["name"]) => {
    const id = categories.get(name);
    if (!id) throw new Error(`missing category: ${name}`);
    return { id, key: categoryKeyFromId(id), label: name };
  };

  const salary = cat("เงินเดือน");
  const extra = cat("รายได้เสริม");
  const food = cat("ค่าอาหาร");
  const travel = cat("ค่าเดินทาง");
  const util = cat("ค่าสาธารณูปโภค");
  const home = cat("ของใช้ในบ้าน");

  await db.homeFinanceEntry.createMany({
    data: [
      {
        ownerUserId,
        entryDate: demoEntryDate(28),
        type: "INCOME",
        categoryKey: salary.key,
        categoryLabel: salary.label,
        title: `${SEED_TITLE_PREFIX} เงินเดือนประจำเดือน`,
        amount: new Prisma.Decimal("35000.00"),
        slipImageUrl: DEMO_SLIP_INCOME,
        attachmentUrls: [DEMO_SLIP_INCOME],
        note: "โอนเข้าบัญชีกสิกร",
        externalSource: SEED_EXTERNAL_SOURCE,
        externalId: "income-salary",
      },
      {
        ownerUserId,
        entryDate: demoEntryDate(14),
        type: "INCOME",
        categoryKey: extra.key,
        categoryLabel: extra.label,
        title: `${SEED_TITLE_PREFIX} งานฟรีแลนซ์ออกแบบ`,
        amount: new Prisma.Decimal("6500.00"),
        slipImageUrl: DEMO_SLIP_INCOME,
        attachmentUrls: [DEMO_SLIP_INCOME],
        note: "รับโอนพร้อมเพย์",
        externalSource: SEED_EXTERNAL_SOURCE,
        externalId: "income-freelance",
      },
      {
        ownerUserId,
        entryDate: demoEntryDate(20),
        type: "EXPENSE",
        categoryKey: util.key,
        categoryLabel: util.label,
        title: `${SEED_TITLE_PREFIX} ค่าไฟฟ้าเดือนนี้`,
        amount: new Prisma.Decimal("2180.50"),
        slipImageUrl: DEMO_SLIP_UTIL,
        attachmentUrls: [DEMO_SLIP_UTIL],
        note: "ชำระผ่านแอปธนาคาร",
        externalSource: SEED_EXTERNAL_SOURCE,
        externalId: "expense-electric",
      },
      {
        ownerUserId,
        entryDate: demoEntryDate(12),
        type: "EXPENSE",
        categoryKey: travel.key,
        categoryLabel: travel.label,
        title: `${SEED_TITLE_PREFIX} เติมน้ำมันรถ`,
        amount: new Prisma.Decimal("1200.00"),
        slipImageUrl: DEMO_SLIP_UTIL,
        attachmentUrls: [DEMO_SLIP_UTIL],
        externalSource: SEED_EXTERNAL_SOURCE,
        externalId: "expense-fuel",
      },
      {
        ownerUserId,
        entryDate: demoEntryDate(7),
        type: "EXPENSE",
        categoryKey: food.key,
        categoryLabel: food.label,
        title: `${SEED_TITLE_PREFIX} ซื้อของเข้าบ้าน`,
        amount: new Prisma.Decimal("945.00"),
        slipImageUrl: DEMO_SLIP_FOOD,
        attachmentUrls: [DEMO_SLIP_FOOD],
        externalSource: SEED_EXTERNAL_SOURCE,
        externalId: "expense-grocery",
      },
      {
        ownerUserId,
        entryDate: demoEntryDate(3),
        type: "EXPENSE",
        categoryKey: food.key,
        categoryLabel: food.label,
        title: `${SEED_TITLE_PREFIX} อาหารกลางวัน`,
        amount: new Prisma.Decimal("185.00"),
        slipImageUrl: DEMO_SLIP_FOOD,
        attachmentUrls: [DEMO_SLIP_FOOD],
        externalSource: SEED_EXTERNAL_SOURCE,
        externalId: "expense-lunch",
      },
      {
        ownerUserId,
        entryDate: demoEntryDate(1),
        type: "EXPENSE",
        categoryKey: home.key,
        categoryLabel: home.label,
        title: `${SEED_TITLE_PREFIX} ซื้อของใช้ในบ้าน`,
        amount: new Prisma.Decimal("560.00"),
        slipImageUrl: DEMO_SLIP_FOOD,
        attachmentUrls: [DEMO_SLIP_FOOD],
        externalSource: SEED_EXTERNAL_SOURCE,
        externalId: "expense-home",
      },
    ],
  });

  const remindDue = new Date();
  remindDue.setHours(12, 0, 0, 0);
  remindDue.setDate(remindDue.getDate() + 5);

  await db.homeFinanceReminder.create({
    data: {
      ownerUserId,
      title: `${SEED_TITLE_PREFIX} ชำระค่าไฟฟ้า`,
      dueDate: remindDue,
      note: "แจ้งเตือนตัวอย่าง — ครบกำหนดใน 5 วัน",
      isDone: false,
    },
  });

  await db.homeFinancePersonalDocument.createMany({
    data: [
      {
        ownerUserId,
        title: `${SEED_TITLE_PREFIX} บัตรประชาชน`,
        category: "เอกสารราชการ",
        fileUrl: DEMO_DOC_ID,
        mimeType: "image/jpeg",
        note: "สำเนาบัตร — ตัวอย่าง",
      },
      {
        ownerUserId,
        title: `${SEED_TITLE_PREFIX} สัญญาเช่าห้อง`,
        category: "สัญญา",
        fileUrl: DEMO_SLIP_UTIL,
        mimeType: "image/jpeg",
        note: "เก็บไว้อ้างอิง — ตัวอย่าง",
      },
    ],
  });
}
