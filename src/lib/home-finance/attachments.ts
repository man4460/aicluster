/** จำนวนไฟล์แนบสูงสุดต่อรายการรายรับ–รายจ่าย */
export const MAX_HOME_FINANCE_ATTACHMENTS = 20;

const LEGACY_HOME_FINANCE_SLIP_PREFIX = "/uploads/home-finance-mawell/";

function rewriteLegacyHomeFinancePath(path: string): string {
  if (!path.startsWith(LEGACY_HOME_FINANCE_SLIP_PREFIX)) return path;
  return `/uploads/home-finance/${path.slice(LEGACY_HOME_FINANCE_SLIP_PREFIX.length)}`;
}

/**
 * สำหรับ `src` / `href` ของรูปใต้ `/uploads/` — เข้ารหัสทีละ segment กันโหลดไม่ขึ้นเมื่อชื่อไฟล์มีไทย/ช่องว่าง
 * (เก็บ path ใน DB แบบ UTF-8 ธรรมดาได้ — แปลงตอนแสดงผลเท่านั้น)
 */
export function encodeHomeFinancePublicAssetHref(path: string): string {
  const raw = path.trim();
  if (!raw.startsWith("/uploads/")) return raw;
  const q = raw.indexOf("?");
  const pathOnly = q >= 0 ? raw.slice(0, q) : raw;
  const query = q >= 0 ? raw.slice(q) : "";
  const segments = pathOnly.split("/").map((seg) => {
    if (!seg) return "";
    try {
      return encodeURIComponent(decodeURIComponent(seg));
    } catch {
      return encodeURIComponent(seg);
    }
  });
  return segments.join("/") + query;
}

/**
 * แปลงค่าที่เก็บ/ส่งมา (path `/uploads/...` หรือ URL เต็ม) เป็น path มาตรฐานเดียวกัน
 * กันที่รายการไม่แสดงเพราะ client หรือ proxy เก็บเป็น https://host/uploads/...
 */
export function normalizeHomeFinanceStoredPath(raw: string): string | null {
  let s = raw.trim();
  if (!s || s.includes("..")) return null;
  s = rewriteLegacyHomeFinancePath(s);
  if (s.length > 512) return null;
  if (s.startsWith("/uploads/home-finance/")) return s;
  try {
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s);
      let p = rewriteLegacyHomeFinancePath(u.pathname);
      if (p.startsWith("/uploads/home-finance/") && !p.includes("..") && p.length <= 512) {
        return p;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function isAllowedHomeFinanceUploadPath(url: string): boolean {
  return normalizeHomeFinanceStoredPath(url) != null;
}

/** ก่อนบันทึกลง DB — เก็บเป็น path เริ่ม `/uploads/home-finance/` เสมอ */
export function canonicalizeHomeFinanceAttachmentList(urls: string[]): string[] {
  const out: string[] = [];
  for (const u of urls) {
    const c = normalizeHomeFinanceStoredPath(u);
    if (c) out.push(c);
    if (out.length >= MAX_HOME_FINANCE_ATTACHMENTS) break;
  }
  return out;
}

/** รวม JSON กับคอลัมน์ slip เดิม */
export function normalizeHomeFinanceAttachmentUrls(row: {
  attachmentUrls: unknown;
  slipImageUrl: string | null;
}): string[] {
  const raw = row.attachmentUrls;
  if (Array.isArray(raw)) {
    const out = raw
      .filter((x): x is string => typeof x === "string")
      .map((x) => normalizeHomeFinanceStoredPath(x))
      .filter((x): x is string => x != null);
    if (out.length > 0) return out.slice(0, MAX_HOME_FINANCE_ATTACHMENTS);
  }
  const slip = row.slipImageUrl ? normalizeHomeFinanceStoredPath(row.slipImageUrl) : null;
  if (slip) return [slip];
  return [];
}

export function isHomeFinancePdfUrl(url: string): boolean {
  return /\.pdf(\?.*)?$/i.test(url.trim());
}

/** แปลงค่า Json จาก Prisma/MySQL ให้เป็น array (บางครั้งได้สตริง JSON ซ้อน) */
function coalesceJsonStringArray(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return null;
    try {
      const p = JSON.parse(t) as unknown;
      return Array.isArray(p) ? p : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** เอกสารแนบโปรไฟล์รถ (คอลัมน์ JSON) */
export function normalizeVehicleAttachmentUrls(row: { attachmentUrls: unknown }): string[] {
  const arr = coalesceJsonStringArray(row.attachmentUrls);
  if (!arr) return [];
  const out = arr
    .filter((x): x is string => typeof x === "string")
    .map((x) => normalizeHomeFinanceStoredPath(x))
    .filter((x): x is string => x != null);
  return out.slice(0, MAX_HOME_FINANCE_ATTACHMENTS);
}
