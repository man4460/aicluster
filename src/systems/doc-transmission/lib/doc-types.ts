import type {
  DocAuditAction,
  DocCategory,
  DocPriority,
  DocStatus,
  DocTimelineAction,
} from "@/generated/prisma/enums";

export type DocCategoryKey = DocCategory;

export const DOC_CATEGORIES: readonly DocCategoryKey[] = [
  "ORDERS",
  "MEMOS",
  "INCOMING",
  "OUTGOING",
  "CIRCULARS",
] as const;

export type DocCategoryConfig = {
  key: DocCategoryKey;
  /** path slug ใต้ /dashboard/doc-transmission/records/<slug> */
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  /** label ของช่อง "เลขที่" และ "บุคคล/หน่วยงาน" ในฟอร์ม */
  numberLabel: string;
  personLabel: string;
  /** label ของช่อง record_date */
  dateLabel: string;
  /** Tailwind tone */
  tone: "blue" | "amber" | "emerald" | "purple" | "pink";
};

export const DOC_CATEGORY_LIST: readonly DocCategoryConfig[] = [
  {
    key: "ORDERS",
    slug: "orders",
    title: "คำสั่งโรงเรียน",
    shortTitle: "คำสั่ง",
    description: "ทะเบียนคำสั่งแต่งตั้งและปฏิบัติหน้าที่",
    numberLabel: "เลขที่คำสั่ง",
    personLabel: "ผู้สั่ง / ลงนาม",
    dateLabel: "วันที่คำสั่ง",
    tone: "blue",
  },
  {
    key: "MEMOS",
    slug: "memos",
    title: "บันทึกข้อความ",
    shortTitle: "บันทึก",
    description: "ทะเบียนบันทึกข้อความภายใน",
    numberLabel: "เลขที่บันทึก",
    personLabel: "ผู้ขอ / แจ้ง",
    dateLabel: "วันที่บันทึก",
    tone: "amber",
  },
  {
    key: "INCOMING",
    slug: "incoming",
    title: "หนังสือรับ",
    shortTitle: "รับ",
    description: "ทะเบียนหนังสือรับจากภายนอก",
    numberLabel: "เลขที่รับ",
    personLabel: "จากหน่วยงาน",
    dateLabel: "วันที่รับ",
    tone: "emerald",
  },
  {
    key: "OUTGOING",
    slug: "outgoing",
    title: "หนังสือส่ง",
    shortTitle: "ส่ง",
    description: "ทะเบียนหนังสือส่งภายนอก",
    numberLabel: "เลขที่ส่ง",
    personLabel: "ถึงหน่วยงาน",
    dateLabel: "วันที่ส่ง",
    tone: "purple",
  },
  {
    key: "CIRCULARS",
    slug: "circulars",
    title: "หนังสือเวียน",
    shortTitle: "เวียน",
    description: "ทะเบียนหนังสือเวียนภายในหน่วยงาน",
    numberLabel: "เลขที่หนังสือ",
    personLabel: "หน่วยงานที่แจ้ง",
    dateLabel: "วันที่",
    tone: "pink",
  },
] as const;

export const DOC_CATEGORY_BY_KEY: Record<DocCategoryKey, DocCategoryConfig> = Object.fromEntries(
  DOC_CATEGORY_LIST.map((c) => [c.key, c]),
) as Record<DocCategoryKey, DocCategoryConfig>;

export const DOC_CATEGORY_BY_SLUG: Record<string, DocCategoryConfig> = Object.fromEntries(
  DOC_CATEGORY_LIST.map((c) => [c.slug, c]),
);

export type DocStatusConfig = {
  key: DocStatus;
  label: string;
  /** Tailwind classes — toggle เพิ่ม/ลด ตามจุดใช้งาน */
  badge: string;
  text: string;
};

export const DOC_STATUS_LIST: readonly DocStatusConfig[] = [
  {
    key: "NORMAL",
    label: "ปกติ",
    badge: "bg-blue-100 text-blue-700 ring-blue-200",
    text: "text-blue-600",
  },
  {
    key: "IN_PROGRESS",
    label: "กำลังดำเนินการ",
    badge: "bg-amber-100 text-amber-700 ring-amber-200",
    text: "text-amber-600",
  },
  {
    key: "DONE",
    label: "เสร็จสิ้น",
    badge: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    text: "text-emerald-600",
  },
  {
    key: "CANCELED",
    label: "ยกเลิก",
    badge: "bg-rose-100 text-rose-700 ring-rose-200",
    text: "text-rose-600",
  },
] as const;

export const DOC_STATUS_BY_KEY: Record<DocStatus, DocStatusConfig> = Object.fromEntries(
  DOC_STATUS_LIST.map((s) => [s.key, s]),
) as Record<DocStatus, DocStatusConfig>;

export const DOC_PRIORITY_LIST: readonly { key: DocPriority; label: string; tone: string }[] = [
  { key: "NORMAL", label: "ปกติ", tone: "bg-slate-100 text-slate-600 ring-slate-200" },
  { key: "URGENT", label: "ด่วน", tone: "bg-orange-100 text-orange-700 ring-orange-200" },
  { key: "IMMEDIATE", label: "ด่วนที่สุด", tone: "bg-red-100 text-red-700 ring-red-200" },
] as const;

export const DOC_PRIORITY_BY_KEY: Record<DocPriority, { key: DocPriority; label: string; tone: string }> =
  Object.fromEntries(DOC_PRIORITY_LIST.map((p) => [p.key, p])) as Record<
    DocPriority,
    { key: DocPriority; label: string; tone: string }
  >;

export const DOC_TIMELINE_ACTION_LABEL: Record<DocTimelineAction, string> = {
  CREATED: "สร้างรายการ",
  RECEIVED: "ลงรับเอกสาร",
  REGISTERED: "ลงทะเบียน",
  ASSIGNED: "มอบหมาย",
  IN_TRANSIT: "อยู่ระหว่างเดินทาง",
  SIGNED: "ลงนาม",
  DELIVERED: "นำส่งแล้ว",
  COMPLETED: "ดำเนินการเสร็จ",
  CANCELED: "ยกเลิก",
  NOTE: "บันทึกเพิ่มเติม",
  FILE_REPLACED: "อัปไฟล์ใหม่",
  STATUS_CHANGED: "เปลี่ยนสถานะ",
};

export const DOC_AUDIT_ACTION_LABEL: Record<DocAuditAction, string> = {
  CREATE: "สร้าง",
  UPDATE: "แก้ไข",
  DELETE: "ลบ",
  STATUS_CHANGE: "เปลี่ยนสถานะ",
  ASSIGN: "มอบหมาย",
  FILE_REPLACE: "เปลี่ยนไฟล์แนบ",
  SHARE_ENABLED: "เปิด Share Link",
  SHARE_DISABLED: "ปิด Share Link",
  TIMELINE_ADDED: "บันทึก timeline",
};

/** ปีการศึกษาเริ่มต้น (ปีไทย พ.ศ. — เปลี่ยน 1 พ.ค. ของทุกปี) */
export function defaultThaiAcademicYear(d: Date = new Date()): string {
  const beIYear = d.getFullYear() + 543;
  // ก่อน 1 พ.ค. ใช้ปีก่อนหน้า
  if (d.getMonth() < 4) return String(beIYear - 1);
  return String(beIYear);
}

/** สร้าง running running tracking code: <prefix>-<categoryKey>-<seqHex> เช่น "DOC-ORD-A21" */
export function buildTrackingCode(prefix: string, categoryKey: DocCategoryKey, seq: number): string {
  const catShort: Record<DocCategoryKey, string> = {
    ORDERS: "ORD",
    MEMOS: "MEM",
    INCOMING: "IN",
    OUTGOING: "OUT",
    CIRCULARS: "CIR",
  };
  const ts = Date.now().toString(36).slice(-4).toUpperCase();
  return `${prefix.toUpperCase()}-${catShort[categoryKey]}-${seq.toString(36).toUpperCase().padStart(4, "0")}-${ts}`;
}

/** สร้าง doc number ตามปี+seq เช่น ORD-2567/0123 */
export function buildDocNumber(prefix: string, year: string, seq: number): string {
  return `${prefix.toUpperCase()}-${year}/${seq.toString().padStart(4, "0")}`;
}

/** prefix ของแต่ละ category ตาม settings */
export type DocPrefixSettings = {
  orders: string;
  memos: string;
  incoming: string;
  outgoing: string;
  circulars: string;
  track: string;
};

export function categoryPrefix(prefixes: DocPrefixSettings, key: DocCategoryKey): string {
  switch (key) {
    case "ORDERS":
      return prefixes.orders;
    case "MEMOS":
      return prefixes.memos;
    case "INCOMING":
      return prefixes.incoming;
    case "OUTGOING":
      return prefixes.outgoing;
    case "CIRCULARS":
      return prefixes.circulars;
  }
}

/** ฟอร์แมตวันที่ไทยยาว (พ.ศ.) — ใช้ใน UI/CSV */
export function formatThaiDateLong(d: Date): string {
  return d.toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatThaiDateTime(d: Date): string {
  return d.toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
