import type {
  AssetAuditStatus,
  AssetCondition,
  AssetDisposalMethod,
  AssetDisposalStatus,
  AssetMaintenanceStatus,
  AssetMaintenanceType,
  AssetStatus,
  AssetTransactionStatus,
  AssetTransactionType,
} from "@/generated/prisma/enums";

export const ASSET_STATUS_LABEL: Record<AssetStatus, string> = {
  AVAILABLE: "พร้อมใช้",
  IN_USE: "ใช้งานอยู่",
  BORROWED: "ถูกยืม",
  IN_REPAIR: "กำลังซ่อม",
  DISPOSED: "จำหน่ายออก",
};

export const ASSET_STATUS_TONE: Record<AssetStatus, string> = {
  AVAILABLE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  IN_USE: "border-sky-200 bg-sky-50 text-sky-700",
  BORROWED: "border-amber-200 bg-amber-50 text-amber-700",
  IN_REPAIR: "border-orange-200 bg-orange-50 text-orange-700",
  DISPOSED: "border-zinc-200 bg-zinc-50 text-zinc-600",
};

export const ASSET_CONDITION_LABEL: Record<AssetCondition, string> = {
  GOOD: "สภาพดี",
  FAIR: "พอใช้",
  POOR: "ทรุดโทรม",
  BROKEN: "ชำรุด",
};

export const ASSET_CONDITION_TONE: Record<AssetCondition, string> = {
  GOOD: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FAIR: "border-amber-200 bg-amber-50 text-amber-700",
  POOR: "border-orange-200 bg-orange-50 text-orange-700",
  BROKEN: "border-rose-200 bg-rose-50 text-rose-700",
};

export const ASSET_TRANSACTION_TYPE_LABEL: Record<AssetTransactionType, string> = {
  ASSIGN: "มอบหมาย",
  BORROW: "ยืม",
  RETURN: "คืน",
  TRANSFER: "ย้าย",
};

export const ASSET_TRANSACTION_TYPE_EMOJI: Record<AssetTransactionType, string> = {
  ASSIGN: "👤",
  BORROW: "↗️",
  RETURN: "↩️",
  TRANSFER: "🔁",
};

export const ASSET_TRANSACTION_STATUS_LABEL: Record<AssetTransactionStatus, string> = {
  ACTIVE: "กำลังดำเนินการ",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

export const ASSET_MAINTENANCE_TYPE_LABEL: Record<AssetMaintenanceType, string> = {
  PREVENTIVE: "เชิงป้องกัน",
  CORRECTIVE: "เชิงแก้ไข",
};

export const ASSET_MAINTENANCE_STATUS_LABEL: Record<AssetMaintenanceStatus, string> = {
  IN_PROGRESS: "กำลังซ่อม",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

export const ASSET_DISPOSAL_METHOD_LABEL: Record<AssetDisposalMethod, string> = {
  SALE: "ขาย",
  DONATION: "บริจาค",
  WRITE_OFF: "ตัดจำหน่าย",
  RECYCLE: "รีไซเคิล",
};

export const ASSET_DISPOSAL_STATUS_LABEL: Record<AssetDisposalStatus, string> = {
  PENDING: "รออนุมัติ",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};

export const ASSET_AUDIT_STATUS_LABEL: Record<AssetAuditStatus, string> = {
  MATCH: "ตรงกัน",
  MISMATCH: "ไม่ตรงกัน",
  MISSING: "หายไป",
};

export const ASSET_AUDIT_STATUS_TONE: Record<AssetAuditStatus, string> = {
  MATCH: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MISMATCH: "border-amber-200 bg-amber-50 text-amber-700",
  MISSING: "border-rose-200 bg-rose-50 text-rose-700",
};

/** คำนวณมูลค่าคงเหลือแบบเส้นตรง — ตัดมูลค่าเท่ากันทุกปีจนถึง 0 */
export function calcStraightLineValue(opts: {
  purchasePrice: number;
  purchaseDate: Date | null;
  depreciationYears: number;
  asOf?: Date;
}): number {
  const { purchasePrice, purchaseDate, depreciationYears } = opts;
  if (!purchasePrice || purchasePrice <= 0) return 0;
  if (!purchaseDate) return purchasePrice;
  if (!depreciationYears || depreciationYears <= 0) return purchasePrice;
  const asOf = opts.asOf ?? new Date();
  const ms = asOf.getTime() - purchaseDate.getTime();
  if (ms <= 0) return purchasePrice;
  const years = ms / (1000 * 60 * 60 * 24 * 365.25);
  if (years >= depreciationYears) return 0;
  const used = years / depreciationYears;
  return Math.max(0, purchasePrice * (1 - used));
}

/** จัดรูปสกุลเงินบาท */
export function formatTHB(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

/** จัดรูปวันที่ไทยแบบสั้น */
export function formatThaiDateShort(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** จัดรูปวันที่ไทยแบบเต็ม */
export function formatThaiDateLong(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** ตรวจว่าใกล้หมดประกันใน N วันหรือไม่ */
export function isWarrantyExpiringSoon(warrantyUntil: Date | null, days = 30): boolean {
  if (!warrantyUntil) return false;
  const now = new Date();
  const diffDays = Math.ceil((warrantyUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}

/** สร้างรหัส YYYY-NNNNN เช่น AST-2026-00012 */
export function buildSerialCode(prefix: string, year: number, seq: number): string {
  return `${prefix}-${year}-${String(seq).padStart(5, "0")}`;
}
