import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/**
 * เข้ารหัสรหัสผ่านที่จัดเก็บใน DB ของโมดูลคลังรหัสผ่าน
 * - AES-256-GCM
 * - key มาจาก SHA-256(AUTH_SECRET) — domain-separated ด้วย "vault:" prefix เพื่อไม่ให้ key ชนกับ staff-token-cipher
 * - layout: base64url(iv ‖ tag ‖ ciphertext)
 */

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;

function cipherKey(): Buffer {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET required for vault password encryption");
  }
  return createHash("sha256").update(`vault:${secret}`, "utf8").digest();
}

export function encryptVaultPassword(plain: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, cipherKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptVaultPassword(blob: string): string | null {
  try {
    const buf = Buffer.from(blob, "base64url");
    if (buf.length < IV_LEN + AUTH_TAG_LEN + 1) return null;
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN);
    const data = buf.subarray(IV_LEN + AUTH_TAG_LEN);
    const decipher = createDecipheriv(ALGO, cipherKey(), iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}

/** mask แบบไม่หลุดข้อมูล — แสดงเฉพาะความยาวโดยประมาณ */
export function maskedPasswordPlaceholder(): string {
  return "•".repeat(10);
}
