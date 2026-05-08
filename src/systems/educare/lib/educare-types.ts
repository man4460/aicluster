import type {
  EducareCheckFeature,
  EducareCheckStatus,
} from "@/generated/prisma/enums";

export type EducareFeatureKey =
  | "ASSEMBLY"
  | "TIDINESS"
  | "CLASS_ATTENDANCE"
  | "MEAL"
  | "BRUSHING"
  | "MILK";

export type EducareFeatureMeta = {
  key: EducareFeatureKey;
  prismaKey: EducareCheckFeature;
  label: string;
  short: string;
  emoji: string;
  defaultTime: string;
  /** สีโทนการ์ด/ไอคอน — ใช้กับ Tailwind สี neutral ของแม่แบบ */
  accent: "violet" | "rose" | "sky" | "amber" | "emerald" | "indigo";
};

export const EDUCARE_FEATURES: readonly EducareFeatureMeta[] = [
  {
    key: "ASSEMBLY",
    prismaKey: "ASSEMBLY",
    label: "เช็คเข้าแถว",
    short: "เข้าแถว",
    emoji: "🙋",
    defaultTime: "08:00",
    accent: "emerald",
  },
  {
    key: "TIDINESS",
    prismaKey: "TIDINESS",
    label: "ความเรียบร้อย",
    short: "เรียบร้อย",
    emoji: "✨",
    defaultTime: "08:15",
    accent: "violet",
  },
  {
    key: "CLASS_ATTENDANCE",
    prismaKey: "CLASS_ATTENDANCE",
    label: "เช็คเข้าเรียน",
    short: "เข้าเรียน",
    emoji: "📚",
    defaultTime: "รายวัน",
    accent: "sky",
  },
  {
    key: "MILK",
    prismaKey: "MILK",
    label: "เช็คดื่มนม",
    short: "ดื่มนม",
    emoji: "🥛",
    defaultTime: "09:30",
    accent: "indigo",
  },
  {
    key: "MEAL",
    prismaKey: "MEAL",
    label: "เช็คทานอาหาร",
    short: "อาหาร",
    emoji: "🍱",
    defaultTime: "11:30",
    accent: "amber",
  },
  {
    key: "BRUSHING",
    prismaKey: "BRUSHING",
    label: "เช็คแปรงฟัน",
    short: "แปรงฟัน",
    emoji: "🪥",
    defaultTime: "12:30",
    accent: "rose",
  },
] as const;

export function featureMeta(feature: EducareFeatureKey): EducareFeatureMeta {
  return EDUCARE_FEATURES.find((f) => f.key === feature) ?? EDUCARE_FEATURES[0];
}

/** ค่าสถานะที่ valid ตามฟีเจอร์ — ใช้คุม UI + validate API */
export const EDUCARE_FEATURE_STATUS: Record<EducareFeatureKey, readonly EducareCheckStatus[]> = {
  ASSEMBLY: ["PRESENT", "ABSENT"],
  CLASS_ATTENDANCE: ["PRESENT", "LATE", "ABSENT", "EXCUSED"],
  TIDINESS: ["PASS", "FAIL", "NA"],
  MEAL: ["DONE", "PARTIAL", "NOT_DONE", "NA"],
  BRUSHING: ["DONE", "PARTIAL", "NOT_DONE", "NA"],
  MILK: ["DONE", "PARTIAL", "NOT_DONE", "NA"],
};

export function isValidStatusForFeature(
  feature: EducareFeatureKey,
  status: EducareCheckStatus,
): boolean {
  return EDUCARE_FEATURE_STATUS[feature].includes(status);
}

export type EducareStatusToneKey =
  | "positive"
  | "neutral"
  | "warning"
  | "danger"
  | "muted";

export const EDUCARE_STATUS_LABEL: Record<EducareCheckStatus, string> = {
  PRESENT: "มาเรียน",
  LATE: "มาสาย",
  ABSENT: "ขาด",
  EXCUSED: "ลา",
  PASS: "ผ่าน",
  FAIL: "ไม่ผ่าน",
  DONE: "ทำแล้ว",
  PARTIAL: "ทำบางส่วน",
  NOT_DONE: "ยังไม่ได้ทำ",
  NA: "ไม่เกี่ยวข้อง",
};

export const EDUCARE_STATUS_TONE: Record<EducareCheckStatus, EducareStatusToneKey> = {
  PRESENT: "positive",
  DONE: "positive",
  PASS: "positive",
  LATE: "warning",
  PARTIAL: "warning",
  ABSENT: "danger",
  FAIL: "danger",
  NOT_DONE: "danger",
  EXCUSED: "neutral",
  NA: "muted",
};

export const EDUCARE_DEFAULT_STATUS: Record<EducareFeatureKey, EducareCheckStatus> = {
  ASSEMBLY: "PRESENT",
  CLASS_ATTENDANCE: "PRESENT",
  TIDINESS: "PASS",
  MEAL: "DONE",
  BRUSHING: "DONE",
  MILK: "DONE",
};

/** YYYY-MM-DD (เวลาไทย) จาก Date object */
export function toBangkokYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** แปลง YYYY-MM-DD → Date 00:00 UTC (ใช้กับฟิลด์ DATE ของ MySQL) */
export function ymdToDateUTC(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map((s) => Number(s));
  return new Date(Date.UTC(y, m - 1, d));
}
