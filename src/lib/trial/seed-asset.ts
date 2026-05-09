import type { PrismaClient } from "@/generated/prisma/client";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

type DbLike = Tx | PrismaClient;

function ymdToDateUTC(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function shiftYmd(ymd: string, deltaDays: number): string {
  const d = ymdToDateUTC(ymd);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

const CATEGORIES = [
  { code: "IT", name: "อุปกรณ์ IT", depreciationYears: 5, sortOrder: 0 },
  { code: "FUR", name: "เฟอร์นิเจอร์", depreciationYears: 7, sortOrder: 1 },
  { code: "VEH", name: "ยานพาหนะ", depreciationYears: 8, sortOrder: 2 },
  { code: "OFC", name: "เครื่องใช้สำนักงาน", depreciationYears: 5, sortOrder: 3 },
  { code: "MCH", name: "เครื่องจักร", depreciationYears: 10, sortOrder: 4 },
] as const;

const DEPARTMENTS = [
  { code: "ADM", name: "บริหาร", sortOrder: 0 },
  { code: "ACC", name: "บัญชี-การเงิน", sortOrder: 1 },
  { code: "MKT", name: "การตลาด", sortOrder: 2 },
  { code: "OPR", name: "ปฏิบัติการ", sortOrder: 3 },
  { code: "IT", name: "ไอที", sortOrder: 4 },
] as const;

const LOCATIONS = [
  { code: "HQ-F1", name: "สำนักงานใหญ่ ชั้น 1", building: "อาคาร A", floor: "1", sortOrder: 0 },
  { code: "HQ-F2", name: "สำนักงานใหญ่ ชั้น 2", building: "อาคาร A", floor: "2", sortOrder: 1 },
  { code: "HQ-F3", name: "สำนักงานใหญ่ ชั้น 3", building: "อาคาร A", floor: "3", sortOrder: 2 },
  { code: "WH-01", name: "คลังสินค้า 1", building: "อาคาร B", floor: "1", sortOrder: 3 },
  { code: "WH-02", name: "คลังสินค้า 2", building: "อาคาร B", floor: "2", sortOrder: 4 },
] as const;

const SUPPLIERS = [
  { code: "SUP-001", name: "บริษัท ไอที โซลูชั่น จำกัด", contactPerson: "คุณชัยวัฒน์", phone: "02-555-1111" },
  { code: "SUP-002", name: "ห้างหุ้นส่วน เฟอร์นิเจอร์ดี", contactPerson: "คุณสมหญิง", phone: "02-555-2222" },
  { code: "SUP-003", name: "บริษัท ออโต้พลัส", contactPerson: "คุณวิชัย", phone: "02-555-3333" },
  { code: "SUP-004", name: "ออฟฟิศแลนด์", contactPerson: "คุณนภาพร", phone: "02-555-4444" },
] as const;

type AssetSeed = {
  assetCode: string;
  assetName: string;
  catCode: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseYmd: string;
  purchasePrice: number;
  warrantyYmd?: string;
  depYears: number;
  status: "AVAILABLE" | "IN_USE" | "BORROWED" | "IN_REPAIR" | "DISPOSED";
  condition: "GOOD" | "FAIR" | "POOR" | "BROKEN";
  depCode: string;
  locCode: string;
  supCode: string;
  holderName?: string;
};

const ASSETS: AssetSeed[] = [
  { assetCode: "AST-2025-00001", assetName: "โน้ตบุ๊ก Dell Latitude 5440", catCode: "IT", brand: "Dell", model: "Latitude 5440", serialNumber: "DL5440-001", purchaseYmd: "2025-03-15", purchasePrice: 35000, warrantyYmd: "2026-09-15", depYears: 5, status: "IN_USE", condition: "GOOD", depCode: "ADM", locCode: "HQ-F2", supCode: "SUP-001", holderName: "คุณวิภาดา (ผจก.)" },
  { assetCode: "AST-2025-00002", assetName: "โน้ตบุ๊ก HP EliteBook 840", catCode: "IT", brand: "HP", model: "EliteBook 840", serialNumber: "HP840-002", purchaseYmd: "2024-11-20", purchasePrice: 42000, warrantyYmd: "2027-11-20", depYears: 5, status: "IN_USE", condition: "GOOD", depCode: "ACC", locCode: "HQ-F1", supCode: "SUP-001", holderName: "คุณนพดล (สมุห์บัญชี)" },
  { assetCode: "AST-2025-00003", assetName: "เครื่องพิมพ์เลเซอร์", catCode: "OFC", brand: "Brother", model: "HL-L2375DW", serialNumber: "BR2375-003", purchaseYmd: "2024-06-10", purchasePrice: 6500, warrantyYmd: "2025-06-10", depYears: 5, status: "IN_USE", condition: "GOOD", depCode: "ADM", locCode: "HQ-F2", supCode: "SUP-004" },
  { assetCode: "AST-2025-00004", assetName: "โต๊ะทำงานผู้บริหาร", catCode: "FUR", brand: "Modernform", purchaseYmd: "2023-08-05", purchasePrice: 18500, depYears: 7, status: "IN_USE", condition: "GOOD", depCode: "ADM", locCode: "HQ-F3", supCode: "SUP-002" },
  { assetCode: "AST-2025-00005", assetName: "เก้าอี้สำนักงาน Ergonomic", catCode: "FUR", brand: "Modernform", model: "Ergo Pro", purchaseYmd: "2024-02-12", purchasePrice: 8200, depYears: 7, status: "IN_USE", condition: "GOOD", depCode: "MKT", locCode: "HQ-F2", supCode: "SUP-002" },
  { assetCode: "AST-2025-00006", assetName: "รถกระบะ Isuzu D-Max", catCode: "VEH", brand: "Isuzu", model: "D-Max", serialNumber: "ISZ-D-006", purchaseYmd: "2022-05-20", purchasePrice: 780000, warrantyYmd: "2025-05-20", depYears: 8, status: "IN_USE", condition: "GOOD", depCode: "OPR", locCode: "WH-01", supCode: "SUP-003", holderName: "ฝ่ายส่งของ" },
  { assetCode: "AST-2025-00007", assetName: "เครื่องปรับอากาศ Daikin 24000 BTU", catCode: "MCH", brand: "Daikin", model: "FTKQ24TV2S", purchaseYmd: "2023-04-22", purchasePrice: 32000, warrantyYmd: "2026-04-22", depYears: 10, status: "IN_USE", condition: "GOOD", depCode: "ADM", locCode: "HQ-F1", supCode: "SUP-004" },
  { assetCode: "AST-2025-00008", assetName: "จอภาพ LG 27 นิ้ว", catCode: "IT", brand: "LG", model: "27UP650", serialNumber: "LG27-008", purchaseYmd: "2025-01-10", purchasePrice: 12500, warrantyYmd: "2027-01-10", depYears: 5, status: "AVAILABLE", condition: "GOOD", depCode: "IT", locCode: "WH-02", supCode: "SUP-001" },
  { assetCode: "AST-2025-00009", assetName: "iPad Pro 12.9", catCode: "IT", brand: "Apple", model: "iPad Pro 12.9 M2", serialNumber: "APL-IP-009", purchaseYmd: "2024-09-15", purchasePrice: 45900, warrantyYmd: "2025-09-15", depYears: 5, status: "BORROWED", condition: "GOOD", depCode: "MKT", locCode: "HQ-F2", supCode: "SUP-001", holderName: "คุณกนิษฐา (ฝ่ายมาร์เก็ตติ้ง)" },
  { assetCode: "AST-2025-00010", assetName: "เครื่องถ่ายเอกสาร Canon", catCode: "OFC", brand: "Canon", model: "iR2530", serialNumber: "CN2530-010", purchaseYmd: "2022-03-08", purchasePrice: 65000, depYears: 7, status: "IN_REPAIR", condition: "FAIR", depCode: "ADM", locCode: "HQ-F1", supCode: "SUP-004" },
  { assetCode: "AST-2025-00011", assetName: "ตู้เก็บเอกสาร 4 ลิ้นชัก", catCode: "FUR", brand: "Modernform", purchaseYmd: "2021-12-01", purchasePrice: 8500, depYears: 7, status: "IN_USE", condition: "GOOD", depCode: "ACC", locCode: "HQ-F1", supCode: "SUP-002" },
  { assetCode: "AST-2025-00012", assetName: "Server Dell PowerEdge R750", catCode: "IT", brand: "Dell", model: "PowerEdge R750", serialNumber: "DPE750-012", purchaseYmd: "2024-04-18", purchasePrice: 285000, warrantyYmd: "2027-04-18", depYears: 5, status: "IN_USE", condition: "GOOD", depCode: "IT", locCode: "WH-02", supCode: "SUP-001" },
  { assetCode: "AST-2025-00013", assetName: "เครื่องสำรองไฟ APC 1500VA", catCode: "IT", brand: "APC", model: "Smart-UPS 1500", purchaseYmd: "2023-06-30", purchasePrice: 15800, warrantyYmd: "2025-06-30", depYears: 5, status: "IN_USE", condition: "GOOD", depCode: "IT", locCode: "WH-02", supCode: "SUP-001" },
  { assetCode: "AST-2025-00014", assetName: "โต๊ะประชุมไม้สัก 12 ที่นั่ง", catCode: "FUR", purchaseYmd: "2020-10-15", purchasePrice: 45000, depYears: 7, status: "IN_USE", condition: "FAIR", depCode: "ADM", locCode: "HQ-F3", supCode: "SUP-002" },
  { assetCode: "AST-2025-00015", assetName: "โปรเจคเตอร์ Epson", catCode: "OFC", brand: "Epson", model: "EB-E01", serialNumber: "EPS-E01-015", purchaseYmd: "2024-08-22", purchasePrice: 18500, warrantyYmd: "2026-02-22", depYears: 5, status: "AVAILABLE", condition: "GOOD", depCode: "ADM", locCode: "HQ-F3", supCode: "SUP-004" },
];

export async function seedAssetProdDemoForOwner(db: DbLike, ownerUserId: string): Promise<void> {
  const trialSessionId = TRIAL_PROD_SCOPE;

  const existingAssets = await db.asset.count({ where: { ownerUserId, trialSessionId } });
  if (existingAssets > 0) return;

  await db.assetSettings.upsert({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    update: {
      orgName: "บริษัท สาธิต จำกัด",
      orgAddress: "เลขที่ 99/9 ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กทม. 10400",
      orgPhone: "02-999-0000",
    },
    create: {
      ownerUserId,
      trialSessionId,
      orgName: "บริษัท สาธิต จำกัด",
      orgAddress: "เลขที่ 99/9 ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กทม. 10400",
      orgPhone: "02-999-0000",
    },
  });

  const catMap = new Map<string, number>();
  for (const c of CATEGORIES) {
    const row = await db.assetCategory.upsert({
      where: { ownerUserId_trialSessionId_code: { ownerUserId, trialSessionId, code: c.code } },
      update: { name: c.name, depreciationYears: c.depreciationYears, sortOrder: c.sortOrder, isActive: true },
      create: { ownerUserId, trialSessionId, code: c.code, name: c.name, depreciationYears: c.depreciationYears, sortOrder: c.sortOrder },
    });
    catMap.set(c.code, row.id);
  }

  const depMap = new Map<string, number>();
  for (const d of DEPARTMENTS) {
    const row = await db.assetDepartment.upsert({
      where: { ownerUserId_trialSessionId_code: { ownerUserId, trialSessionId, code: d.code } },
      update: { name: d.name, sortOrder: d.sortOrder, isActive: true },
      create: { ownerUserId, trialSessionId, code: d.code, name: d.name, sortOrder: d.sortOrder },
    });
    depMap.set(d.code, row.id);
  }

  const locMap = new Map<string, number>();
  for (const l of LOCATIONS) {
    const row = await db.assetLocation.upsert({
      where: { ownerUserId_trialSessionId_code: { ownerUserId, trialSessionId, code: l.code } },
      update: { name: l.name, building: l.building, floor: l.floor, sortOrder: l.sortOrder, isActive: true },
      create: { ownerUserId, trialSessionId, code: l.code, name: l.name, building: l.building, floor: l.floor, sortOrder: l.sortOrder },
    });
    locMap.set(l.code, row.id);
  }

  const supMap = new Map<string, number>();
  for (const s of SUPPLIERS) {
    const row = await db.assetSupplier.upsert({
      where: { ownerUserId_trialSessionId_code: { ownerUserId, trialSessionId, code: s.code } },
      update: { name: s.name, contactPerson: s.contactPerson, phone: s.phone, isActive: true },
      create: { ownerUserId, trialSessionId, code: s.code, name: s.name, contactPerson: s.contactPerson, phone: s.phone },
    });
    supMap.set(s.code, row.id);
  }

  const assetIdByCode = new Map<string, number>();

  for (const a of ASSETS) {
    const created = await db.asset.create({
      data: {
        ownerUserId,
        trialSessionId,
        assetCode: a.assetCode,
        assetName: a.assetName,
        categoryId: catMap.get(a.catCode) ?? null,
        departmentId: depMap.get(a.depCode) ?? null,
        locationId: locMap.get(a.locCode) ?? null,
        supplierId: supMap.get(a.supCode) ?? null,
        brand: a.brand ?? null,
        model: a.model ?? null,
        serialNumber: a.serialNumber ?? null,
        purchaseDate: ymdToDateUTC(a.purchaseYmd),
        purchasePrice: a.purchasePrice,
        warrantyUntil: a.warrantyYmd ? ymdToDateUTC(a.warrantyYmd) : null,
        depreciationYears: a.depYears,
        status: a.status,
        condition: a.condition,
        holderName: a.holderName ?? null,
        qrCode: a.assetCode,
      },
    });
    assetIdByCode.set(a.assetCode, created.id);
  }

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  const txs: Array<{ code: string; assetCode: string; type: "ASSIGN" | "BORROW" | "RETURN" | "TRANSFER"; ymd: string; toHolder?: string; fromHolder?: string; toLocCode?: string; fromLocCode?: string; note?: string }> = [
    { code: "TX-2025-00001", assetCode: "AST-2025-00001", type: "ASSIGN", ymd: shiftYmd(today, -45), toHolder: "คุณวิภาดา (ผจก.)", toLocCode: "HQ-F2", note: "มอบหมายเครื่องประจำตัว" },
    { code: "TX-2025-00002", assetCode: "AST-2025-00009", type: "BORROW", ymd: shiftYmd(today, -10), toHolder: "คุณกนิษฐา (ฝ่ายมาร์เก็ตติ้ง)", note: "ยืมไปงาน Event" },
    { code: "TX-2025-00003", assetCode: "AST-2025-00006", type: "TRANSFER", ymd: shiftYmd(today, -20), fromLocCode: "HQ-F1", toLocCode: "WH-01", note: "ย้ายไปคลัง" },
    { code: "TX-2025-00004", assetCode: "AST-2025-00005", type: "ASSIGN", ymd: shiftYmd(today, -30), toHolder: "ฝ่ายการตลาด", toLocCode: "HQ-F2" },
    { code: "TX-2025-00005", assetCode: "AST-2025-00002", type: "ASSIGN", ymd: shiftYmd(today, -60), toHolder: "คุณนพดล (สมุห์บัญชี)", toLocCode: "HQ-F1" },
  ];

  for (const t of txs) {
    const aid = assetIdByCode.get(t.assetCode);
    if (!aid) continue;
    await db.assetTransaction.create({
      data: {
        ownerUserId,
        trialSessionId,
        transactionCode: t.code,
        type: t.type,
        assetId: aid,
        transactionDate: ymdToDateUTC(t.ymd),
        toHolderName: t.toHolder ?? null,
        fromHolderName: t.fromHolder ?? null,
        toLocationId: t.toLocCode ? (locMap.get(t.toLocCode) ?? null) : null,
        fromLocationId: t.fromLocCode ? (locMap.get(t.fromLocCode) ?? null) : null,
        note: t.note ?? null,
      },
    });
  }

  const mts: Array<{ code: string; assetCode: string; startYmd: string; endYmd?: string; type: "PREVENTIVE" | "CORRECTIVE"; status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED"; cost?: number; vendor?: string; description?: string }> = [
    { code: "MT-2025-00001", assetCode: "AST-2025-00010", startYmd: shiftYmd(today, -7), type: "CORRECTIVE", status: "IN_PROGRESS", cost: 3500, vendor: "ศูนย์บริการ Canon", description: "เครื่องดึงกระดาษไม่ติด" },
    { code: "MT-2025-00002", assetCode: "AST-2025-00007", startYmd: shiftYmd(today, -90), endYmd: shiftYmd(today, -85), type: "PREVENTIVE", status: "COMPLETED", cost: 1200, vendor: "ทีมล้างแอร์", description: "ล้างแอร์ตามรอบ" },
  ];

  for (const m of mts) {
    const aid = assetIdByCode.get(m.assetCode);
    if (!aid) continue;
    await db.assetMaintenance.create({
      data: {
        ownerUserId,
        trialSessionId,
        maintenanceCode: m.code,
        assetId: aid,
        type: m.type,
        startDate: ymdToDateUTC(m.startYmd),
        endDate: m.endYmd ? ymdToDateUTC(m.endYmd) : null,
        cost: m.cost ?? null,
        vendor: m.vendor ?? null,
        description: m.description ?? null,
        status: m.status,
      },
    });
  }

  const audits: Array<{ code: string; assetCode: string; ymd: string; status: "MATCH" | "MISMATCH" | "MISSING"; auditor: string; note?: string }> = [
    { code: "AU-2025-00001", assetCode: "AST-2025-00001", ymd: shiftYmd(today, -5), status: "MATCH", auditor: "คุณภัทร" },
    { code: "AU-2025-00002", assetCode: "AST-2025-00014", ymd: shiftYmd(today, -3), status: "MISMATCH", auditor: "คุณภัทร", note: "พบรอยขูดบนหน้าโต๊ะ" },
  ];

  for (const a of audits) {
    const aid = assetIdByCode.get(a.assetCode);
    if (!aid) continue;
    await db.assetAudit.create({
      data: {
        ownerUserId,
        trialSessionId,
        auditCode: a.code,
        assetId: aid,
        auditDate: ymdToDateUTC(a.ymd),
        auditorName: a.auditor,
        status: a.status,
        note: a.note ?? null,
      },
    });
  }
}
