import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { SITE_SETTING_DEFAULT_ID } from "@/lib/landing/site-setting";
import { prisma } from "@/lib/prisma";

export function normalizeAdminTopUpPin(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  return s.length > 0 ? s : null;
}

export function validateAdminTopUpPinPlain(pin: string): string | null {
  if (pin.length < 4 || pin.length > 64) {
    return "รหัสต้องยาว 4–64 ตัวอักษร";
  }
  return null;
}

export async function getAdminTokenTopUpPinHash(): Promise<string | null> {
  const row = await prisma.siteSetting.findUnique({
    where: { id: SITE_SETTING_DEFAULT_ID },
    select: { adminTokenTopUpPinHash: true },
  });
  return row?.adminTokenTopUpPinHash?.trim() || null;
}

export async function isAdminTokenTopUpPinConfigured(): Promise<boolean> {
  return Boolean(await getAdminTokenTopUpPinHash());
}

export async function setAdminTokenTopUpPin(plain: string): Promise<void> {
  const err = validateAdminTopUpPinPlain(plain);
  if (err) throw new Error(err);
  const hash = await hashPassword(plain);
  await prisma.siteSetting.upsert({
    where: { id: SITE_SETTING_DEFAULT_ID },
    create: {
      id: SITE_SETTING_DEFAULT_ID,
      adminTokenTopUpPinHash: hash,
    },
    update: { adminTokenTopUpPinHash: hash },
  });
}

/**
 * ตรวจรหัสก่อนเติม/ปรับโทเคนโดยแอดมิน
 * — ต้องตั้งรหัสไว้แล้ว และรหัสที่ส่งต้องตรง
 */
export async function assertAdminTopUpPin(
  rawPin: unknown,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const hash = await getAdminTokenTopUpPinHash();
  if (!hash) {
    return {
      ok: false,
      status: 400,
      error: "ยังไม่ได้ตั้งรหัสเติมโทเคน — ไปตั้งที่หน้าผู้ใช้ (ศูนย์แอดมิน) ก่อน",
    };
  }
  const pin = normalizeAdminTopUpPin(rawPin);
  if (!pin) {
    return { ok: false, status: 400, error: "กรุณาใส่รหัสเติมโทเคน" };
  }
  const match = await verifyPassword(pin, hash);
  if (!match) {
    return { ok: false, status: 403, error: "รหัสเติมโทเคนไม่ถูกต้อง" };
  }
  return { ok: true };
}
