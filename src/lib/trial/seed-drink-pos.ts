import type { PrismaClient } from "@/generated/prisma/client";
import {
  DRINK_POS_CATEGORY_IMAGES,
  DRINK_POS_PRODUCT_IMAGES,
} from "@/lib/drink-pos/drink-stock-images";

const CATEGORY_DEFS = [
  { name: "กาแฟ", sortOrder: 0 },
  { name: "ชา & นม", sortOrder: 1 },
  { name: "ท็อปปิ้ง", sortOrder: 2 },
] as const;

const PRODUCT_DEFS: ReadonlyArray<{
  cat: 0 | 1 | 2;
  name: string;
  priceBaht: number;
  isFeatured: boolean;
  sortOrder: number;
}> = [
  { cat: 0, name: "ลาเต้เย็น", priceBaht: 55, isFeatured: true, sortOrder: 0 },
  { cat: 0, name: "อเมริกาโน่", priceBaht: 45, isFeatured: true, sortOrder: 1 },
  { cat: 0, name: "คาปูชิโน่", priceBaht: 50, isFeatured: false, sortOrder: 2 },
  { cat: 0, name: "มอคค่า", priceBaht: 60, isFeatured: false, sortOrder: 3 },
  { cat: 1, name: "ชาเขียวนม", priceBaht: 40, isFeatured: true, sortOrder: 0 },
  { cat: 1, name: "ชาไทย", priceBaht: 35, isFeatured: true, sortOrder: 1 },
  { cat: 1, name: "โกโก้", priceBaht: 38, isFeatured: false, sortOrder: 2 },
  { cat: 1, name: "นมสด", priceBaht: 30, isFeatured: false, sortOrder: 3 },
  { cat: 2, name: "ไข่มุก", priceBaht: 15, isFeatured: false, sortOrder: 0 },
  { cat: 2, name: "วิปครีม", priceBaht: 10, isFeatured: false, sortOrder: 1 },
  { cat: 2, name: "ช็อตเอสเปรสโซ่", priceBaht: 15, isFeatured: false, sortOrder: 2 },
];

const SALE_BLUEPRINTS: ReadonlyArray<{
  daysAgo: number;
  note: string | null;
  memberPhone?: string;
  lines: ReadonlyArray<{ productIndex: number; qty: number }>;
}> = [
  { daysAgo: 0, note: "หน้าร้าน", memberPhone: "0812345678", lines: [{ productIndex: 0, qty: 2 }] },
  { daysAgo: 0, note: null, lines: [{ productIndex: 4, qty: 3 }, { productIndex: 8, qty: 3 }] },
  { daysAgo: 1, note: "Grab", lines: [{ productIndex: 1, qty: 4 }] },
  { daysAgo: 2, note: null, lines: [{ productIndex: 5, qty: 2 }, { productIndex: 9, qty: 2 }] },
  { daysAgo: 3, note: null, lines: [{ productIndex: 2, qty: 3 }] },
  { daysAgo: 4, note: "สมาชิก", memberPhone: "0898765432", lines: [{ productIndex: 0, qty: 1 }] },
  { daysAgo: 5, note: null, lines: [{ productIndex: 6, qty: 5 }] },
  { daysAgo: 6, note: "เช้า", lines: [{ productIndex: 3, qty: 2 }, { productIndex: 7, qty: 2 }] },
];

const COST_BLUEPRINTS = [
  { daysAgo: 1, label: "วัตถุดิบกาแฟ", amountBaht: 1200 },
  { daysAgo: 3, label: "นม & ชา", amountBaht: 850 },
  { daysAgo: 5, label: "ค่าเช่าพื้นที่ (รายสัปดาห์)", amountBaht: 3500 },
];

export async function seedDrinkPosProdDemoForOwner(prisma: PrismaClient, ownerUserId: string) {
  const trialSessionId = "prod";

  await prisma.drinkPosSaleLine.deleteMany({ where: { sale: { ownerUserId } } });
  await prisma.drinkPosSale.deleteMany({ where: { ownerUserId } });
  await prisma.drinkPosCostEntry.deleteMany({ where: { ownerUserId } });
  await prisma.drinkPosMember.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.drinkPosProduct.deleteMany({ where: { ownerUserId } });
  await prisma.drinkPosCategory.deleteMany({ where: { ownerUserId } });
  await prisma.drinkPosShopProfile.deleteMany({ where: { ownerUserId, trialSessionId } });

  await prisma.drinkPosShopProfile.create({
    data: {
      ownerUserId,
      trialSessionId,
      stampsPerReward: 10,
      rewardTitle: "เครื่องดื่มฟรี 1 แก้ว",
    },
  });

  const categories = await Promise.all(
    CATEGORY_DEFS.map((c, i) =>
      prisma.drinkPosCategory.create({
        data: {
          ownerUserId,
          name: c.name,
          sortOrder: c.sortOrder,
          imageUrl: DRINK_POS_CATEGORY_IMAGES[i] ?? DRINK_POS_CATEGORY_IMAGES[0],
        },
      }),
    ),
  );
  const catIds = categories.map((c) => c.id);

  const productsOrdered: { id: string; name: string; priceBaht: number }[] = [];
  for (let i = 0; i < PRODUCT_DEFS.length; i++) {
    const p = PRODUCT_DEFS[i]!;
    const row = await prisma.drinkPosProduct.create({
      data: {
        ownerUserId,
        categoryId: catIds[p.cat]!,
        name: p.name,
        priceBaht: p.priceBaht,
        imageUrl: DRINK_POS_PRODUCT_IMAGES[i] ?? DRINK_POS_PRODUCT_IMAGES[0],
        isFeatured: p.isFeatured,
        isActive: true,
        sortOrder: p.sortOrder,
      },
      select: { id: true, name: true, priceBaht: true },
    });
    productsOrdered.push(row);
  }

  const memberA = await prisma.drinkPosMember.create({
    data: {
      ownerUserId,
      trialSessionId,
      phone: "0812345678",
      customerName: "คุณมิ้น",
      currentStamps: 7,
    },
  });
  const memberB = await prisma.drinkPosMember.create({
    data: {
      ownerUserId,
      trialSessionId,
      phone: "0898765432",
      customerName: "คุณบี",
      currentStamps: 9,
    },
  });

  const now = Date.now();
  const phoneToMember = new Map<string, string>([
    ["0812345678", memberA.id],
    ["0898765432", memberB.id],
  ]);

  for (const bill of SALE_BLUEPRINTS) {
    const lines = bill.lines.map(({ productIndex, qty }) => {
      const p = productsOrdered[productIndex];
      if (!p) throw new Error(`seed drink-pos: missing product index ${productIndex}`);
      return {
        productId: p.id,
        productName: p.name,
        unitPriceBaht: p.priceBaht,
        quantity: qty,
        lineTotalBaht: p.priceBaht * qty,
      };
    });
    const totalBaht = lines.reduce((s, l) => s + l.lineTotalBaht, 0);
    const createdAt = new Date(now - bill.daysAgo * 86400000);
    createdAt.setHours(11, 0, 0, 0);
    const memberId = bill.memberPhone ? phoneToMember.get(bill.memberPhone) ?? null : null;

    await prisma.drinkPosSale.create({
      data: {
        ownerUserId,
        memberId,
        memberPhone: bill.memberPhone ?? null,
        note: bill.note,
        totalBaht,
        createdAt,
        lines: { create: lines },
      },
    });
  }

  for (const c of COST_BLUEPRINTS) {
    const spentAt = new Date(now - c.daysAgo * 86400000);
    spentAt.setHours(9, 0, 0, 0);
    await prisma.drinkPosCostEntry.create({
      data: {
        ownerUserId,
        label: c.label,
        amountBaht: c.amountBaht,
        spentAt,
      },
    });
  }
}
