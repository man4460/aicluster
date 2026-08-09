import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export type StaffDailyPinModule = "drink-pos" | "building-pos" | "hotel-resort" | "football-turf";

export const STAFF_DAILY_UNLOCK_HEADER = "x-staff-daily-unlock";

/** วันตามปฏิทินไทย (Asia/Bangkok) เช่น 2026-08-07 */
export function bangkokCalendarDayKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function normalizeStaffDailyPinInput(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  return s;
}

export function validateStaffDailyPinPlain(pin: string): string | null {
  if (pin.length < 4 || pin.length > 32) return "รหัสต้องยาว 4–32 ตัวอักษร";
  return null;
}

export async function hashStaffDailyPin(pin: string): Promise<string> {
  return hashPassword(pin);
}

export async function verifyStaffDailyPin(
  pin: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash?.trim()) return true;
  return verifyPassword(pin, hash);
}

function unlockHmacKey(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET required for staff daily unlock");
  }
  return secret;
}

export function signStaffDailyUnlock(opts: {
  module: StaffDailyPinModule;
  ownerId: string;
  dayKey?: string;
}): string {
  const dayKey = opts.dayKey ?? bangkokCalendarDayKey();
  const payload = `${opts.module}|${opts.ownerId}|${dayKey}`;
  const sig = createHmac("sha256", unlockHmacKey()).update(payload, "utf8").digest("base64url");
  return `${dayKey}.${sig}`;
}

export function verifyStaffDailyUnlockToken(
  token: string | null | undefined,
  opts: { module: StaffDailyPinModule; ownerId: string },
): boolean {
  const raw = token?.trim() ?? "";
  if (!raw) return false;
  const dot = raw.indexOf(".");
  if (dot <= 0) return false;
  const dayKey = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!dayKey || !sig) return false;
  if (dayKey !== bangkokCalendarDayKey()) return false;
  let expected: string;
  try {
    expected = signStaffDailyUnlock({ module: opts.module, ownerId: opts.ownerId, dayKey });
  } catch {
    return false;
  }
  const expectedSig = expected.slice(expected.indexOf(".") + 1);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function readStaffDailyUnlockFromRequest(req: Request): string | null {
  const header = req.headers.get(STAFF_DAILY_UNLOCK_HEADER)?.trim();
  if (header) return header;
  try {
    const du = new URL(req.url).searchParams.get("du")?.trim();
    return du || null;
  } catch {
    return null;
  }
}

/** null = ผ่าน · NextResponse = ต้องใส่รหัส */
export function assertStaffDailyUnlock(opts: {
  req: Request;
  module: StaffDailyPinModule;
  ownerId: string;
  pinHash: string | null | undefined;
}): NextResponse | null {
  if (!opts.pinHash?.trim()) return null;
  const token = readStaffDailyUnlockFromRequest(opts.req);
  if (verifyStaffDailyUnlockToken(token, { module: opts.module, ownerId: opts.ownerId })) {
    return null;
  }
  return NextResponse.json(
    { error: "ต้องใส่รหัสเข้าใช้งานประจำวัน", code: "STAFF_DAILY_PIN_REQUIRED" },
    { status: 403 },
  );
}

export function staffDailyUnlockStorageKey(module: StaffDailyPinModule, ownerId: string): string {
  return `mawell-staff-daily-unlock:${module}:${ownerId}`;
}

export function readStoredStaffDailyUnlock(
  module: StaffDailyPinModule,
  ownerId: string,
): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(staffDailyUnlockStorageKey(module, ownerId))?.trim();
    if (!raw) return null;
    if (!verifyStaffDailyUnlockTokenClient(raw, module, ownerId)) {
      window.localStorage.removeItem(staffDailyUnlockStorageKey(module, ownerId));
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

/** ตรวจฝั่ง client แบบเบา (วันตรงกัน) — เซิร์ฟเวอร์ยืนยัน HMAC จริง */
function verifyStaffDailyUnlockTokenClient(
  token: string,
  _module: StaffDailyPinModule,
  _ownerId: string,
): boolean {
  const dayKey = token.split(".")[0];
  return Boolean(dayKey && dayKey === bangkokCalendarDayKey());
}

export function storeStaffDailyUnlock(
  module: StaffDailyPinModule,
  ownerId: string,
  token: string,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(staffDailyUnlockStorageKey(module, ownerId), token);
  } catch {
    /* ignore */
  }
}

export function staffDailyUnlockHeaders(
  module: StaffDailyPinModule,
  ownerId: string,
): HeadersInit {
  const token = readStoredStaffDailyUnlock(module, ownerId);
  return token ? { [STAFF_DAILY_UNLOCK_HEADER]: token } : {};
}
