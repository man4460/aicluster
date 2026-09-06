/**
 * ใส่สินค้าตัวอย่างให้ร้านหน้าร้านเห็นภาพการ์ด + รายละเอียด + รูปหลายมุม
 * npx tsx scripts/fill-ecommerce-storefront-demo.ts
 */
import { Prisma } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";
import { serializeEcommerceGalleryImages } from "../src/lib/ecommerce/product-images";

const STORE_ID = "cmto584800051jm1krbsypn2k";

const U = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

type DemoProduct = {
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  category: string;
  coverId: string;
  galleryIds: string[];
  recommended?: boolean;
  bestseller?: boolean;
};

const CATEGORIES = ["สกินแคร์", "เมคอัพ", "Gadget", "แฟชั่น"] as const;

/** รูปมุมเพิ่ม — ใช้เฉพาะ Unsplash ID ที่ HEAD ได้ 200 (กันเลื่อนแล้วไม่มีรูป) */
const G = {
  skincare: [
    "photo-1608571423902-eed4a5ad8108",
    "photo-1556228578-0d85b1a4d571",
    "photo-1598440947619-2c35fc9aa908",
    "photo-1612817288484-6f916006741a",
    "photo-1556228720-195a672e8a03",
  ],
  makeup: [
    "photo-1596462502278-27bfdc403348",
    "photo-1512496015851-a90fb38ba796",
    "photo-1616683693504-3ea7e9ad6fec",
    "photo-1586495777744-4413f21062fa",
    "photo-1631214524020-7e18db9a8f92",
    "photo-1522335789203-aabd1fc54bc9",
  ],
  gadget: [
    "photo-1546868871-7041f2a55e12",
    "photo-1523275335684-37898b6baf30",
    "photo-1505740420928-5e560c06d30e",
    "photo-1511707171634-5f897ff02aa9",
    "photo-1580910051074-3eb694886505",
    "photo-1484704849700-f032a568e944",
  ],
  fashion: [
    "photo-1553062407-98eeb64c6a62",
    "photo-1572635196237-14b3f281503f",
    "photo-1588850561407-ed78c282e89b",
    "photo-1618354691373-d851c5c3a990",
    "photo-1560343090-f0409e92791a",
    "photo-1549298916-b41d501d3772",
    "photo-1542291026-7eec264c27ff",
  ],
} as const;

function galleryWithoutCover(coverId: string, pool: readonly string[], take = 5): string[] {
  return pool.filter((id) => id !== coverId).slice(0, take);
}

const PRODUCTS: DemoProduct[] = [
  {
    name: "เซรั่มวิตามินซี 30ml",
    description: "ผิวกระจ่างใส สกัดวิตามินซีเข้มข้น เหมาะผิวหมองคล้ำ ใช้เช้า-เย็นหลังโทนเนอร์",
    price: 299,
    stock: 42,
    sku: "DEMO-SERUM-01",
    category: "สกินแคร์",
    coverId: "photo-1556228720-195a672e8a03",
    galleryIds: galleryWithoutCover("photo-1556228720-195a672e8a03", G.skincare),
    recommended: true,
    bestseller: true,
  },
  {
    name: "ครีมกันแดด SPF50 PA+++",
    description: "เนื้อบางเบา ไม่เหนียวเหนอะ กันน้ำกันเหงื่อ ทาทับเมคอัพได้",
    price: 189,
    stock: 68,
    sku: "DEMO-SUN-02",
    category: "สกินแคร์",
    coverId: "photo-1612817288484-6f916006741a",
    galleryIds: galleryWithoutCover("photo-1612817288484-6f916006741a", G.skincare),
    recommended: true,
  },
  {
    name: "โฟมล้างหน้าชาเขียว",
    description: "ทำความสะอาดล้ำลึก ลดสิวอุดตัน กลิ่นชาเขียวสดชื่น",
    price: 129,
    stock: 55,
    sku: "DEMO-FOAM-03",
    category: "สกินแคร์",
    coverId: "photo-1556228578-0d85b1a4d571",
    galleryIds: galleryWithoutCover("photo-1556228578-0d85b1a4d571", G.skincare),
  },
  {
    name: "มาส์กหน้าคอลลาเจน (แพ็ก 5)",
    description: "แผ่นมาส์กชุ่มชื้น คอลลาเจนเข้มข้น ใช้ 15–20 นาที",
    price: 249,
    stock: 18,
    sku: "DEMO-MASK-04",
    category: "สกินแคร์",
    coverId: "photo-1598440947619-2c35fc9aa908",
    galleryIds: galleryWithoutCover("photo-1598440947619-2c35fc9aa908", G.skincare),
    bestseller: true,
  },
  {
    name: "ลิปสติกโทนนู้ด",
    description: "สีติดทน เนื้อแมทท์ไม่แห้ง โทนนู้ดใช้ทุกวัน",
    price: 159,
    stock: 28,
    sku: "DEMO-LIP-01",
    category: "เมคอัพ",
    coverId: "photo-1586495777744-4413f21062fa",
    galleryIds: galleryWithoutCover("photo-1586495777744-4413f21062fa", G.makeup),
    recommended: true,
  },
  {
    name: "คุชชั่น SPF40",
    description: "ปกปิดบางเบา คุมมัน รีฟิลได้ โทนผิวไทย",
    price: 390,
    stock: 22,
    sku: "DEMO-CUSH-02",
    category: "เมคอัพ",
    coverId: "photo-1631214524020-7e18db9a8f92",
    galleryIds: galleryWithoutCover("photo-1631214524020-7e18db9a8f92", G.makeup),
    bestseller: true,
  },
  {
    name: "หูฟังบลูทูธ (ขาว)",
    description: "ตัดเสียงรบกวน แบต 28 ชม. เคสชาร์จเร็ว USB-C",
    price: 890,
    stock: 14,
    sku: "DEMO-EAR-01",
    category: "Gadget",
    coverId: "photo-1505740420928-5e560c06d30e",
    galleryIds: galleryWithoutCover("photo-1505740420928-5e560c06d30e", G.gadget),
    recommended: true,
    bestseller: true,
  },
  {
    name: "สายชาร์จ PD 1.5m",
    description: "รองรับชาร์จเร็ว 65W USB-C to USB-C สายถักทนทาน",
    price: 129,
    stock: 85,
    sku: "DEMO-CABLE-02",
    category: "Gadget",
    coverId: "photo-1580910051074-3eb694886505",
    galleryIds: galleryWithoutCover("photo-1580910051074-3eb694886505", G.gadget),
  },
  {
    name: "เคสโทรศัพท์ใสกันกระแทก",
    description: "รองรับ MagSafe ขอบนุ่ม กันกระแทก ไม่เหลืองง่าย",
    price: 199,
    stock: 60,
    sku: "DEMO-CASE-03",
    category: "Gadget",
    coverId: "photo-1511707171634-5f897ff02aa9",
    galleryIds: galleryWithoutCover("photo-1511707171634-5f897ff02aa9", G.gadget),
  },
  {
    name: "กระเป๋าสะพายมินิ",
    description: "หนังเทียม ซิปคู่ จุของจำเป็น สายปรับได้",
    price: 490,
    stock: 21,
    sku: "DEMO-BAG-01",
    category: "แฟชั่น",
    coverId: "photo-1560343090-f0409e92791a",
    galleryIds: galleryWithoutCover("photo-1560343090-f0409e92791a", G.fashion),
    bestseller: true,
  },
  {
    name: "เสื้อยืดคอกลม (ขาว)",
    description: "ผ้าคอตตอน 100% นุ่ม ไซส์ S–XL ใส่สบายทุกวัน",
    price: 259,
    stock: 48,
    sku: "DEMO-TEE-02",
    category: "แฟชั่น",
    coverId: "photo-1618354691373-d851c5c3a990",
    galleryIds: galleryWithoutCover("photo-1618354691373-d851c5c3a990", G.fashion),
    recommended: true,
  },
  {
    name: "รองเท้าผ้าใบยูนีเซ็กซ์",
    description: "พื้นนุ่ม ใส่เที่ยว/ทำงาน น้ำหนักเบา สีครีม",
    price: 990,
    stock: 16,
    sku: "DEMO-SHOE-03",
    category: "แฟชั่น",
    coverId: "photo-1542291026-7eec264c27ff",
    galleryIds: galleryWithoutCover("photo-1542291026-7eec264c27ff", G.fashion),
  },
];

async function main() {
  const store = await prisma.ecommerceStore.findUnique({
    where: { id: STORE_ID },
    select: { id: true, ownerUserId: true, storeName: true },
  });
  if (!store) {
    throw new Error(`ไม่พบร้าน ${STORE_ID}`);
  }

  await prisma.ecommerceStore.update({
    where: { id: store.id },
    data: {
      tagline: "สวยครบ จบในคลิก — สกินแคร์ · เมคอัพ · Gadget",
      description:
        "ร้านตัวอย่าง — สินค้ามีรายละเอียดบนการ์ด คลิกดูรูปหลายมุม และใส่ตะกร้าได้",
    },
  });

  const categoryIds = new Map<string, string>();
  for (let i = 0; i < CATEGORIES.length; i++) {
    const name = CATEGORIES[i]!;
    const existing = await prisma.ecommerceCategory.findFirst({
      where: { storeId: store.id, name },
      select: { id: true },
    });
    if (existing) {
      categoryIds.set(name, existing.id);
      continue;
    }
    const cat = await prisma.ecommerceCategory.create({
      data: {
        storeId: store.id,
        ownerUserId: store.ownerUserId,
        name,
        sortOrder: i,
        isActive: true,
      },
    });
    categoryIds.set(name, cat.id);
  }

  let created = 0;
  let updated = 0;
  let deactivatedDupes = 0;

  // ปิด DEMO ที่ซ้ำชื่อกับสินค้าเดิม (กันรายการซ้ำบนหน้าร้าน)
  const demoRows = await prisma.ecommerceProduct.findMany({
    where: { storeId: store.id, sku: { startsWith: "DEMO-" }, isActive: true },
    select: { id: true, name: true },
  });
  for (const demo of demoRows) {
    const original = await prisma.ecommerceProduct.findFirst({
      where: {
        storeId: store.id,
        isActive: true,
        id: { not: demo.id },
        NOT: { sku: { startsWith: "DEMO-" } },
        name: demo.name,
      },
      select: { id: true },
    });
    if (!original) continue;
    await prisma.ecommerceProduct.update({
      where: { id: demo.id },
      data: { isActive: false },
    });
    deactivatedDupes += 1;
  }

  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i]!;
    const cover = U(p.coverId);
    const galleryImagesJson = serializeEcommerceGalleryImages(p.galleryIds.map((id) => U(id)));
    const data = {
      name: p.name,
      description: p.description,
      priceBaht: new Prisma.Decimal(p.price),
      stockBalance: p.stock,
      imageUrl: cover,
      galleryImagesJson,
      isActive: true,
      isRecommended: Boolean(p.recommended),
      isBestseller: Boolean(p.bestseller),
      sortOrder: i,
      categoryId: categoryIds.get(p.category) ?? null,
    };

    // 1) ชื่อเดียวกัน (สินค้าเดิมที่ไม่ใช่ DEMO) 2) SKU DEMO 3) สร้างใหม่
    const byName = await prisma.ecommerceProduct.findFirst({
      where: {
        storeId: store.id,
        name: p.name,
        NOT: { sku: { startsWith: "DEMO-" } },
      },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    const bySku = await prisma.ecommerceProduct.findFirst({
      where: { storeId: store.id, sku: p.sku },
      select: { id: true },
    });
    const targetId = byName?.id ?? bySku?.id;

    if (targetId) {
      await prisma.ecommerceProduct.update({ where: { id: targetId }, data });
      updated += 1;
      // ถ้าอัปเดตของเดิมแล้ว ปิดแถว DEMO ซ้ำชื่อ
      if (byName && bySku && bySku.id !== byName.id) {
        await prisma.ecommerceProduct.update({
          where: { id: bySku.id },
          data: { isActive: false },
        });
        deactivatedDupes += 1;
      }
      continue;
    }

    await prisma.ecommerceProduct.create({
      data: {
        storeId: store.id,
        ownerUserId: store.ownerUserId,
        sku: p.sku,
        ...data,
      },
    });
    created += 1;
  }

  // อัปเดตสินค้าเดิมที่ยังไม่มีรายละเอียด (ไม่ใช่ DEMO-*)
  const blank = await prisma.ecommerceProduct.findMany({
    where: {
      storeId: store.id,
      isActive: true,
      OR: [{ description: null }, { description: "" }],
      NOT: { sku: { startsWith: "DEMO-" } },
    },
    select: { id: true, name: true },
    take: 40,
  });
  for (const row of blank) {
    await prisma.ecommerceProduct.update({
      where: { id: row.id },
      data: {
        description: `${row.name} — สินค้าคุณภาพ พร้อมส่ง ดูรายละเอียดเต็มเมื่อคลิกการ์ด`,
      },
    });
  }

  const activeCount = await prisma.ecommerceProduct.count({
    where: { storeId: store.id, isActive: true, stockBalance: { gt: 0 } },
  });

  console.log(
    JSON.stringify(
      {
        storeId: store.id,
        storeName: store.storeName,
        created,
        updated,
        deactivatedDupes,
        filledBlankDescriptions: blank.length,
        activeWithStock: activeCount,
        shopUrl: `http://localhost:3000/shop/${store.id}`,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
