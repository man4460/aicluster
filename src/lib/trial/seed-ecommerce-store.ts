import { Prisma } from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  generateEcommerceReferenceCode,
  generateEcommerceTrackingCode,
} from "@/lib/ecommerce/order-codes";

/** รูปที่ตรวจ HEAD 200 แล้ว — ห้ามใช้ picsum (ลิงก์ไม่เสถียร) */
const U = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const STORE_LOGO_URL = U("photo-1441986300917-64674bd600d8", 400);
const SLIP_SAMPLE_URLS = [
  U("photo-1556742049-0cfed4f6a45d", 600),
  U("photo-1563013544-824ae1b704d3", 600),
  U("photo-1554224155-6726b3ff858f", 600),
  U("photo-1450101499163-c8848c66ca85", 600),
] as const;

const CATEGORY_DEFS = [
  "สกินแคร์",
  "เมคอัพ",
  "ของใช้ในบ้าน",
  "Gadget",
  "แฟชั่น",
] as const;

type ProductDef = {
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  category: (typeof CATEGORY_DEFS)[number];
  imageId: string;
  recommended?: boolean;
  bestseller?: boolean;
  active?: boolean;
};

const PRODUCT_DEFS: readonly ProductDef[] = [
  {
    name: "เซรั่มวิตามินซี 30ml",
    description: "เซรั่มผิวกระจ่างใส สกัดวิตามินซีเข้มข้น เหมาะผิวหมองคล้ำ",
    price: 299,
    stock: 42,
    sku: "SK-SERUM-01",
    category: "สกินแคร์",
    imageId: "photo-1556228720-195a672e8a03",
    recommended: true,
    bestseller: true,
  },
  {
    name: "ครีมกันแดด SPF50 PA+++",
    description: "เนื้อบางเบา ไม่เหนียวเหนอะ กันน้ำกันเหงื่อ",
    price: 189,
    stock: 68,
    sku: "SK-SUN-02",
    category: "สกินแคร์",
    imageId: "photo-1612817288484-6f916006741a",
    recommended: true,
  },
  {
    name: "โฟมล้างหน้าชาเขียว",
    description: "ทำความสะอาดล้ำลึก ลดสิวอุดตัน",
    price: 129,
    stock: 55,
    sku: "SK-FOAM-03",
    category: "สกินแคร์",
    imageId: "photo-1556228578-0d85b1a4d571",
  },
  {
    name: "มาส์กหน้าคอลลาเจน (แพ็ก 5)",
    description: "แผ่นมาส์กชุ่มชื้น คอลลาเจนเข้มข้น",
    price: 249,
    stock: 4,
    sku: "SK-MASK-04",
    category: "สกินแคร์",
    imageId: "photo-1598440947619-2c35fc9aa908",
    bestseller: true,
  },
  {
    name: "โทนเนอร์ไฮยาลูรอน",
    description: "เติมน้ำให้ผิว หลังล้างหน้า",
    price: 219,
    stock: 36,
    sku: "SK-TONER-05",
    category: "สกินแคร์",
    imageId: "photo-1608571423902-eed4a5ad8108",
  },
  {
    name: "ลิปสติกโทนนู้ด",
    description: "สีติดทน เนื้อแมทท์ไม่แห้ง",
    price: 159,
    stock: 28,
    sku: "MK-LIP-01",
    category: "เมคอัพ",
    imageId: "photo-1586495777744-4413f21062fa",
    recommended: true,
  },
  {
    name: "พาเลตต์อายแชโดว์ 9 สี",
    description: "โทนอุ่นประจำวัน เม็ดสีแน่น",
    price: 459,
    stock: 15,
    sku: "MK-EYE-02",
    category: "เมคอัพ",
    imageId: "photo-1512496015851-a90fb38ba796",
    bestseller: true,
  },
  {
    name: "คุชชั่น SPF40",
    description: "ปกปิดบางเบา คุมมัน รีฟิลได้",
    price: 390,
    stock: 22,
    sku: "MK-CUSH-03",
    category: "เมคอัพ",
    imageId: "photo-1631214524020-7e18db9a8f92",
  },
  {
    name: "มาสคาร่ากันน้ำ",
    description: "ขนตางอนเด้ง ไม่หลุดง่าย",
    price: 199,
    stock: 31,
    sku: "MK-MAS-04",
    category: "เมคอัพ",
    imageId: "photo-1616683693504-3ea7e9ad6fec",
  },
  {
    name: "ถุงผ้าลดโลกร้อน",
    description: "ผ้าแคนวาสหนา รองรับ 10 กก.",
    price: 79,
    stock: 120,
    sku: "HM-BAG-01",
    category: "ของใช้ในบ้าน",
    imageId: "photo-1553062407-98eeb64c6a62",
  },
  {
    name: "น้ำมันหอมระเหยลาเวนเดอร์",
    description: "กลิ่นผ่อนคลาย สำหรับดิฟฟิวเซอร์",
    price: 349,
    stock: 19,
    sku: "HM-OIL-02",
    category: "ของใช้ในบ้าน",
    imageId: "photo-1607619056574-7b8d3ee536b2",
    recommended: true,
  },
  {
    name: "เทียนหอมโซยา 180g",
    description: "เผาไหม้สะอาด กลิ่นวนิลา",
    price: 279,
    stock: 24,
    sku: "HM-CANDLE-03",
    category: "ของใช้ในบ้าน",
    imageId: "photo-1601924994987-69e26d50dc26",
  },
  {
    name: "ขวดน้ำเก็บความเย็น 750ml",
    description: "สแตนเลส เก็บเย็น 24 ชม.",
    price: 390,
    stock: 40,
    sku: "HM-BOTTLE-04",
    category: "ของใช้ในบ้าน",
    imageId: "photo-1602143407151-7111542de6e8",
  },
  {
    name: "หูฟังบลูทูธ (ขาว)",
    description: "ตัดเสียงรบกวน แบต 28 ชม.",
    price: 890,
    stock: 14,
    sku: "GD-BT-01",
    category: "Gadget",
    imageId: "photo-1505740420928-5e560c06d30e",
    bestseller: true,
    recommended: true,
  },
  {
    name: "สายชาร์จ PD 1.5m",
    description: "รองรับ 65W USB-C to USB-C",
    price: 129,
    stock: 85,
    sku: "GD-CABLE-02",
    category: "Gadget",
    imageId: "photo-1580910051074-3eb694886505",
  },
  {
    name: "ลำโพงพกพา Bluetooth",
    description: "กันน้ำ IPX7 เบสแน่น",
    price: 1290,
    stock: 9,
    sku: "GD-SPK-03",
    category: "Gadget",
    imageId: "photo-1546868871-7041f2a55e12",
  },
  {
    name: "สมาร์ทวอทช์ Sport",
    description: "วัดชีพจร GPS แบต 7 วัน",
    price: 2490,
    stock: 7,
    sku: "GD-WATCH-04",
    category: "Gadget",
    imageId: "photo-1523275335684-37898b6baf30",
    bestseller: true,
  },
  {
    name: "เคสโทรศัพท์ใสกันกระแทก",
    description: "รองรับ MagSafe ขอบนุ่ม",
    price: 199,
    stock: 60,
    sku: "GD-CASE-05",
    category: "Gadget",
    imageId: "photo-1511707171634-5f897ff02aa9",
  },
  {
    name: "แว่นกันแดด UV400",
    description: "เลนส์โพลาไรซ์ กรอบเบา",
    price: 590,
    stock: 18,
    sku: "FS-SUN-01",
    category: "แฟชั่น",
    imageId: "photo-1572635196237-14b3f281503f",
    recommended: true,
  },
  {
    name: "กระเป๋าสะพายมินิ",
    description: "หนังเทียม ซิปคู่ จุของจำเป็น",
    price: 490,
    stock: 21,
    sku: "FS-BAG-02",
    category: "แฟชั่น",
    imageId: "photo-1560343090-f0409e92791a",
  },
  {
    name: "เสื้อยืดคอกลม (ขาว)",
    description: "ผ้าคอตตอน 100% ไซส์ S–XL",
    price: 259,
    stock: 48,
    sku: "FS-TEE-03",
    category: "แฟชั่น",
    imageId: "photo-1618354691373-d851c5c3a990",
  },
  {
    name: "รองเท้าผ้าใบยูนีเซ็กซ์",
    description: "พื้นนุ่ม ใส่เที่ยว/ทำงาน",
    price: 990,
    stock: 2,
    sku: "FS-SHOE-04",
    category: "แฟชั่น",
    imageId: "photo-1542291026-7eec264c27ff",
    bestseller: true,
  },
  {
    name: "น้ำหอมมินิ 15ml (เลิกผลิต)",
    description: "สินค้าตัวอย่างสถานะปิดขาย",
    price: 450,
    stock: 0,
    sku: "FS-PERF-X",
    category: "แฟชั่น",
    imageId: "photo-1585386959984-a4155224a1ad",
    active: false,
  },
];

type BuyerDef = { name: string; phone: string; address: string };

const BUYER_DEFS: readonly BuyerDef[] = [
  { name: "คุณสมชาย ใจดี", phone: "0812341111", address: "ถ.พระราม 9 แขวงบางกะปิ กทม. 10310" },
  { name: "คุณอรทัย สุขใจ", phone: "0895552222", address: "ต.สุเทพ อ.เมือง เชียงใหม่ 50200" },
  { name: "คุณวิชัย พาณิชย์", phone: "0623334444", address: "หาดใหญ่ สงขลา 90110" },
  { name: "คุณนภา วัฒนา", phone: "0918887777", address: "เมืองพัทยา ชลบุรี 20150" },
  { name: "คุณกิตติ พรหมมา", phone: "0861119999", address: "อ.เมือง ขอนแก่น 40000" },
  { name: "คุณพิมพ์ใจ แสงทอง", phone: "0832223333", address: "ลาดพร้าว กทม. 10230" },
  { name: "คุณธนพล มีสุข", phone: "0984445555", address: "อ.เมือง นครราชสีมา 30000" },
  { name: "คุณมานี รุ่งเรือง", phone: "0876667788", address: "อ.เมือง ภูเก็ต 83000" },
];

type OrderStatus = "PENDING_SLIP" | "VERIFYING" | "PREPARING" | "SHIPPED";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

/**
 * ข้อมูลตัวอย่าง E-Commerce Store — เฉพาะบัญชี demo (prod)
 * หมวด · สินค้า · CRM · ออเดอร์หลายสถานะ/ช่องทาง · รายจ่าย
 */
export async function seedEcommerceStoreProdDemoForOwner(
  prisma: PrismaClient,
  ownerUserId: string,
) {
  const trialSessionId = "prod";

  const store = await prisma.ecommerceStore.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
  if (store) {
    await prisma.ecommerceOrderItem.deleteMany({
      where: { order: { storeId: store.id } },
    });
    await prisma.ecommerceOrder.deleteMany({ where: { storeId: store.id } });
    await prisma.ecommerceBuyerCustomer.deleteMany({ where: { storeId: store.id } });
    await prisma.ecommerceProduct.deleteMany({ where: { storeId: store.id } });
    await prisma.ecommerceCategory.deleteMany({ where: { storeId: store.id } });
    await prisma.ecommerceStore.delete({ where: { id: store.id } });
  }

  await prisma.ecommerceCostEntry.deleteMany({ where: { ownerUserId } });
  await prisma.ecommerceCostCategory.deleteMany({ where: { ownerUserId } });

  const createdStore = await prisma.ecommerceStore.create({
    data: {
      ownerUserId,
      trialSessionId,
      storeName: "MAWELL Lifestyle Shop",
      tagline: "สวยครบ จบในคลิก — สกินแคร์ · เมคอัพ · Gadget",
      description:
        "ร้านตัวอย่าง MAWELL — สินค้าไลฟ์สไตล์คุณภาพ จัดส่งทั่วไทย ชำระพร้อมเพย์/โอนได้",
      logoUrl: STORE_LOGO_URL,
      contactPhone: "02-114-5588",
      address: "99/12 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย กทม. 10110",
      promptPayPhone: "0812345678",
      bankName: "กสิกรไทย",
      bankAccountName: "หจก.มาเวล ไลฟ์สไตล์",
      bankAccountNumber: "123-4-56789-0",
      taxId: "0105550123456",
      paymentNote: "โอนแล้วแนบสลิปในหน้าชำระ · แจ้งชื่อ-เบอร์ที่โอน",
      slipPaperSize: "SLIP_58",
      contactLine: "@mawellshop",
      facebookUrl: "https://www.facebook.com/",
      mapUrl: "https://maps.google.com/?q=Bangkok",
      lowStockThreshold: 5,
      salePageEnabled: true,
    },
  });

  const categoryIds = new Map<string, string>();
  for (let i = 0; i < CATEGORY_DEFS.length; i++) {
    const catName = CATEGORY_DEFS[i]!;
    const cat = await prisma.ecommerceCategory.create({
      data: {
        storeId: createdStore.id,
        ownerUserId,
        name: catName,
        sortOrder: i,
        isActive: true,
      },
    });
    categoryIds.set(catName, cat.id);
  }

  const products: Array<{
    id: string;
    name: string;
    priceBaht: Prisma.Decimal;
    stockBalance: number;
  }> = [];

  for (let i = 0; i < PRODUCT_DEFS.length; i++) {
    const p = PRODUCT_DEFS[i]!;
    const row = await prisma.ecommerceProduct.create({
      data: {
        storeId: createdStore.id,
        ownerUserId,
        name: p.name,
        description: p.description,
        sku: p.sku,
        priceBaht: new Prisma.Decimal(p.price),
        stockBalance: p.stock,
        imageUrl: U(p.imageId),
        isActive: p.active !== false,
        isRecommended: Boolean(p.recommended),
        isBestseller: Boolean(p.bestseller),
        sortOrder: i,
        categoryId: categoryIds.get(p.category) ?? null,
      },
    });
    products.push({
      id: row.id,
      name: row.name,
      priceBaht: row.priceBaht,
      stockBalance: row.stockBalance,
    });
  }

  const featuredId = products[0]!.id;
  await prisma.ecommerceStore.update({
    where: { id: createdStore.id },
    data: { featuredProductId: featuredId },
  });

  const buyers = [];
  for (const b of BUYER_DEFS) {
    const row = await prisma.ecommerceBuyerCustomer.create({
      data: {
        storeId: createdStore.id,
        ownerUserId,
        name: b.name,
        phone: b.phone,
        totalSpendBaht: new Prisma.Decimal(0),
        orderCount: 0,
      },
    });
    buyers.push({ ...row, address: b.address });
  }

  type SeedOrderLine = { productIndex: number; qty: number };
  type SeedOrder = {
    dayOffset: number;
    buyerIndex: number;
    status: OrderStatus;
    channel: "ONLINE" | "IN_STORE";
    paymentMethod: string | null;
    withSlip: boolean;
    lines: SeedOrderLine[];
  };

  const orderSeeds: SeedOrder[] = [
    {
      dayOffset: 0,
      buyerIndex: 0,
      status: "PENDING_SLIP",
      channel: "ONLINE",
      paymentMethod: null,
      withSlip: false,
      lines: [{ productIndex: 5, qty: 1 }, { productIndex: 9, qty: 2 }],
    },
    {
      dayOffset: 0,
      buyerIndex: 1,
      status: "VERIFYING",
      channel: "ONLINE",
      paymentMethod: "PROMPTPAY",
      withSlip: true,
      lines: [{ productIndex: 0, qty: 1 }, { productIndex: 1, qty: 1 }],
    },
    {
      dayOffset: 1,
      buyerIndex: 2,
      status: "PREPARING",
      channel: "ONLINE",
      paymentMethod: "TRANSFER",
      withSlip: true,
      lines: [{ productIndex: 13, qty: 1 }],
    },
    {
      dayOffset: 1,
      buyerIndex: 5,
      status: "SHIPPED",
      channel: "IN_STORE",
      paymentMethod: "CASH",
      withSlip: false,
      lines: [{ productIndex: 14, qty: 2 }, { productIndex: 2, qty: 1 }],
    },
    {
      dayOffset: 2,
      buyerIndex: 3,
      status: "SHIPPED",
      channel: "ONLINE",
      paymentMethod: "PROMPTPAY",
      withSlip: true,
      lines: [{ productIndex: 6, qty: 1 }, { productIndex: 7, qty: 1 }],
    },
    {
      dayOffset: 3,
      buyerIndex: 4,
      status: "SHIPPED",
      channel: "IN_STORE",
      paymentMethod: "CREDIT_CARD",
      withSlip: false,
      lines: [{ productIndex: 16, qty: 1 }],
    },
    {
      dayOffset: 4,
      buyerIndex: 6,
      status: "SHIPPED",
      channel: "ONLINE",
      paymentMethod: "TRANSFER",
      withSlip: true,
      lines: [
        { productIndex: 18, qty: 1 },
        { productIndex: 10, qty: 1 },
        { productIndex: 11, qty: 1 },
      ],
    },
    {
      dayOffset: 5,
      buyerIndex: 7,
      status: "SHIPPED",
      channel: "IN_STORE",
      paymentMethod: "PROMPTPAY",
      withSlip: true,
      lines: [{ productIndex: 21, qty: 1 }, { productIndex: 20, qty: 2 }],
    },
    {
      dayOffset: 7,
      buyerIndex: 0,
      status: "SHIPPED",
      channel: "ONLINE",
      paymentMethod: "PROMPTPAY",
      withSlip: true,
      lines: [{ productIndex: 3, qty: 2 }, { productIndex: 4, qty: 1 }],
    },
    {
      dayOffset: 9,
      buyerIndex: 1,
      status: "SHIPPED",
      channel: "IN_STORE",
      paymentMethod: "CASH",
      withSlip: false,
      lines: [{ productIndex: 15, qty: 1 }],
    },
    {
      dayOffset: 12,
      buyerIndex: 2,
      status: "SHIPPED",
      channel: "ONLINE",
      paymentMethod: "TRANSFER",
      withSlip: true,
      lines: [{ productIndex: 8, qty: 1 }, { productIndex: 12, qty: 1 }],
    },
    {
      dayOffset: 14,
      buyerIndex: 3,
      status: "SHIPPED",
      channel: "ONLINE",
      paymentMethod: "PROMPTPAY",
      withSlip: true,
      lines: [{ productIndex: 17, qty: 1 }, { productIndex: 19, qty: 1 }],
    },
    {
      dayOffset: 18,
      buyerIndex: 4,
      status: "SHIPPED",
      channel: "IN_STORE",
      paymentMethod: "CASH",
      withSlip: false,
      lines: [{ productIndex: 0, qty: 2 }, { productIndex: 9, qty: 3 }],
    },
    {
      dayOffset: 21,
      buyerIndex: 5,
      status: "SHIPPED",
      channel: "ONLINE",
      paymentMethod: "CREDIT_CARD",
      withSlip: false,
      lines: [{ productIndex: 13, qty: 1 }, { productIndex: 14, qty: 1 }],
    },
    {
      dayOffset: 25,
      buyerIndex: 6,
      status: "SHIPPED",
      channel: "ONLINE",
      paymentMethod: "PROMPTPAY",
      withSlip: true,
      lines: [{ productIndex: 1, qty: 3 }],
    },
  ];

  const buyerSpend = new Map<string, { total: Prisma.Decimal; count: number; last: Date }>();

  for (let oi = 0; oi < orderSeeds.length; oi++) {
    const od = orderSeeds[oi]!;
    const buyer = buyers[od.buyerIndex]!;
    const createdAt = daysAgo(od.dayOffset);
    createdAt.setHours(10 + (oi % 8), (oi * 7) % 60, 0, 0);

    const itemCreates = od.lines.map((line) => {
      const p = products[line.productIndex]!;
      const lineTotal = p.priceBaht.mul(line.qty);
      return {
        productId: p.id,
        productName: p.name,
        quantity: line.qty,
        unitPriceBaht: p.priceBaht,
        lineTotalBaht: lineTotal,
      };
    });
    const totalAmount = itemCreates.reduce(
      (sum, it) => sum.add(it.lineTotalBaht),
      new Prisma.Decimal(0),
    );

    await prisma.ecommerceOrder.create({
      data: {
        storeId: createdStore.id,
        ownerUserId,
        referenceCode: generateEcommerceReferenceCode(),
        trackingCode: generateEcommerceTrackingCode(),
        customerName: buyer.name,
        customerPhone: buyer.phone,
        customerAddress: buyer.address,
        totalAmount,
        paymentSlipUrl: od.withSlip ? SLIP_SAMPLE_URLS[oi % SLIP_SAMPLE_URLS.length]! : null,
        salesChannel: od.channel,
        paymentMethod: od.paymentMethod,
        status: od.status,
        buyerCustomerId: buyer.id,
        createdAt,
        updatedAt: createdAt,
        items: { create: itemCreates },
      },
    });

    const prev = buyerSpend.get(buyer.id) ?? {
      total: new Prisma.Decimal(0),
      count: 0,
      last: createdAt,
    };
    buyerSpend.set(buyer.id, {
      total: prev.total.add(totalAmount),
      count: prev.count + 1,
      last: createdAt > prev.last ? createdAt : prev.last,
    });
  }

  for (const [buyerId, agg] of buyerSpend) {
    await prisma.ecommerceBuyerCustomer.update({
      where: { id: buyerId },
      data: {
        totalSpendBaht: agg.total,
        orderCount: agg.count,
        lastOrderAt: agg.last,
      },
    });
  }

  const costCats = [
    { name: "ค่าโฆษณาออนไลน์", sortOrder: 0 },
    { name: "ค่าแพ็กเกจ/กล่อง", sortOrder: 1 },
    { name: "ค่าขนส่ง", sortOrder: 2 },
    { name: "ค่าเช่าโกดัง", sortOrder: 3 },
    { name: "ค่าสาธารณูปโภค", sortOrder: 4 },
  ] as const;

  const costCatIds: string[] = [];
  for (const c of costCats) {
    const row = await prisma.ecommerceCostCategory.create({
      data: { ownerUserId, name: c.name, sortOrder: c.sortOrder },
    });
    costCatIds.push(row.id);
  }

  const costEntries: Array<{
    cat: number;
    label: string;
    amount: number;
    dayOffset: number;
    note?: string;
    slip?: boolean;
  }> = [
    { cat: 0, label: "Facebook Ads — สกินแคร์", amount: 2500, dayOffset: 2, slip: true },
    { cat: 0, label: "TikTok Boost สินค้าเด่น", amount: 1800, dayOffset: 8, slip: true },
    { cat: 1, label: "กล่องพัสดุ 100 ใบ", amount: 890, dayOffset: 3, note: "ร้านแพ็กเกจ" },
    { cat: 1, label: "ถุงกันกระแทก", amount: 450, dayOffset: 10 },
    { cat: 2, label: "Kerry Express รอบสัปดาห์", amount: 3200, dayOffset: 1, slip: true },
    { cat: 2, label: "Flash Express COD", amount: 1450, dayOffset: 6 },
    { cat: 3, label: "ค่าเช่าโกดัง เดือนนี้", amount: 8500, dayOffset: 5, slip: true },
    { cat: 4, label: "ค่าไฟโกดัง", amount: 2100, dayOffset: 4 },
    { cat: 4, label: "ค่าเน็ตร้าน", amount: 699, dayOffset: 12 },
    { cat: 0, label: "Line OA แพ็กเกจ", amount: 500, dayOffset: 15 },
    { cat: 1, label: "สติกเกอร์แบรนด์", amount: 350, dayOffset: 18 },
    { cat: 2, label: "ค่าส่งคืนสินค้า", amount: 280, dayOffset: 20, note: "เคลมลูกค้า" },
  ];

  for (let i = 0; i < costEntries.length; i++) {
    const e = costEntries[i]!;
    const spentAt = daysAgo(e.dayOffset);
    spentAt.setHours(14, (i * 11) % 60, 0, 0);
    await prisma.ecommerceCostEntry.create({
      data: {
        ownerUserId,
        categoryId: costCatIds[e.cat]!,
        label: e.label,
        amountBaht: e.amount,
        spentAt,
        note: e.note ?? null,
        paymentSlipUrl: e.slip ? SLIP_SAMPLE_URLS[i % SLIP_SAMPLE_URLS.length]! : null,
      },
    });
  }
}
