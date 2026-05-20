import { randomBytes } from "node:crypto";

/** รหัสอ้างอิงออเดอร์ต่อร้าน — EC-YYYYMMDD-XXXX */
export function generateEcommerceReferenceCode(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `EC-${y}${m}${d}-${suffix}`;
}

/** รหัสติดตามสาธารณะสำหรับผู้ซื้อ */
export function generateEcommerceTrackingCode(): string {
  return randomBytes(6).toString("base64url").slice(0, 10).toUpperCase();
}
