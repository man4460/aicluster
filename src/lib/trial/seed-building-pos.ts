import type { PrismaClient } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { bangkokDateKeyMinusDays, bangkokDayStartEndForDateKey } from "@/lib/barber/bangkok-day";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { bangkokDateKey } from "@/lib/time/bangkok";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

type DbLike = Tx | PrismaClient;

/**
 * รูปตัวอย่างจาก Wikimedia Commons — ชื่อไฟล์ตรงกับหน้า `File:…` บน Commons (รูปอาหารที่สื่อความหมาย)
 * ใช้ Special:Redirect เพื่อได้ความกว้างคงที่ ~640px โดยไม่ hard-code path แบบ thumb
 * @see https://commons.wikimedia.org/wiki/Special:Redirect/file
 */
function buildingPosCommonsDemoImage(commonsFileName: string, width = 640): string {
  const name = commonsFileName.trim();
  const url = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(name)}?width=${width}`;
  if (url.length > 512) throw new Error(`seed building-pos: image_url ยาวเกิน 512: ${name}`);
  return url;
}

/** รูปหมวดตัวอย่าง (ความยาวไม่เกิน 512 ตามคอลัมน์ image_url) */
export const BUILDING_POS_DEMO_CATEGORY_IMAGES: readonly string[] = [
  buildingPosCommonsDemoImage("Som Tam or Thai Green Papaya Salad.jpg"),
  buildingPosCommonsDemoImage("Cha Yen - Mint Thai AUD2.50.jpg"),
  buildingPosCommonsDemoImage("Summer roll.jpg"),
  buildingPosCommonsDemoImage("Khao Phat Kung.jpg"),
  buildingPosCommonsDemoImage("Mango sticky rice served in Thailand.jpg"),
];

type SeedMenuRow = {
  name: string;
  price: number;
  description: string;
  isFeatured: boolean;
  imageUrl: string;
};

type SeedCategorySpec = {
  name: string;
  sortOrder: number;
  imageUrl: string;
  menu: SeedMenuRow[];
};

/** จำนวนเมนูต่อหมวด — รวม 5 หมวด × 4 = 20 เมนู (เฉลี่ยตามหมวด) */
export const BUILDING_POS_SEED_MENUS_PER_CATEGORY = 4 as const;
export const BUILDING_POS_SEED_MENU_TOTAL =
  BUILDING_POS_DEMO_CATEGORY_IMAGES.length * BUILDING_POS_SEED_MENUS_PER_CATEGORY;

/**
 * แคตตาล็อกตัวอย่าง — ใช้ทั้ง prod demo และ trial (trial จะต่อท้ายชื่อหมวดด้วย " (ทดลอง)")
 * โครงสร้างคงที่: 5 หมวด × 4 เมนู = 20 รายการ
 */
const BUILDING_POS_SEED_CATALOG: SeedCategorySpec[] = [
  {
    name: "กับข้าวไทย",
    sortOrder: 10,
    imageUrl: BUILDING_POS_DEMO_CATEGORY_IMAGES[0]!,
    menu: [
      {
        name: "แกงเขียวหวานไก่",
        price: 95,
        description: "พร้อมข้าวสวยร้อน ๆ",
        isFeatured: true,
        imageUrl: buildingPosCommonsDemoImage("Thai green chicken curry and roti.jpg"),
      },
      {
        name: "แกงมัสมั่นเนื้อ",
        price: 120,
        description: "เนื้อเปื่อย น้ำแกงหอมเครื่องเทศ",
        isFeatured: true,
        imageUrl: buildingPosCommonsDemoImage("Massaman curry, Bang Kapi, Bangkok.jpg"),
      },
      {
        name: "ผัดกะเพราไก่ไข่ดาว",
        price: 75,
        description: "ไก่สับกรอบนอกนุ่มใน",
        isFeatured: false,
        imageUrl: buildingPosCommonsDemoImage("Kao Rad Pad Kra-pao - Unithai 2023-07-08.jpg"),
      },
      {
        name: "ต้มข่าไก่",
        price: 98,
        description: "น้ำข้นหอมตะไคร้ใบมะกรูด",
        isFeatured: false,
        imageUrl: buildingPosCommonsDemoImage("Tom kha gai.jpg"),
      },
    ],
  },
  {
    name: "เครื่องดื่ม",
    sortOrder: 20,
    imageUrl: BUILDING_POS_DEMO_CATEGORY_IMAGES[1]!,
    menu: [
      { name: "น้ำเปล่า", price: 15, description: "500 ml", isFeatured: false, imageUrl: buildingPosCommonsDemoImage("Bottled water.jpg") },
      { name: "ชาเย็น", price: 40, description: "ชาแดงนมสด", isFeatured: true, imageUrl: buildingPosCommonsDemoImage("Cha Yen - Mint Thai AUD2.50.jpg") },
      { name: "กาแฟเย็น", price: 45, description: "เอสเปรสโซนมสด", isFeatured: true, imageUrl: buildingPosCommonsDemoImage("Iced coffee.jpg") },
      { name: "นมปั่นมะม่วง", price: 55, description: "มะม่วงสุกหวานหอม", isFeatured: false, imageUrl: buildingPosCommonsDemoImage("Mango milkshake.jpg") },
    ],
  },
  {
    name: "ของว่าง · สลัด",
    sortOrder: 30,
    imageUrl: BUILDING_POS_DEMO_CATEGORY_IMAGES[2]!,
    menu: [
      { name: "สลัดผักโรยงา", price: 65, description: "น้ำสลัดงาคั่ว", isFeatured: false, imageUrl: buildingPosCommonsDemoImage("Green Salad with Sesame Sauce.jpg") },
      { name: "ปอเปี๊ยะสด", price: 58, description: "กุ้งสดผักสดจิ้มซีฟู้ด", isFeatured: true, imageUrl: buildingPosCommonsDemoImage("Summer roll.jpg") },
      { name: "ลูกชิ้นปลาเสียบไม้", price: 45, description: "ทอดกรอบจิ้มซอสหวาน", isFeatured: false, imageUrl: buildingPosCommonsDemoImage("Curry Fishball in Taiwan (1).jpg") },
      { name: "เกี๊ยวทอด", price: 52, description: "ไส้กุ้งหมู", isFeatured: false, imageUrl: buildingPosCommonsDemoImage("Fried dumpling (3337901416).jpg") },
    ],
  },
  {
    name: "อาหารจานหลัก",
    sortOrder: 40,
    imageUrl: BUILDING_POS_DEMO_CATEGORY_IMAGES[3]!,
    menu: [
      { name: "ข้าวผัดกุ้ง", price: 89, description: "กุ้งแม่น้ำตัวโต", isFeatured: true, imageUrl: buildingPosCommonsDemoImage("Khao Phat Kung.jpg") },
      { name: "ข้าวต้มปลา", price: 85, description: "ปลากะพงสด", isFeatured: false, imageUrl: buildingPosCommonsDemoImage("Fish congee in home.jpg") },
      { name: "ข้าวหน้าหมูทงคatsu", price: 125, description: "หมูชุบเกล็ดขนมปังทอด", isFeatured: true, imageUrl: buildingPosCommonsDemoImage("Tonkatsu mashita spb.jpg") },
      { name: "สปาเกตตี้ขี้เมาทะเล", price: 145, description: "กุ้งปลาหมึกฉ่ำซอส", isFeatured: false, imageUrl: buildingPosCommonsDemoImage("Spaghetti ai frutti di mare.jpg") },
    ],
  },
  {
    name: "ของหวาน",
    sortOrder: 50,
    imageUrl: BUILDING_POS_DEMO_CATEGORY_IMAGES[4]!,
    menu: [
      {
        name: "บัวลอยน้ำขิง",
        price: 35,
        description: "ขิงหอมกลิ่นใบเตย",
        isFeatured: false,
        imageUrl: buildingPosCommonsDemoImage("Glutinous Rive Balls (Tang Yuan).jpg"),
      },
      {
        name: "ข้าวเหนียวมะม่วง",
        price: 85,
        description: "มะม่วงน้ำดอกไม้สุก",
        isFeatured: true,
        imageUrl: buildingPosCommonsDemoImage("Mango sticky rice served in Thailand.jpg"),
      },
      { name: "ลอดช่องน้ำกะทิ", price: 40, description: "หวานมันกะทิแท้", isFeatured: false, imageUrl: buildingPosCommonsDemoImage("Santan Cendol.jpg") },
      { name: "ไอศกรีมกะทิ", price: 45, description: "กะทิหอมหวานพอดี", isFeatured: false, imageUrl: buildingPosCommonsDemoImage("Coconut Ice Cream, Bangkok.jpg") },
    ],
  },
];

async function insertCatalog(
  db: DbLike,
  ownerUserId: string,
  trialSessionId: string,
  categoryNameSuffix: string,
): Promise<void> {
  const menuCount = BUILDING_POS_SEED_CATALOG.reduce((n, c) => n + c.menu.length, 0);
  if (menuCount !== BUILDING_POS_SEED_MENU_TOTAL) {
    throw new Error(
      `seed building-pos: คาด ${BUILDING_POS_SEED_MENU_TOTAL} เมนู (${BUILDING_POS_SEED_MENUS_PER_CATEGORY}/หมวด) แต่ได้ ${menuCount}`,
    );
  }
  const catSpecs = BUILDING_POS_SEED_CATALOG.map((c) => ({
    ...c,
    name: c.name + categoryNameSuffix,
  }));

  const categories = await Promise.all(
    catSpecs.map((c) =>
      db.buildingPosCategory.create({
        data: {
          ownerUserId,
          trialSessionId,
          name: c.name,
          sortOrder: c.sortOrder,
          isActive: true,
          imageUrl: c.imageUrl,
        },
      }),
    ),
  );

  const menuRows = categories.flatMap((cat, i) =>
    catSpecs[i]!.menu.map((m) => ({
      ownerUserId,
      trialSessionId,
      categoryId: cat.id,
      name: m.name,
      price: m.price,
      description: m.description,
      imageUrl: m.imageUrl,
      isActive: true,
      isFeatured: m.isFeatured,
    })),
  );

  await db.buildingPosMenuItem.createMany({ data: menuRows });
}

type OrderItemJson = { menu_item_id: number; name: string; price: number; qty: number; note: string };

function orderItem(menu: { id: number; name: string; price: number }, qty: number, note = ""): OrderItemJson {
  return { menu_item_id: menu.id, name: menu.name, price: menu.price, qty, note };
}

function totalAmount(items: OrderItemJson[]): number {
  return items.reduce((s, x) => s + x.price * x.qty, 0);
}

function atBangkokHour(dateKey: string, hour: number, minute: number): Date {
  const { start } = bangkokDayStartEndForDateKey(dateKey);
  return new Date(start.getTime() + (hour * 60 + minute) * 60 * 1000);
}

const DEMO_INGREDIENTS: { name: string; unitLabel: string; sortOrder: number }[] = [
  { name: "อกไก่สับ", unitLabel: "กก.", sortOrder: 10 },
  { name: "เนื้อวัว", unitLabel: "กก.", sortOrder: 20 },
  { name: "กะทิกล่อง", unitLabel: "ลิตร", sortOrder: 30 },
  { name: "ผักสด", unitLabel: "กก.", sortOrder: 40 },
  { name: "ข้าวสาร", unitLabel: "กก.", sortOrder: 50 },
  { name: "น้ำมันพืช", unitLabel: "ลิตร", sortOrder: 60 },
  { name: "ผงชาไทย", unitLabel: "กก.", sortOrder: 70 },
];

/**
 * ออเดอร์ตัวอย่าง (รายรับ), บันทึกซื้อของ (ต้นทุน), สูตร — ให้กราฟ/ภาพรวมมีข้อมูล
 * idempotent: ถ้ามีออเดอร์ใน scope นี้แล้วจะไม่แทรกซ้ำ
 */
export async function seedBuildingPosDemoFinanceData(
  db: DbLike,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  const existingOrders = await db.buildingPosOrder.count({ where: { ownerUserId, trialSessionId } });
  if (existingOrders > 0) return;

  const menus = await db.buildingPosMenuItem.findMany({
    where: { ownerUserId, trialSessionId },
    orderBy: { id: "asc" },
    select: { id: true, name: true, price: true },
  });
  if (menus.length === 0) return;

  const byName = (name: string) => menus.find((x) => x.name === name);

  let ingredients = await db.buildingPosIngredient.findMany({
    where: { ownerUserId, trialSessionId },
    orderBy: { sortOrder: "asc" },
  });

  if (ingredients.length === 0) {
    await db.buildingPosIngredient.createMany({
      data: DEMO_INGREDIENTS.map((r) => ({
        ownerUserId,
        trialSessionId,
        name: r.name,
        unitLabel: r.unitLabel,
        sortOrder: r.sortOrder,
      })),
    });
    ingredients = await db.buildingPosIngredient.findMany({
      where: { ownerUserId, trialSessionId },
      orderBy: { sortOrder: "asc" },
    });
  }

  const ingId = (name: string): number => {
    const row = ingredients.find((x) => x.name === name);
    if (!row) throw new Error(`seed building-pos: missing ingredient ${name}`);
    return row.id;
  };

  const poCount = await db.buildingPosPurchaseOrder.count({ where: { ownerUserId, trialSessionId } });
  if (poCount === 0) {
    const todayKey = bangkokDateKey(new Date());
    const keys = [todayKey, bangkokDateKeyMinusDays(todayKey, 3), bangkokDateKeyMinusDays(todayKey, 6)];

    const po1 = await db.buildingPosPurchaseOrder.create({
      data: {
        ownerUserId,
        trialSessionId,
        purchasedOn: new Date(`${keys[0]}T12:00:00+07:00`),
        note: "ตลาดเช้า — ของสดสัปดาห์",
        paymentSlipUrl: "",
      },
    });
    await db.buildingPosPurchaseLine.createMany({
      data: [
        { purchaseOrderId: po1.id, ingredientId: ingId("อกไก่สับ"), quantity: new Prisma.Decimal("5"), unitPriceBaht: new Prisma.Decimal("45") },
        { purchaseOrderId: po1.id, ingredientId: ingId("กะทิกล่อง"), quantity: new Prisma.Decimal("20"), unitPriceBaht: new Prisma.Decimal("35") },
        { purchaseOrderId: po1.id, ingredientId: ingId("ผักสด"), quantity: new Prisma.Decimal("4"), unitPriceBaht: new Prisma.Decimal("28") },
      ],
    });

    const po2 = await db.buildingPosPurchaseOrder.create({
      data: {
        ownerUserId,
        trialSessionId,
        purchasedOn: new Date(`${keys[1]}T12:00:00+07:00`),
        note: "ซื้อข้าวสาร · น้ำมัน",
        paymentSlipUrl: "",
      },
    });
    await db.buildingPosPurchaseLine.createMany({
      data: [
        { purchaseOrderId: po2.id, ingredientId: ingId("ข้าวสาร"), quantity: new Prisma.Decimal("25"), unitPriceBaht: new Prisma.Decimal("32") },
        { purchaseOrderId: po2.id, ingredientId: ingId("น้ำมันพืช"), quantity: new Prisma.Decimal("4"), unitPriceBaht: new Prisma.Decimal("95") },
        { purchaseOrderId: po2.id, ingredientId: ingId("เนื้อวัว"), quantity: new Prisma.Decimal("3"), unitPriceBaht: new Prisma.Decimal("285") },
      ],
    });

    const po3 = await db.buildingPosPurchaseOrder.create({
      data: {
        ownerUserId,
        trialSessionId,
        purchasedOn: new Date(`${keys[2]}T12:00:00+07:00`),
        note: "ของแห้ง · ชา",
        paymentSlipUrl: "",
      },
    });
    await db.buildingPosPurchaseLine.createMany({
      data: [
        { purchaseOrderId: po3.id, ingredientId: ingId("ผงชาไทย"), quantity: new Prisma.Decimal("1.2"), unitPriceBaht: new Prisma.Decimal("118") },
        { purchaseOrderId: po3.id, ingredientId: ingId("อกไก่สับ"), quantity: new Prisma.Decimal("8"), unitPriceBaht: new Prisma.Decimal("42") },
      ],
    });
  }

  const menuIds = menus.map((m) => m.id);
  const recipeExisting = await db.buildingPosMenuRecipeLine.count({
    where: { menuItemId: { in: menuIds } },
  });
  if (recipeExisting === 0) {
    const recipes: { menuName: string; lines: { ing: string; qty: string }[] }[] = [
      { menuName: "แกงเขียวหวานไก่", lines: [{ ing: "อกไก่สับ", qty: "0.22" }, { ing: "กะทิกล่อง", qty: "0.14" }, { ing: "ผักสด", qty: "0.06" }] },
      { menuName: "ผัดกะเพราไก่ไข่ดาว", lines: [{ ing: "อกไก่สับ", qty: "0.18" }, { ing: "ข้าวสาร", qty: "0.14" }, { ing: "น้ำมันพืช", qty: "0.02" }] },
      { menuName: "ต้มข่าไก่", lines: [{ ing: "อกไก่สับ", qty: "0.2" }, { ing: "กะทิกล่อง", qty: "0.2" }, { ing: "ผักสด", qty: "0.05" }] },
      { menuName: "ข้าวผัดกุ้ง", lines: [{ ing: "ข้าวสาร", qty: "0.16" }, { ing: "น้ำมันพืช", qty: "0.03" }, { ing: "ผักสด", qty: "0.05" }] },
      { menuName: "ชาเย็น", lines: [{ ing: "ผงชาไทย", qty: "0.015" }, { ing: "กะทิกล่อง", qty: "0.04" }] },
      { menuName: "แกงมัสมั่นเนื้อ", lines: [{ ing: "เนื้อวัว", qty: "0.2" }, { ing: "กะทิกล่อง", qty: "0.18" }, { ing: "ผักสด", qty: "0.04" }] },
    ];
    for (const r of recipes) {
      const mi = byName(r.menuName);
      if (!mi) continue;
      await db.buildingPosMenuRecipeLine.createMany({
        data: r.lines.map((ln) => ({
          menuItemId: mi.id,
          ingredientId: ingId(ln.ing),
          qtyPerPortion: new Prisma.Decimal(ln.qty),
        })),
      });
    }
  }

  const todayKey = bangkokDateKey(new Date());
  const d = (ago: number) => bangkokDateKeyMinusDays(todayKey, ago);

  const mk = (
    dateKey: string,
    hour: number,
    minute: number,
    status: "NEW" | "PREPARING" | "SERVED" | "PAID",
    customerName: string,
    tableNo: string,
    items: OrderItemJson[],
    note = "",
  ) => ({
    ownerUserId,
    trialSessionId,
    customerName,
    tableNo,
    status,
    itemsJson: items,
    totalAmount: totalAmount(items),
    note,
    paymentSlipUrl: "",
    customerSessionId: "",
    createdAt: atBangkokHour(dateKey, hour, minute),
  });

  const ordersData: ReturnType<typeof mk>[] = [];

  const g = (name: string) => byName(name);
  const safeItem = (name: string, qty: number) => {
    const mi = g(name);
    return mi ? orderItem(mi, qty) : null;
  };

  const pushOrder = (
    dateKey: string,
    hour: number,
    minute: number,
    status: "NEW" | "PREPARING" | "SERVED" | "PAID",
    customerName: string,
    tableNo: string,
    names: { n: string; q: number }[],
  ) => {
    const items = names.map(({ n, q }) => safeItem(n, q)).filter(Boolean) as OrderItemJson[];
    if (items.length === 0) return;
    ordersData.push(mk(dateKey, hour, minute, status, customerName, tableNo, items));
  };

  pushOrder(d(0), 11, 10, "PAID", "คุณแดง", "1", [
    { n: "แกงเขียวหวานไก่", q: 1 },
    { n: "ชาเย็น", q: 1 },
  ]);
  pushOrder(d(0), 12, 40, "PAID", "Walk-in", "2", [{ n: "ผัดกะเพราไก่ไข่ดาว", q: 2 }]);
  pushOrder(d(0), 13, 5, "PAID", "คุณโอ๋", "3", [
    { n: "ข้าวผัดกุ้ง", q: 1 },
    { n: "นมปั่นมะม่วง", q: 1 },
  ]);
  pushOrder(d(0), 18, 20, "SERVED", "โต๊ะ 4", "4", [{ n: "แกงมัสมั่นเนื้อ", q: 1 }, { n: "น้ำเปล่า", q: 2 }]);
  pushOrder(d(0), 19, 5, "NEW", "คิวครัว", "8", [{ n: "ผัดกะเพราไก่ไข่ดาว", q: 1 }, { n: "ชาเย็น", q: 1 }]);
  pushOrder(d(0), 19, 25, "PREPARING", "กำลังทำ", "9", [{ n: "ข้าวผัดกุ้ง", q: 2 }]);

  pushOrder(d(1), 10, 30, "PAID", "ครอบครัวส.", "5", [
    { n: "ต้มข่าไก่", q: 2 },
    { n: "ปอเปี๊ยะสด", q: 1 },
  ]);
  pushOrder(d(1), 12, 0, "PAID", "คุณมิ้น", "1", [{ n: "ข้าวหน้าหมูทงคatsu", q: 1 }, { n: "กาแฟเย็น", q: 1 }]);
  pushOrder(d(1), 19, 45, "PAID", "Grab", "—", [{ n: "สปาเกตตี้ขี้เมาทะเล", q: 1 }]);

  pushOrder(d(2), 11, 0, "PAID", "คุณบี", "2", [{ n: "ต้มข่าไก่", q: 1 }, { n: "ชาเย็น", q: 2 }]);
  pushOrder(d(2), 14, 15, "PAID", "ออฟฟิศข้างร้าน", "6", [
    { n: "ข้าวหน้าหมูทงคatsu", q: 2 },
    { n: "กาแฟเย็น", q: 2 },
  ]);
  pushOrder(d(2), 20, 10, "PREPARING", "คุณเจ", "3", [{ n: "สปาเกตตี้ขี้เมาทะเล", q: 1 }]);

  pushOrder(d(3), 9, 45, "PAID", "รอบเช้า", "1", [{ n: "ข้าวต้มปลา", q: 1 }, { n: "ชาเย็น", q: 1 }]);
  pushOrder(d(3), 12, 30, "PAID", "คุณแนน", "2", [{ n: "ข้าวต้มปลา", q: 1 }]);
  pushOrder(d(3), 17, 0, "PAID", "Walk-in", "5", [
    { n: "ข้าวผัดกุ้ง", q: 1 },
    { n: "ข้าวเหนียวมะม่วง", q: 2 },
  ]);

  pushOrder(d(4), 11, 20, "PAID", "คุณต้น", "4", [{ n: "สลัดผักโรยงา", q: 1 }, { n: "นมปั่นมะม่วง", q: 1 }]);
  pushOrder(d(4), 13, 50, "PAID", "โต๊ะ 7", "7", [{ n: "เกี๊ยวทอด", q: 2 }, { n: "ลูกชิ้นปลาเสียบไม้", q: 1 }]);

  pushOrder(d(5), 10, 10, "PAID", "คุณฟ้า", "1", [{ n: "แกงมัสมั่นเนื้อ", q: 1 }, { n: "น้ำเปล่า", q: 1 }]);
  pushOrder(d(5), 15, 40, "PAID", "รอบบ่าย", "3", [{ n: "ลูกชิ้นปลาเสียบไม้", q: 1 }, { n: "บัวลอยน้ำขิง", q: 2 }]);

  pushOrder(d(6), 12, 0, "PAID", "คุณปอย", "2", [{ n: "แกงเขียวหวานไก่", q: 2 }, { n: "ข้าวผัดกุ้ง", q: 1 }]);
  pushOrder(d(6), 18, 30, "PAID", "โต๊ะใหญ่", "8", [
    { n: "ผัดกะเพราไก่ไข่ดาว", q: 2 },
    { n: "ต้มข่าไก่", q: 1 },
    { n: "ชาเย็น", q: 3 },
  ]);
  pushOrder(d(6), 19, 50, "NEW", "จองล่วงหน้า", "VIP", [{ n: "ข้าวหน้าหมูทงคatsu", q: 2 }]);

  await db.buildingPosOrder.createMany({ data: ordersData });
}

/** แบนเนอร์พอร์ทัลจอง — Unsplash ร้านอาหาร (ยาว ≤ 512) */
const BUILDING_POS_PORTAL_SAMPLE_BANNER =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80";

const BUILDING_POS_PORTAL_SAMPLE_GALLERY = [
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=78",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=78",
  "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=800&q=78",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=78",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=78",
  "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=78",
] as const;

/**
 * โปรไฟล์ร้าน + แบรนด์ + จองโต๊ะ + รีวิว — ให้พอร์ทัล/แดชบอร์ดจองมีข้อมูลตัวอย่าง
 */
export async function seedBuildingPosPortalDemoData(
  db: DbLike,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  const isTrial = trialSessionId !== TRIAL_PROD_SCOPE;
  const shopSuffix = isTrial ? " (ทดลอง)" : "";

  await db.moduleShopBranding.upsert({
    where: {
      ownerUserId_trialSessionId_moduleSlug: {
        ownerUserId,
        trialSessionId,
        moduleSlug: BUILDING_POS_MODULE_SLUG,
      },
    },
    create: {
      ownerUserId,
      trialSessionId,
      moduleSlug: BUILDING_POS_MODULE_SLUG,
      displayName: `ครัวมาเวล Demo${shopSuffix}`,
      tagline: "อาหารไทย · ของหวาน · จองโต๊ะออนไลน์",
      contactPhone: "021234568",
      promptPayPhone: "0812345678",
      bankName: "กสิกรไทย",
      bankAccountNumber: "1234567890",
      bankAccountName: "ครัวมาเวล Demo",
      logoUrl:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=240&h=240&q=80",
    },
    update: {
      displayName: `ครัวมาเวล Demo${shopSuffix}`,
      tagline: "อาหารไทย · ของหวาน · จองโต๊ะออนไลน์",
      contactPhone: "021234568",
      promptPayPhone: "0812345678",
      bankName: "กสิกรไทย",
      bankAccountNumber: "1234567890",
      bankAccountName: "ครัวมาเวล Demo",
      logoUrl:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=240&h=240&q=80",
    },
  });

  await db.buildingPosShopProfile.upsert({
    where: {
      ownerUserId_trialSessionId: { ownerUserId, trialSessionId },
    },
    create: {
      ownerUserId,
      trialSessionId,
      address: "88/1 ถ.ตัวอย่าง แขวงสาธิต เขตสาธิต กรุงเทพฯ 10110",
      contactLine: "@mawell-kitchen",
      facebookUrl: "https://www.facebook.com/",
      mapUrl: "https://maps.google.com/?q=Bangkok",
      portalBannerUrl: BUILDING_POS_PORTAL_SAMPLE_BANNER,
      portalGalleryJson: JSON.stringify([...BUILDING_POS_PORTAL_SAMPLE_GALLERY]),
      openTime: "10:00",
      closeTime: "22:00",
      portalBookingPaymentMode: "DEPOSIT",
      depositAmountBaht: 200,
      depositPercent: 30,
    },
    update: {
      address: "88/1 ถ.ตัวอย่าง แขวงสาธิต เขตสาธิต กรุงเทพฯ 10110",
      contactLine: "@mawell-kitchen",
      facebookUrl: "https://www.facebook.com/",
      mapUrl: "https://maps.google.com/?q=Bangkok",
      portalBannerUrl: BUILDING_POS_PORTAL_SAMPLE_BANNER,
      portalGalleryJson: JSON.stringify([...BUILDING_POS_PORTAL_SAMPLE_GALLERY]),
      openTime: "10:00",
      closeTime: "22:00",
      portalBookingPaymentMode: "DEPOSIT",
      depositAmountBaht: 200,
      depositPercent: 30,
    },
  });

  const reviewCount = await db.buildingPosReview.count({ where: { ownerUserId, trialSessionId } });
  if (reviewCount === 0) {
    await db.buildingPosReview.createMany({
      data: [
        {
          ownerUserId,
          trialSessionId,
          guestName: "คุณมายด์",
          rating: 5,
          comment: "แกงเขียวหวานหอมมาก บริการดี จองโต๊ะสะดวก",
          photoUrlsJson: "[]",
          isPublished: true,
        },
        {
          ownerUserId,
          trialSessionId,
          guestName: "ครอบครัวใจดี",
          rating: 5,
          comment: "ข้าวเหนียวมะม่วงหวานกำลังดี โต๊ะสะอาด",
          photoUrlsJson: "[]",
          isPublished: true,
        },
        {
          ownerUserId,
          trialSessionId,
          guestName: "คุณต้น",
          rating: 4,
          comment: "ชาเย็นอร่อย ของว่างมาเร็ว รอของหวานนานนิดหน่อย",
          photoUrlsJson: "[]",
          isPublished: true,
        },
        {
          ownerUserId,
          trialSessionId,
          guestName: "Walk-in",
          rating: 5,
          comment: "บรรยากาศดี พนักงานยิ้มแย้ม จะกลับมาอีก",
          photoUrlsJson: "[]",
          isPublished: true,
        },
      ],
    });
  }

  const reservationCount = await db.buildingPosReservation.count({
    where: { ownerUserId, trialSessionId },
  });
  if (reservationCount > 0) return;

  const menus = await db.buildingPosMenuItem.findMany({
    where: { ownerUserId, trialSessionId, isActive: true },
    orderBy: { id: "asc" },
    select: { id: true, name: true, price: true },
  });
  const byName = (name: string) => menus.find((x) => x.name === name);
  const cartOf = (pairs: { n: string; q: number }[]) => {
    const items: { menuItemId: number; name: string; unitPrice: number; qty: number }[] = [];
    for (const p of pairs) {
      const m = byName(p.n);
      if (!m) continue;
      items.push({ menuItemId: m.id, name: m.name, unitPrice: m.price, qty: p.q });
    }
    return items;
  };
  const totalOf = (items: { unitPrice: number; qty: number }[]) =>
    items.reduce((s, x) => s + x.unitPrice * x.qty, 0);

  const todayKey = bangkokDateKey(new Date());
  const tomorrowKey = bangkokDateKeyMinusDays(todayKey, -1);

  const r1Items = cartOf([
    { n: "แกงเขียวหวานไก่", q: 2 },
    { n: "ชาเย็น", q: 2 },
  ]);
  const r1Total = totalOf(r1Items);
  const r2Items = cartOf([
    { n: "ผัดกะเพราไก่ไข่ดาว", q: 1 },
    { n: "ข้าวเหนียวมะม่วง", q: 1 },
  ]);
  const r2Total = totalOf(r2Items);
  const r3Items = cartOf([{ n: "ข้าวผัดกุ้ง", q: 2 }, { n: "น้ำเปล่า", q: 2 }]);
  const r3Total = totalOf(r3Items);

  await db.buildingPosReservation.createMany({
    data: [
      {
        ownerUserId,
        trialSessionId,
        customerName: "คุณนภา",
        phone: "0815551001",
        partySize: 4,
        tablePreference: "โซนหน้าต่าง",
        visitDateKey: todayKey,
        visitTimeHm: "18:30",
        itemsJson: r1Items,
        itemsTotalBaht: r1Total,
        paymentMode: "DEPOSIT",
        payDueBaht: 200,
        amountPaidBaht: 200,
        paymentMethod: "PROMPTPAY",
        paymentSlipUrl: "",
        status: "SCHEDULED",
        note: "มีเด็กเล็ก 1 คน",
      },
      {
        ownerUserId,
        trialSessionId,
        customerName: "คุณวิชัย",
        phone: "0892223344",
        partySize: 2,
        tablePreference: "",
        visitDateKey: todayKey,
        visitTimeHm: "12:00",
        itemsJson: r2Items,
        itemsTotalBaht: r2Total,
        paymentMode: "DEPOSIT",
        payDueBaht: 200,
        amountPaidBaht: 0,
        paymentMethod: "",
        paymentSlipUrl: "",
        status: "ARRIVED",
        note: "",
      },
      {
        ownerUserId,
        trialSessionId,
        customerName: "บริษัท เอ จำกัด",
        phone: "0629988776",
        partySize: 6,
        tablePreference: "โต๊ะใหญ่",
        visitDateKey: tomorrowKey,
        visitTimeHm: "19:00",
        itemsJson: r3Items,
        itemsTotalBaht: r3Total,
        paymentMode: "DEPOSIT",
        payDueBaht: Math.max(200, Math.ceil((r3Total * 30) / 100)),
        amountPaidBaht: Math.max(200, Math.ceil((r3Total * 30) / 100)),
        paymentMethod: "TRANSFER",
        paymentSlipUrl: "",
        status: "SCHEDULED",
        note: "ประชุมทีม — ขอใบเสร็จบริษัท",
      },
      {
        ownerUserId,
        trialSessionId,
        customerName: "คุณฝ้าย",
        phone: "0951112233",
        partySize: 3,
        tablePreference: "",
        visitDateKey: bangkokDateKeyMinusDays(todayKey, 1),
        visitTimeHm: "20:00",
        itemsJson: [],
        itemsTotalBaht: 0,
        paymentMode: "NONE",
        payDueBaht: 0,
        amountPaidBaht: 0,
        paymentMethod: "",
        paymentSlipUrl: "",
        status: "COMPLETED",
        note: "มาร่วมงานวันเกิด",
      },
    ],
  });
}

/**
 * เติม/รีเซ็ตข้อมูลตัวอย่างสำหรับแดชบอร์ด (เมนูถ้ายังไม่มี + ออเดอร์/ต้นทุน)
 * `force` = ล้างออเดอร์+รายจ่ายใน scope แล้วใส่ตัวอย่างใหม่ (คงหมวด/เมนูถ้ามีแล้ว)
 */
export async function ensureBuildingPosDemoDataForOwner(
  db: DbLike,
  ownerUserId: string,
  trialSessionId: string,
  opts?: { force?: boolean },
): Promise<{ catalogSeeded: boolean; financeSeeded: boolean }> {
  const force = opts?.force === true;
  let catalogSeeded = false;
  const catCount = await db.buildingPosCategory.count({ where: { ownerUserId, trialSessionId } });
  if (catCount === 0) {
    const suffix = trialSessionId === TRIAL_PROD_SCOPE ? "" : " (ทดลอง)";
    await insertCatalog(db, ownerUserId, trialSessionId, suffix);
    catalogSeeded = true;
  }

  const orderCount = await db.buildingPosOrder.count({ where: { ownerUserId, trialSessionId } });
  if (orderCount > 0 && !force) {
    await seedBuildingPosPortalDemoData(db, ownerUserId, trialSessionId);
    return { catalogSeeded, financeSeeded: false };
  }

  if (force && orderCount > 0) {
    await db.buildingPosOrder.deleteMany({ where: { ownerUserId, trialSessionId } });
    await db.buildingPosMenuRecipeLine.deleteMany({
      where: { menuItem: { ownerUserId, trialSessionId } },
    });
    await db.buildingPosPurchaseOrder.deleteMany({ where: { ownerUserId, trialSessionId } });
  }

  await seedBuildingPosDemoFinanceData(db, ownerUserId, trialSessionId);
  await seedBuildingPosPortalDemoData(db, ownerUserId, trialSessionId);
  return { catalogSeeded, financeSeeded: true };
}

/** ลบข้อมูล Building POS ทั้งหมดใน scope หนึ่ง (ลำดับ FK / ตารางที่อ้างอิง) */
export async function deleteBuildingPosScopeData(
  db: DbLike,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  await db.buildingPosLoyaltyLedger.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.buildingPosLoyaltyReward.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.buildingPosLoyaltyMember.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.buildingPosLoyaltySettings.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.buildingPosReservation.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.buildingPosReview.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.buildingPosCostEntry.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.buildingPosCostCategory.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.buildingPosOrder.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.buildingPosMenuRecipeLine.deleteMany({
    where: { menuItem: { ownerUserId, trialSessionId } },
  });
  await db.buildingPosPurchaseOrder.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.buildingPosMenuItem.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.buildingPosCategory.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.buildingPosKitchenDepartment.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.buildingPosIngredient.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.buildingPosStaffLink.deleteMany({ where: { ownerUserId, trialSessionId } });
  await db.buildingPosShopProfile.deleteMany({ where: { ownerUserId, trialSessionId } });
}

/** เมนู + หมวดตัวอย่างสำหรับผู้ใช้ทดลอง POS */
export async function seedBuildingPosTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  await insertCatalog(tx, ownerUserId, trialSessionId, " (ทดลอง)");
  await seedBuildingPosDemoFinanceData(tx, ownerUserId, trialSessionId);
  await seedBuildingPosPortalDemoData(tx, ownerUserId, trialSessionId);
}

/**
 * ข้อมูลตัวอย่างโหมดใช้งานจริง (`trial_session_id` = prod) สำหรับบัญชี demo เท่านั้น (เรียกจาก prisma/seed.ts)
 * ทุกครั้งที่รัน seed: **ล้าง** POS scope prod ของ user นี้แล้วสร้างเมนู 20 รายการ + ออเดอร์/ต้นทุน + พอร์ทัลตัวอย่างใหม่
 */
export async function seedBuildingPosProdDemoForOwner(db: DbLike, ownerUserId: string): Promise<void> {
  await deleteBuildingPosScopeData(db, ownerUserId, TRIAL_PROD_SCOPE);
  await insertCatalog(db, ownerUserId, TRIAL_PROD_SCOPE, "");
  await seedBuildingPosDemoFinanceData(db, ownerUserId, TRIAL_PROD_SCOPE);
  await seedBuildingPosPortalDemoData(db, ownerUserId, TRIAL_PROD_SCOPE);
}
