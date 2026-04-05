import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function generatePlainStaffToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashStaffToken(plain: string): string {
  return createHash("sha256").update(plain, "utf8").digest("hex");
}

export function verifyStaffToken(plain: string, storedHash: string): boolean {
  const computed = hashStaffToken(plain);
  try {
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(storedHash, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
