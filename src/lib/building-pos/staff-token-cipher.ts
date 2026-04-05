import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 16;
const AUTH_TAG_LEN = 16;

function cipherKey(): Buffer {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET required for staff link encryption");
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

/** เก็บในฐานข้อมูล — เจ้าของร้านถอดรหัสได้เพื่อแสดงลิงก์/QR ค้าง (ยังยืนยันด้วย token_hash ตอนล็อกอินพนักงาน) */
export function encryptStaffTokenForStorage(plain: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, cipherKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptStaffTokenFromStorage(cipherBlob: string): string | null {
  try {
    const buf = Buffer.from(cipherBlob, "base64url");
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
