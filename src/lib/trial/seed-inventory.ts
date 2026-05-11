import type { PrismaClient } from "@/generated/prisma/client";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;
type DbLike = Tx | PrismaClient;

type WarehouseSeed = {
  code: string;
  name: string;
  address: string;
  sortOrder: number;
};

const WAREHOUSES: WarehouseSeed[] = [
  { code: "MAIN", name: "คลังหลัก", address: "ถ.ลาดพร้าว แขวงจอมพล เขตจตุจักร กทม.", sortOrder: 0 },
  { code: "BR01", name: "สาขา 1 — เซ็นทรัล", address: "ห้างเซ็นทรัล ชั้น 3", sortOrder: 1 },
  { code: "BR02", name: "สาขา 2 — โรบินสัน", address: "ห้างโรบินสัน ชั้น G", sortOrder: 2 },
];

type CategorySeed = {
  name: string;
  sortOrder: number;
};

const CATEGORIES: CategorySeed[] = [
  { name: "เครื่องดื่ม", sortOrder: 0 },
  { name: "ของกินเล่น", sortOrder: 1 },
  { name: "ของใช้สำนักงาน", sortOrder: 2 },
  { name: "อุปกรณ์เสริม IT", sortOrder: 3 },
  { name: "ของชำเบ็ดเตล็ด", sortOrder: 4 },
];

type ItemSeed = {
  sku: string;
  name: string;
  categoryName: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  note: string | null;
  /** จำนวนเริ่มต้นในแต่ละคลัง (ตามลำดับ MAIN / BR01 / BR02) */
  initialStock: [number, number, number];
};

const ITEMS: ItemSeed[] = [
  {
    sku: "DRK-001",
    name: "น้ำดื่ม 600ml (แพ็ก 12 ขวด)",
    categoryName: "เครื่องดื่ม",
    unit: "แพ็ก",
    costPrice: 55,
    salePrice: 75,
    minStock: 15,
    note: "ยี่ห้อสิงห์ — สั่งทุกวันจันทร์",
    initialStock: [42, 8, 6],
  },
  {
    sku: "DRK-002",
    name: "โค้กกระป๋อง 325ml",
    categoryName: "เครื่องดื่ม",
    unit: "กระป๋อง",
    costPrice: 14,
    salePrice: 20,
    minStock: 24,
    note: null,
    initialStock: [72, 12, 8],
  },
  {
    sku: "DRK-003",
    name: "กาแฟ Birdy 180ml",
    categoryName: "เครื่องดื่ม",
    unit: "กระป๋อง",
    costPrice: 13,
    salePrice: 18,
    minStock: 24,
    note: null,
    initialStock: [18, 6, 2],
  },
  {
    sku: "SNK-001",
    name: "เลย์รสออริจินอล (75g)",
    categoryName: "ของกินเล่น",
    unit: "ห่อ",
    costPrice: 16,
    salePrice: 25,
    minStock: 20,
    note: null,
    initialStock: [55, 14, 9],
  },
  {
    sku: "SNK-002",
    name: "เบนโตะปลาหมึก (24g)",
    categoryName: "ของกินเล่น",
    unit: "ซอง",
    costPrice: 8,
    salePrice: 14,
    minStock: 30,
    note: "ขายดีหน้าร้าน",
    initialStock: [12, 4, 3],
  },
  {
    sku: "SNK-003",
    name: "หมากฝรั่งล็อตเต้",
    categoryName: "ของกินเล่น",
    unit: "ห่อ",
    costPrice: 5,
    salePrice: 10,
    minStock: 50,
    note: null,
    initialStock: [120, 30, 20],
  },
  {
    sku: "OFC-001",
    name: "ปากกาลูกลื่น 0.5mm (สีน้ำเงิน)",
    categoryName: "ของใช้สำนักงาน",
    unit: "ด้าม",
    costPrice: 4,
    salePrice: 8,
    minStock: 30,
    note: null,
    initialStock: [85, 20, 18],
  },
  {
    sku: "OFC-002",
    name: "กระดาษ A4 80gsm (รีม)",
    categoryName: "ของใช้สำนักงาน",
    unit: "รีม",
    costPrice: 115,
    salePrice: 140,
    minStock: 10,
    note: "Double A",
    initialStock: [22, 5, 3],
  },
  {
    sku: "OFC-003",
    name: "แฟ้มเอกสาร A4 (สันแคบ)",
    categoryName: "ของใช้สำนักงาน",
    unit: "แฟ้ม",
    costPrice: 35,
    salePrice: 55,
    minStock: 12,
    note: null,
    initialStock: [8, 3, 2],
  },
  {
    sku: "IT-001",
    name: "เมาส์ไร้สาย (Logitech M170)",
    categoryName: "อุปกรณ์เสริม IT",
    unit: "ตัว",
    costPrice: 280,
    salePrice: 380,
    minStock: 5,
    note: null,
    initialStock: [12, 3, 2],
  },
  {
    sku: "IT-002",
    name: "สาย USB-C 1m",
    categoryName: "อุปกรณ์เสริม IT",
    unit: "เส้น",
    costPrice: 75,
    salePrice: 120,
    minStock: 10,
    note: null,
    initialStock: [4, 2, 1],
  },
  {
    sku: "IT-003",
    name: "หูฟัง In-Ear",
    categoryName: "อุปกรณ์เสริม IT",
    unit: "ชุด",
    costPrice: 95,
    salePrice: 150,
    minStock: 6,
    note: null,
    initialStock: [8, 2, 1],
  },
  {
    sku: "GEN-001",
    name: "ถุงพลาสติกหูหิ้ว (แพ็ก 100 ใบ)",
    categoryName: "ของชำเบ็ดเตล็ด",
    unit: "แพ็ก",
    costPrice: 38,
    salePrice: 55,
    minStock: 8,
    note: null,
    initialStock: [18, 5, 4],
  },
  {
    sku: "GEN-002",
    name: "ผงซักฟอกซองเล็ก",
    categoryName: "ของชำเบ็ดเตล็ด",
    unit: "ซอง",
    costPrice: 12,
    salePrice: 18,
    minStock: 20,
    note: null,
    initialStock: [42, 10, 8],
  },
];

type MovementSeed = {
  /** วันก่อนหน้า — กี่วันที่แล้ว (0 = วันนี้, 1 = เมื่อวาน) */
  daysAgo: number;
  hour: number;
  minute: number;
  type: "IN" | "OUT" | "TRANSFER" | "ADJUST";
  sku: string;
  fromCode: string | null;
  toCode: string | null;
  quantity: number;
  unitCost: number | null;
  reference: string | null;
  note: string | null;
};

/** 12 รายการล่าสุด (ครอบคลุมทุก type) — ใช้เป็นประวัติให้แดชบอร์ดดูสนุก */
const MOVEMENTS: MovementSeed[] = [
  {
    daysAgo: 0,
    hour: 9,
    minute: 15,
    type: "IN",
    sku: "DRK-001",
    fromCode: null,
    toCode: "MAIN",
    quantity: 24,
    unitCost: 54,
    reference: "PO-2026-0511",
    note: "รับเข้าสต๊อกประจำสัปดาห์",
  },
  {
    daysAgo: 0,
    hour: 10,
    minute: 40,
    type: "TRANSFER",
    sku: "DRK-001",
    fromCode: "MAIN",
    toCode: "BR01",
    quantity: 6,
    unitCost: null,
    reference: "TRN-0511-01",
    note: "โอนไปสาขา 1",
  },
  {
    daysAgo: 0,
    hour: 11,
    minute: 5,
    type: "OUT",
    sku: "SNK-001",
    fromCode: "BR01",
    toCode: null,
    quantity: 4,
    unitCost: null,
    reference: "POS-2026-0001",
    note: "ขายปลีกหน้าร้าน",
  },
  {
    daysAgo: 0,
    hour: 14,
    minute: 22,
    type: "ADJUST",
    sku: "SNK-003",
    fromCode: "MAIN",
    toCode: null,
    quantity: 3,
    unitCost: null,
    reference: "AUD-0511",
    note: "ตรวจนับพบหายเล็กน้อย — ปรับลด 3",
  },
  {
    daysAgo: 1,
    hour: 15,
    minute: 30,
    type: "OUT",
    sku: "OFC-002",
    fromCode: "MAIN",
    toCode: null,
    quantity: 2,
    unitCost: null,
    reference: "REQ-0510-03",
    note: "เบิกใช้สำนักงาน",
  },
  {
    daysAgo: 1,
    hour: 17,
    minute: 50,
    type: "OUT",
    sku: "DRK-002",
    fromCode: "BR02",
    toCode: null,
    quantity: 5,
    unitCost: null,
    reference: "POS-2026-0002",
    note: null,
  },
  {
    daysAgo: 2,
    hour: 9,
    minute: 0,
    type: "IN",
    sku: "OFC-001",
    fromCode: null,
    toCode: "MAIN",
    quantity: 50,
    unitCost: 3.8,
    reference: "PO-2026-0509",
    note: "สั่งซื้อจาก ออฟฟิศแลนด์",
  },
  {
    daysAgo: 2,
    hour: 11,
    minute: 12,
    type: "TRANSFER",
    sku: "OFC-001",
    fromCode: "MAIN",
    toCode: "BR02",
    quantity: 12,
    unitCost: null,
    reference: "TRN-0509-02",
    note: null,
  },
  {
    daysAgo: 3,
    hour: 10,
    minute: 5,
    type: "IN",
    sku: "IT-001",
    fromCode: null,
    toCode: "MAIN",
    quantity: 6,
    unitCost: 275,
    reference: "PO-2026-0508",
    note: "Restock เมาส์",
  },
  {
    daysAgo: 4,
    hour: 12,
    minute: 30,
    type: "OUT",
    sku: "IT-002",
    fromCode: "MAIN",
    toCode: null,
    quantity: 2,
    unitCost: null,
    reference: "POS-2026-0003",
    note: null,
  },
  {
    daysAgo: 5,
    hour: 16,
    minute: 0,
    type: "TRANSFER",
    sku: "GEN-002",
    fromCode: "MAIN",
    toCode: "BR01",
    quantity: 6,
    unitCost: null,
    reference: "TRN-0506-01",
    note: null,
  },
  {
    daysAgo: 6,
    hour: 9,
    minute: 45,
    type: "IN",
    sku: "DRK-002",
    fromCode: null,
    toCode: "MAIN",
    quantity: 48,
    unitCost: 13.5,
    reference: "PO-2026-0505",
    note: "รับเข้าโค้กลอตใหม่",
  },
];

function dateAtBangkok(daysAgo: number, hour: number, minute: number): Date {
  // Compose timestamp at "today - daysAgo" at given hour/minute in Bangkok time.
  const now = new Date();
  const bkk = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  bkk.setUTCDate(bkk.getUTCDate() - daysAgo);
  bkk.setUTCHours(hour, minute, 0, 0);
  return new Date(bkk.getTime() - 7 * 60 * 60 * 1000);
}

export async function seedInventoryProdDemoForOwner(
  db: DbLike,
  ownerUserId: string,
): Promise<void> {
  const existing = await db.inventoryItem.count({ where: { ownerUserId } });
  if (existing > 0) return;

  // 1) Warehouses
  const whIdByCode = new Map<string, number>();
  for (const w of WAREHOUSES) {
    const row = await db.inventoryWarehouse.upsert({
      where: {
        ownerUserId_code: { ownerUserId, code: w.code },
      },
      update: {},
      create: {
        ownerUserId,
        code: w.code,
        name: w.name,
        address: w.address,
        sortOrder: w.sortOrder,
        isActive: true,
      },
      select: { id: true },
    });
    whIdByCode.set(w.code, row.id);
  }

  // 2) Categories
  const catIdByName = new Map<string, number>();
  for (const c of CATEGORIES) {
    const row = await db.inventoryCategory.create({
      data: {
        ownerUserId,
        name: c.name,
        sortOrder: c.sortOrder,
        isActive: true,
      },
      select: { id: true },
    });
    catIdByName.set(c.name, row.id);
  }

  // 3) Items + initial stock per warehouse
  const itemIdBySku = new Map<string, number>();
  for (const it of ITEMS) {
    const row = await db.inventoryItem.create({
      data: {
        ownerUserId,
        sku: it.sku,
        name: it.name,
        categoryId: catIdByName.get(it.categoryName) ?? null,
        unit: it.unit,
        costPrice: it.costPrice,
        salePrice: it.salePrice,
        minStock: it.minStock,
        note: it.note,
        isActive: true,
      },
      select: { id: true },
    });
    itemIdBySku.set(it.sku, row.id);

    const codes: ("MAIN" | "BR01" | "BR02")[] = ["MAIN", "BR01", "BR02"];
    for (let i = 0; i < codes.length; i++) {
      const qty = it.initialStock[i];
      if (qty <= 0) continue;
      const wid = whIdByCode.get(codes[i]);
      if (!wid) continue;
      await db.inventoryStock.create({
        data: {
          ownerUserId,
          itemId: row.id,
          warehouseId: wid,
          quantity: qty,
        },
      });
    }
  }

  // 4) Movements (history rows only — สต๊อกเริ่มต้นจริงตั้งไว้ด้วยขั้นที่ 3 แล้ว
  // เพื่อให้ค่ายอดคงเหลือ "ลงตัว" กับ scenario seed; movements ตรงนี้เป็น log ประกอบเท่านั้น)
  for (const m of MOVEMENTS) {
    const itemId = itemIdBySku.get(m.sku);
    if (!itemId) continue;
    const fromId = m.fromCode ? whIdByCode.get(m.fromCode) ?? null : null;
    const toId = m.toCode ? whIdByCode.get(m.toCode) ?? null : null;
    const createdAt = dateAtBangkok(m.daysAgo, m.hour, m.minute);
    await db.inventoryMovement.create({
      data: {
        ownerUserId,
        type: m.type,
        itemId,
        fromWarehouseId: fromId,
        toWarehouseId: toId,
        quantity: m.quantity,
        unitCost: m.unitCost ?? null,
        reference: m.reference,
        note: m.note,
        createdAt,
      },
    });
  }
}
