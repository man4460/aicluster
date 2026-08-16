import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const DEVICE_KEY_PREFIX = "att_dev_";

export type AttendanceDeviceAuth = {
  ownerUserId: string;
  trialSessionId: string;
};

function sha256Hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

/**
 * รูปแบบคีย์: `att_dev_<keyId16>_<secret>`
 * — keyId เก็บใน `deviceApiKeyHint` สำหรับค้นหาเร็ว
 */
export async function generateAttendanceDeviceApiKey(): Promise<{
  plainKey: string;
  hash: string;
  keyId: string;
}> {
  const keyId = randomBytes(8).toString("hex");
  const secret = randomBytes(18).toString("base64url");
  const plainKey = `${DEVICE_KEY_PREFIX}${keyId}_${secret}`;
  const hash = await bcrypt.hash(sha256Hex(plainKey), 10);
  return { plainKey, hash, keyId };
}

export function extractAttendanceDeviceApiKey(req: Request): string | null {
  const h = req.headers.get("authorization")?.trim() ?? "";
  if (h.toLowerCase().startsWith("bearer ")) {
    const t = h.slice(7).trim();
    if (t.length > 0) return t;
  }
  const x = req.headers.get("x-attendance-device-key")?.trim() ?? "";
  return x.length > 0 ? x : null;
}

function parseKeyId(plain: string): string | null {
  if (!plain.startsWith(DEVICE_KEY_PREFIX)) return null;
  const rest = plain.slice(DEVICE_KEY_PREFIX.length);
  const und = rest.indexOf("_");
  if (und < 8) return null;
  const keyId = rest.slice(0, und);
  if (!/^[a-f0-9]{16}$/i.test(keyId)) return null;
  return keyId.toLowerCase();
}

/**
 * Header: `Authorization: Bearer att_dev_…` หรือ `X-Attendance-Device-Key: att_dev_…`
 */
export async function requireAttendanceDeviceAuth(
  req: Request,
): Promise<{ ok: true; auth: AttendanceDeviceAuth } | { ok: false; status: number; error: string }> {
  const plain = extractAttendanceDeviceApiKey(req);
  if (!plain) {
    return { ok: false, status: 401, error: "ต้องส่ง Device API Key" };
  }
  const keyId = parseKeyId(plain);
  if (!keyId) {
    return { ok: false, status: 401, error: "รูปแบบ Device API Key ไม่ถูกต้อง" };
  }

  const row = await prisma.attendanceSettings.findFirst({
    where: {
      deviceApiEnabled: true,
      deviceApiKeyHint: keyId,
      deviceApiKeyHash: { not: null },
    },
    select: {
      ownerUserId: true,
      trialSessionId: true,
      deviceApiKeyHash: true,
    },
  });
  if (!row?.deviceApiKeyHash) {
    return { ok: false, status: 401, error: "Device API Key ไม่ถูกต้องหรือยังไม่เปิดใช้" };
  }

  const match = await bcrypt.compare(sha256Hex(plain), row.deviceApiKeyHash);
  if (!match) {
    return { ok: false, status: 401, error: "Device API Key ไม่ถูกต้องหรือยังไม่เปิดใช้" };
  }

  return {
    ok: true,
    auth: { ownerUserId: row.ownerUserId, trialSessionId: row.trialSessionId },
  };
}
