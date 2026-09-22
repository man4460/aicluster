import { randomBytes } from "crypto";

/** สร้าง slug จากชื่อ (ภาษาไทย/อังกฤษ) — ว่างแล้วใช้ random */
export function smartGuardTourSlugify(name: string, fallbackPrefix = "cp"): string {
  const base = name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ก-๙]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  if (base.length >= 2) return base;
  return `${fallbackPrefix}-${randomBytes(3).toString("hex")}`;
}

export function smartGuardTourNewQrToken(): string {
  return `sgt-${randomBytes(16).toString("hex")}`;
}

export function parseOptionalDecimal(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return null;
  return n;
}
