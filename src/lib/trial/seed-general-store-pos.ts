import type { PrismaClient } from "@/generated/prisma/client";

/** รูปตัวอย่างแบบถ่ายจริง (สุ่มจาก seed คงที่ต่อ index — โหลดจาก picsum) */
function productPhotoUrl(index: number): string {
  const id = 100 + (index % 80);
  return `https://picsum.photos/id/${id}/800/600`;
}

function categoryCoverUrl(index: number): string {
  const id = 30 + (index % 40);
  return `https://picsum.photos/id/${id}/640/400`;
}

const CATEGORY_DEFS = [
  { name: "เครื่องดื่ม", sortOrder: 0 },
  { name: "ขนมและของว่าง", sortOrder: 1 },
  { name: "ของใช้ทั่วไป", sortOrder: 2 },
  { name: "อาหารทานเล่น", sortOrder: 3 },
] as const;

/** สินค้า 20 รายการ — ชื่อไทย ราคาเป็นบาทเต็ม */
const PRODUCT_DEFS: ReadonlyArray<{
  cat: 0 | 1 | 2 | 3;
  name: string;
  priceBaht: number;
  isFeatured: boolean;
  sortOrder: number;
}> = [
  { cat: 0, name: "น้ำดื่ม 600 ml", priceBaht: 10, isFeatured: true, sortOrder: 0 },
  { cat: 0, name: "ชาเขียวขวด", priceBaht: 15, isFeatured: true, sortOrder: 1 },
  { cat: 0, name: "กาแฟกระป๋อง", priceBaht: 22, isFeatured: false, sortOrder: 2 },
  { cat: 0, name: "น้ำอัดลม 325 ml", priceBaht: 18, isFeatured: false, sortOrder: 3 },
  { cat: 0, name: "นมกล่อง UHT", priceBaht: 12, isFeatured: false, sortOrder: 4 },
  { cat: 1, name: "ขนมปังช็อกโกแลต", priceBaht: 25, isFeatured: true, sortOrder: 0 },
  { cat: 1, name: "มาม่าห่อเล็ก", priceBaht: 7, isFeatured: false, sortOrder: 1 },
  { cat: 1, name: "ลูกอมถุง", priceBaht: 10, isFeatured: false, sortOrder: 2 },
  { cat: 1, name: "คุกกี้แพ็ก", priceBaht: 20, isFeatured: false, sortOrder: 3 },
  { cat: 1, name: "เยลลี่ถ้วย", priceBaht: 15, isFeatured: false, sortOrder: 4 },
  { cat: 2, name: "ถุงหูหิ้วใหญ่", priceBaht: 5, isFeatured: false, sortOrder: 0 },
  { cat: 2, name: "ทิชชู่ม้วน", priceBaht: 35, isFeatured: true, sortOrder: 1 },
  { cat: 2, name: "แบตเตอรี่ AAA แพ็ก", priceBaht: 55, isFeatured: false, sortOrder: 2 },
  { cat: 2, name: "สมุดโน้ต A5", priceBaht: 28, isFeatured: false, sortOrder: 3 },
  { cat: 2, name: "ปากกาลูกลื่น 3 ด้าม", priceBaht: 30, isFeatured: false, sortOrder: 4 },
  { cat: 3, name: "ไส้กรอกอบ", priceBaht: 45, isFeatured: true, sortOrder: 0 },
  { cat: 3, name: "ขนมปังไส้ครีม", priceBaht: 18, isFeatured: false, sortOrder: 1 },
  { cat: 3, name: "ซาลาเปาไส้หมู", priceBaht: 12, isFeatured: false, sortOrder: 2 },
  { cat: 3, name: "แซนวิสโบโลน่า", priceBaht: 25, isFeatured: false, sortOrder: 3 },
  { cat: 3, name: "ข้าวผัดกล่องเล็ก", priceBaht: 55, isFeatured: true, sortOrder: 4 },
];

/** บิลตัวอย่าง: [วันย้อนหลังจากวันนี้, ดัชนีสินค้า (0–19), จำนวน][] */
const SALE_BLUEPRINTS: ReadonlyArray<{
  daysAgo: number;
  note: string | null;
  lines: ReadonlyArray<{ productIndex: number; qty: number }>;
}> = [
  { daysAgo: 0, note: "ลูกค้าหน้าร้าน", lines: [{ productIndex: 0, qty: 3 }, { productIndex: 5, qty: 2 }] },
  { daysAgo: 0, note: null, lines: [{ productIndex: 15, qty: 1 }, { productIndex: 16, qty: 2 }] },
  { daysAgo: 1, note: "ส่ง Grab", lines: [{ productIndex: 2, qty: 4 }, { productIndex: 3, qty: 4 }, { productIndex: 10, qty: 1 }] },
  { daysAgo: 1, note: null, lines: [{ productIndex: 11, qty: 6 }] },
  { daysAgo: 2, note: null, lines: [{ productIndex: 6, qty: 2 }, { productIndex: 7, qty: 3 }, { productIndex: 8, qty: 1 }] },
  { daysAgo: 3, note: "โทรสั่ง", lines: [{ productIndex: 12, qty: 1 }, { productIndex: 13, qty: 2 }] },
  { daysAgo: 4, note: null, lines: [{ productIndex: 1, qty: 5 }, { productIndex: 4, qty: 5 }] },
  { daysAgo: 5, note: null, lines: [{ productIndex: 19, qty: 2 }, { productIndex: 18, qty: 1 }] },
  { daysAgo: 6, note: "รอบเช้า", lines: [{ productIndex: 5, qty: 4 }, { productIndex: 9, qty: 4 }] },
  { daysAgo: 7, note: null, lines: [{ productIndex: 14, qty: 2 }, { productIndex: 13, qty: 1 }, { productIndex: 12, qty: 1 }] },
  { daysAgo: 9, note: null, lines: [{ productIndex: 17, qty: 3 }, { productIndex: 16, qty: 3 }] },
  { daysAgo: 11, note: "กลุ่มออฟฟิศ", lines: [{ productIndex: 0, qty: 12 }] },
  { daysAgo: 13, note: null, lines: [{ productIndex: 3, qty: 2 }, { productIndex: 2, qty: 2 }, { productIndex: 1, qty: 2 }] },
];

/**
 * ข้อมูลตัวอย่าง POS ร้านทั่วไป — เฉพาะบัญชี demo (prod scope)
 * ล้างของเดิมของ owner แล้วใส่ใหม่: หมวด 4 · สินค้า 20 (มีรูป) · บิลตัวอย่างหลายใบ
 */
export async function seedGeneralStorePosProdDemoForOwner(prisma: PrismaClient, ownerUserId: string) {
  await prisma.generalStorePosSaleLine.deleteMany({
    where: { sale: { ownerUserId } },
  });
  await prisma.generalStorePosSale.deleteMany({ where: { ownerUserId } });
  await prisma.generalStorePosProduct.deleteMany({ where: { ownerUserId } });
  await prisma.generalStorePosCategory.deleteMany({ where: { ownerUserId } });

  const categories = await Promise.all(
    CATEGORY_DEFS.map((c, i) =>
      prisma.generalStorePosCategory.create({
        data: {
          ownerUserId,
          name: c.name,
          sortOrder: c.sortOrder,
          imageUrl: categoryCoverUrl(i),
        },
      }),
    ),
  );

  const catIds = categories.map((c) => c.id);

  /** สร้างทีละรายการเพื่อให้ลำดับ index 0–19 ตรงกับ PRODUCT_DEFS (ใช้ผูกบิลตัวอย่าง) */
  const productsOrdered: { id: string; name: string; priceBaht: number }[] = [];
  for (let i = 0; i < PRODUCT_DEFS.length; i++) {
    const p = PRODUCT_DEFS[i]!;
    const row = await prisma.generalStorePosProduct.create({
      data: {
        ownerUserId,
        categoryId: catIds[p.cat]!,
        name: p.name,
        priceBaht: p.priceBaht,
        imageUrl: productPhotoUrl(i),
        isFeatured: p.isFeatured,
        isActive: true,
        sortOrder: p.sortOrder,
      },
      select: { id: true, name: true, priceBaht: true },
    });
    productsOrdered.push(row);
  }

  const now = Date.now();

  for (const bill of SALE_BLUEPRINTS) {
    const lines = bill.lines.map(({ productIndex, qty }) => {
      const p = productsOrdered[productIndex];
      if (!p) throw new Error(`seed general-store-pos: missing product index ${productIndex}`);
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
    createdAt.setHours(10, 30, 0, 0);

    await prisma.generalStorePosSale.create({
      data: {
        ownerUserId,
        note: bill.note,
        totalBaht,
        createdAt,
        lines: { create: lines },
      },
    });
  }
}
