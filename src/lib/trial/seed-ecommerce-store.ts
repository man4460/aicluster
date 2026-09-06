import { Prisma } from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";
import {
  generateEcommerceReferenceCode,
  generateEcommerceTrackingCode,
} from "@/lib/ecommerce/order-codes";
import { serializeEcommerceGalleryImages } from "@/lib/ecommerce/product-images";
import { bangkokDateKey } from "@/lib/time/bangkok";

/** รูป Unsplash ที่ตรวจ HEAD 200 แล้ว — ห้ามใช้ picsum */
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
  "สุขภาพ / กีฬา",
] as const;

/** มุมอื่นต่อหมวด (verified 200) — ไม่รวมรูปปกของสินค้าแต่ละชิ้น */
const GALLERY_BY_CATEGORY: Record<(typeof CATEGORY_DEFS)[number], readonly string[]> = {
  สกินแคร์: [
    "photo-1556228453-efd6c1ff04f6",
    "photo-1556228578-8c89e6adf883",
    "photo-1611930022073-b7a4ba5fcccd",
    "photo-1596755389378-c31d21fd1273",
    "photo-1629198688000-71f23e745b6e",
  ],
  เมคอัพ: [
    "photo-1522335789203-aabd1fc54bc9",
    "photo-1487412947147-5cebf100ffc2",
    "photo-1487412720507-e7ab37603c6f",
    "photo-1515377905703-c4788e51af15",
  ],
  ของใช้ในบ้าน: [
    "photo-1556740738-b6a63e27c4df",
    "photo-1441984904996-e0b6ba687e04",
    "photo-1483985988355-763728e1935b",
    "photo-1553062407-98eeb64c6a62",
  ],
  Gadget: [
    "photo-1526170375885-4d8ecf77b99f",
    "photo-1498049794561-7780e7231661",
    "photo-1583394838336-acd977736f90",
    "photo-1556656793-08538906a9f8",
    "photo-1592899677977-9c10ca588bbd",
  ],
  แฟชั่น: [
    "photo-1515886657613-9f3515b0c78f",
    "photo-1490481651871-ab68de25d43d",
    "photo-1460353581641-37baddab0fa2",
    "photo-1483985988355-763728e1935b",
  ],
  "สุขภาพ / กีฬา": [
    "photo-1571019613454-1cb2f99b2d8b",
    "photo-1518611012118-696072aa579a",
    "photo-1544367567-0f2fcb009e0b",
    "photo-1599058917765-a780eda07a3e",
  ],
};

type ProductDef = {
  name: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  category: (typeof CATEGORY_DEFS)[number];
  imageId: string;
  /** มุมอื่นเพิ่มจากชุดหมวด — ค่าว่าง = ใช้ pool หมวดอัตโนมัติ */
  galleryIds?: readonly string[];
  galleryCount?: number;
  recommended?: boolean;
  bestseller?: boolean;
  active?: boolean;
};

function galleryUrlsForProduct(p: ProductDef): string[] {
  const pool = p.galleryIds?.length
    ? [...p.galleryIds]
    : [...(GALLERY_BY_CATEGORY[p.category] ?? [])];
  const extras = pool.filter((id) => id !== p.imageId);
  const count = Math.min(Math.max(p.galleryCount ?? 3, 0), 5, extras.length);
  // กระจายตาม sku เพื่อไม่ให้ทุกชิ้นรูปมุมเดียวกันหมด
  const start = Math.abs(
    [...p.sku].reduce((acc, ch) => acc + ch.charCodeAt(0), 0),
  ) % Math.max(extras.length, 1);
  const picked: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const id = extras[(start + i) % extras.length]!;
    if (!picked.includes(id)) picked.push(id);
  }
  return picked.map((id) => U(id));
}

const PRODUCT_DEFS: readonly ProductDef[] = [
  {
    name: "เซรั่มวิตามินซี 30ml",
    description: "เซรั่มผิวกระจ่างใส สกัดวิตามินซีเข้มข้น เหมาะผิวหมองคล้ำ",
    price: 299,
    stock: 42,
    sku: "SK-SERUM-01",
    category: "สกินแคร์",
    imageId: "photo-1556228720-195a672e8a03",
    galleryCount: 4,
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
    galleryCount: 3,
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
    galleryCount: 3,
  },
  {
    name: "มาส์กหน้าคอลลาเจน (แพ็ก 5)",
    description: "แผ่นมาส์กชุ่มชื้น คอลลาเจนเข้มข้น",
    price: 249,
    stock: 4,
    sku: "SK-MASK-04",
    category: "สกินแคร์",
    imageId: "photo-1598440947619-2c35fc9aa908",
    galleryCount: 3,
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
    galleryCount: 3,
  },
  {
    name: "ลิปสติกโทนนู้ด",
    description: "สีติดทน เนื้อแมทท์ไม่แห้ง",
    price: 159,
    stock: 28,
    sku: "MK-LIP-01",
    category: "เมคอัพ",
    imageId: "photo-1586495777744-4413f21062fa",
    galleryCount: 4,
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
    galleryCount: 4,
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
    galleryCount: 3,
  },
  {
    name: "มาสคาร่ากันน้ำ",
    description: "ขนตางอนเด้ง ไม่หลุดง่าย",
    price: 199,
    stock: 31,
    sku: "MK-MAS-04",
    category: "เมคอัพ",
    imageId: "photo-1616683693504-3ea7e9ad6fec",
    galleryCount: 3,
  },
  {
    name: "ถุงผ้าลดโลกร้อน",
    description: "ผ้าแคนวาสหนา รองรับ 10 กก.",
    price: 79,
    stock: 120,
    sku: "HM-BAG-01",
    category: "ของใช้ในบ้าน",
    imageId: "photo-1553062407-98eeb64c6a62",
    galleryCount: 3,
  },
  {
    name: "น้ำมันหอมระเหยลาเวนเดอร์",
    description: "กลิ่นผ่อนคลาย สำหรับดิฟฟิวเซอร์",
    price: 349,
    stock: 19,
    sku: "HM-OIL-02",
    category: "ของใช้ในบ้าน",
    imageId: "photo-1607619056574-7b8d3ee536b2",
    galleryCount: 3,
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
    galleryCount: 3,
  },
  {
    name: "ขวดน้ำเก็บความเย็น 750ml",
    description: "สแตนเลส เก็บเย็น 24 ชม.",
    price: 390,
    stock: 40,
    sku: "HM-BOTTLE-04",
    category: "ของใช้ในบ้าน",
    imageId: "photo-1602143407151-7111542de6e8",
    galleryCount: 3,
  },
  {
    name: "หูฟังบลูทูธ (ขาว)",
    description: "ตัดเสียงรบกวน แบต 28 ชม.",
    price: 890,
    stock: 14,
    sku: "GD-BT-01",
    category: "Gadget",
    imageId: "photo-1505740420928-5e560c06d30e",
    galleryCount: 4,
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
    galleryCount: 3,
  },
  {
    name: "ลำโพงพกพา Bluetooth",
    description: "กันน้ำ IPX7 เบสแน่น",
    price: 1290,
    stock: 9,
    sku: "GD-SPK-03",
    category: "Gadget",
    imageId: "photo-1546868871-7041f2a55e12",
    galleryCount: 3,
  },
  {
    name: "สมาร์ทวอทช์ Sport",
    description: "วัดชีพจร GPS แบต 7 วัน",
    price: 2490,
    stock: 7,
    sku: "GD-WATCH-04",
    category: "Gadget",
    imageId: "photo-1523275335684-37898b6baf30",
    galleryCount: 4,
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
    galleryCount: 3,
  },
  {
    name: "แว่นกันแดด UV400",
    description: "เลนส์โพลาไรซ์ กรอบเบา",
    price: 590,
    stock: 18,
    sku: "FS-SUN-01",
    category: "แฟชั่น",
    imageId: "photo-1572635196237-14b3f281503f",
    galleryCount: 3,
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
    galleryCount: 3,
  },
  {
    name: "เสื้อยืดคอกลม (ขาว)",
    description: "ผ้าคอตตอน 100% ไซส์ S–XL",
    price: 259,
    stock: 48,
    sku: "FS-TEE-03",
    category: "แฟชั่น",
    imageId: "photo-1618354691373-d851c5c3a990",
    galleryCount: 3,
  },
  {
    name: "รองเท้าผ้าใบยูนีเซ็กซ์",
    description: "พื้นนุ่ม ใส่เที่ยว/ทำงาน",
    price: 990,
    stock: 2,
    sku: "FS-SHOE-04",
    category: "แฟชั่น",
    imageId: "photo-1542291026-7eec264c27ff",
    galleryCount: 4,
    bestseller: true,
  },
  {
    name: "หมวกแก๊ปผ้าคอตตอน",
    description: "ปรับขนาดได้ ปักโลโก้เรียบ",
    price: 249,
    stock: 44,
    sku: "FS-CAP-05",
    category: "แฟชั่น",
    imageId: "photo-1588850561407-ed78c282e89b",
    galleryCount: 3,
  },
  {
    name: "เข็มขัดหนังแท้",
    description: "หัวโลหะเงา สายปรับได้",
    price: 590,
    stock: 17,
    sku: "FS-BELT-06",
    category: "แฟชั่น",
    imageId: "photo-1606107557195-0e29a4b5b4aa",
    galleryCount: 3,
  },
  {
    name: "โยคะแมท TPE 6mm",
    description: "กันลื่น สองหน้า พกพาง่าย",
    price: 690,
    stock: 26,
    sku: "SP-MAT-01",
    category: "สุขภาพ / กีฬา",
    imageId: "photo-1601925260368-ae2f83cf8b7f",
    galleryCount: 3,
    recommended: true,
  },
  {
    name: "ดัมเบลล์ปรับน้ำหนัก 2–20kg",
    description: "ชุดคู่ เปลี่ยนแผ่นเร็ว",
    price: 1890,
    stock: 11,
    sku: "SP-DUMB-02",
    category: "สุขภาพ / กีฬา",
    imageId: "photo-1517836357463-d25dfeac3438",
    galleryCount: 3,
  },
  {
    name: "ขวดเชคเกอร์โปรตีน 700ml",
    description: "ฝาเกลียว ไม่รั่ว มีตะแกรง",
    price: 189,
    stock: 70,
    sku: "SP-SHAKE-03",
    category: "สุขภาพ / กีฬา",
    imageId: "photo-1593095948071-474c5cc2989d",
    galleryCount: 3,
    bestseller: true,
  },
  {
    name: "สายแรงต้าน Resistance Band",
    description: "ชุด 5 ระดับ ความต้านทานต่างกัน",
    price: 320,
    stock: 38,
    sku: "SP-BAND-04",
    category: "สุขภาพ / กีฬา",
    imageId: "photo-1599058917765-a780eda07a3e",
    galleryCount: 3,
  },
  {
    name: "โฟมโรลเลอร์นวดกล้ามเนื้อ",
    description: "ความหนาแน่นสูง คลายปวดหลัง",
    price: 450,
    stock: 20,
    sku: "SP-ROLL-05",
    category: "สุขภาพ / กีฬา",
    imageId: "photo-1571019614242-c5c5dee9f50b",
    galleryCount: 3,
  },
  {
    name: "ครีมบำรุงกลางคืน Retinol",
    description: "ลดริ้วรอย ใช้ตอนกลางคืน",
    price: 520,
    stock: 29,
    sku: "SK-NIGHT-06",
    category: "สกินแคร์",
    imageId: "photo-1556228453-efd6c1ff04f6",
    galleryCount: 4,
    recommended: true,
  },
  {
    name: "บลัชออนเนื้อฝุ่น",
    description: "สีธรรมชาติ เกลี่ยง่าย",
    price: 289,
    stock: 33,
    sku: "MK-BLUSH-05",
    category: "เมคอัพ",
    imageId: "photo-1596462502278-27bfdc403348",
    galleryCount: 3,
  },
  {
    name: "พาวเวอร์แบงก์ 20000mAh",
    description: "ชาร์จเร็ว PD 22.5W จอแสดง %",
    price: 790,
    stock: 25,
    sku: "GD-PWR-06",
    category: "Gadget",
    imageId: "photo-1592899677977-9c10ca588bbd",
    galleryCount: 4,
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
    galleryCount: 0,
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
  { name: "คุณสุภาพร ใจเย็น", phone: "0847778899", address: "อ.เมือง อุดรธานี 41000" },
  { name: "คุณอภิชาติ เจริญ", phone: "0921112233", address: "บางนา กทม. 10260" },
  { name: "คุณวรรณา สว่าง", phone: "0883334455", address: "อ.เมือง สุราษฎร์ธานี 84000" },
  { name: "คุณปิยะ วงศ์ทอง", phone: "0615556677", address: "อ.เมือง เชียงราย 57000" },
];

type OrderStatus = "PENDING_SLIP" | "VERIFYING" | "PREPARING" | "SHIPPED";

/** วันนับถอยหลังตามปฏิทินไทย (Asia/Bangkok) — เที่ยงวันนั้น */
function daysAgo(n: number): Date {
  const key = bangkokDateKey();
  const base = new Date(`${key}T12:00:00+07:00`);
  base.setTime(base.getTime() - n * 24 * 60 * 60 * 1000);
  const ymd = bangkokDateKey(base);
  return new Date(`${ymd}T12:00:00+07:00`);
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
        galleryImagesJson: serializeEcommerceGalleryImages(galleryUrlsForProduct(p)),
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

  const activeProductCount = products.length; // รวม inactive ท้าย — ตัดออกตอนสุ่ม
  const lastActiveIndex = PRODUCT_DEFS.findIndex((p) => p.active === false);
  const maxActive = lastActiveIndex >= 0 ? lastActiveIndex : activeProductCount;

  /**
   * ยอดขายวันนี้ (SHIPPED) — เรียง qty ต่างกันเพื่อเติม “สินค้าขายดี 10 อันดับ”
   * productIndex อ้าง PRODUCT_DEFS (สินค้า active เท่านั้น)
   */
  const TODAY_TOP_SALES: Array<{ productIndex: number; qty: number }> = [
    { productIndex: 0, qty: 18 }, // เซรั่มวิตามินซี
    { productIndex: 13, qty: 15 }, // หูฟัง
    { productIndex: 31, qty: 14 }, // พาวเวอร์แบงก์
    { productIndex: 1, qty: 12 }, // กันแดด
    { productIndex: 5, qty: 11 }, // ลิป
    { productIndex: 26, qty: 10 }, // เชคเกอร์
    { productIndex: 14, qty: 9 }, // สายชาร์จ
    { productIndex: 6, qty: 8 }, // อายแชโดว์
    { productIndex: 3, qty: 7 }, // มาส์ก
    { productIndex: 9, qty: 6 }, // ถุงผ้า
    { productIndex: 16, qty: 5 }, // สมาร์ทวอทช์
    { productIndex: 18, qty: 4 }, // แว่น
    { productIndex: 27, qty: 4 }, // resistance band
    { productIndex: 2, qty: 3 }, // โฟมล้างหน้า
    { productIndex: 24, qty: 3 }, // โยคะแมท
  ];

  const payments = ["PROMPTPAY", "TRANSFER", "CASH", "CREDIT_CARD", "PROMPTPAY"] as const;
  const channels = ["ONLINE", "IN_STORE"] as const;

  const orderSeeds: SeedOrder[] = [
    {
      dayOffset: 0,
      buyerIndex: 0,
      status: "PENDING_SLIP",
      channel: "ONLINE",
      paymentMethod: null,
      withSlip: false,
      lines: [
        { productIndex: 5, qty: 1 },
        { productIndex: 9, qty: 2 },
      ],
    },
    {
      dayOffset: 0,
      buyerIndex: 1,
      status: "VERIFYING",
      channel: "ONLINE",
      paymentMethod: "PROMPTPAY",
      withSlip: true,
      lines: [
        { productIndex: 7, qty: 1 },
        { productIndex: 29, qty: 1 },
      ],
    },
    {
      dayOffset: 0,
      buyerIndex: 8,
      status: "PREPARING",
      channel: "ONLINE",
      paymentMethod: "TRANSFER",
      withSlip: true,
      lines: [
        { productIndex: 21, qty: 1 },
        { productIndex: 22, qty: 1 },
      ],
    },
  ];

  // ออเดอร์ SHIPPED วันนี้ — แยกชิ้นต่อออเดอร์ให้ยอดรวมตรง TODAY_TOP_SALES
  let todayBuyer = 0;
  for (const sale of TODAY_TOP_SALES) {
    if (sale.productIndex >= maxActive) continue;
    let left = sale.qty;
    while (left > 0) {
      const chunk = Math.min(left, 1 + (left % 3));
      orderSeeds.push({
        dayOffset: 0,
        buyerIndex: todayBuyer % BUYER_DEFS.length,
        status: "SHIPPED",
        channel: channels[todayBuyer % 2]!,
        paymentMethod: payments[todayBuyer % payments.length]!,
        withSlip: todayBuyer % 3 !== 0,
        lines: [{ productIndex: sale.productIndex, qty: chunk }],
      });
      left -= chunk;
      todayBuyer += 1;
    }
  }

  // ออเดอร์รวมหลายชิ้นวันนี้ (เพิ่มความสมจริง)
  const todayBundles: SeedOrderLine[][] = [
    [
      { productIndex: 0, qty: 1 },
      { productIndex: 1, qty: 2 },
      { productIndex: 4, qty: 1 },
    ],
    [
      { productIndex: 13, qty: 1 },
      { productIndex: 17, qty: 2 },
      { productIndex: 31, qty: 1 },
    ],
    [
      { productIndex: 25, qty: 1 },
      { productIndex: 26, qty: 2 },
      { productIndex: 27, qty: 1 },
    ],
    [
      { productIndex: 10, qty: 1 },
      { productIndex: 11, qty: 1 },
      { productIndex: 12, qty: 2 },
    ],
  ];
  for (let i = 0; i < todayBundles.length; i++) {
    orderSeeds.push({
      dayOffset: 0,
      buyerIndex: (i + 3) % BUYER_DEFS.length,
      status: "SHIPPED",
      channel: i % 2 === 0 ? "ONLINE" : "IN_STORE",
      paymentMethod: payments[i % payments.length]!,
      withSlip: true,
      lines: todayBundles[i]!,
    });
  }

  // ประวัติย้อนหลัง (เดือนนี้) — กระจายสินค้าให้หน้าการเงิน/รายงานมีข้อมูล
  const historyOffsets = [1, 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 18, 20, 22, 25, 27];
  for (let hi = 0; hi < historyOffsets.length; hi++) {
    const a = (hi * 3) % maxActive;
    const b = (hi * 5 + 2) % maxActive;
    const c = (hi * 7 + 4) % maxActive;
    const lines: SeedOrderLine[] = [{ productIndex: a, qty: 1 + (hi % 3) }];
    if (b !== a) lines.push({ productIndex: b, qty: 1 + (hi % 2) });
    if (c !== a && c !== b && hi % 2 === 0) lines.push({ productIndex: c, qty: 1 });
    orderSeeds.push({
      dayOffset: historyOffsets[hi]!,
      buyerIndex: hi % BUYER_DEFS.length,
      status: "SHIPPED",
      channel: channels[hi % 2]!,
      paymentMethod: payments[hi % payments.length]!,
      withSlip: hi % 4 !== 0,
      lines,
    });
  }
  const buyerSpend = new Map<string, { total: Prisma.Decimal; count: number; last: Date }>();

  for (let oi = 0; oi < orderSeeds.length; oi++) {
    const od = orderSeeds[oi]!;
    const buyer = buyers[od.buyerIndex]!;
    const createdAt = daysAgo(od.dayOffset);
    const ymd = bangkokDateKey(createdAt);
    const hour = 9 + (oi % 10);
    const minute = (oi * 7) % 60;
    const createdAtBkk = new Date(
      `${ymd}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+07:00`,
    );

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
        createdAt: createdAtBkk,
        updatedAt: createdAtBkk,
        items: { create: itemCreates },
      },
    });

    const prev = buyerSpend.get(buyer.id) ?? {
      total: new Prisma.Decimal(0),
      count: 0,
      last: createdAtBkk,
    };
    buyerSpend.set(buyer.id, {
      total: prev.total.add(totalAmount),
      count: prev.count + 1,
      last: createdAtBkk > prev.last ? createdAtBkk : prev.last,
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
