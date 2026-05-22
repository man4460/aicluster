import { randomBytes } from "crypto";

export function generateLoyaltyMemberQrToken(): string {
  return randomBytes(24).toString("hex");
}

export function normalizeMemberPhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

/** พร้อมค้นหา: เบอร์ 9–10 หลัก หรือ 4 หลักท้าย */
export function isLoyaltyPhoneSearchReady(raw: string): boolean {
  const n = normalizeMemberPhone(raw).length;
  return n === 4 || (n >= 9 && n <= 10);
}

export type LoyaltyPhoneQuery =
  | { kind: "full"; phone: string }
  | { kind: "suffix4"; suffix: string };

export function parseLoyaltyPhoneQuery(raw: string): LoyaltyPhoneQuery | { error: string } {
  const digits = normalizeMemberPhone(raw);
  if (digits.length === 4) return { kind: "suffix4", suffix: digits };
  if (digits.length >= 9 && digits.length <= 10) return { kind: "full", phone: digits };
  if (digits.length < 4) {
    return { error: "กรอกเบอร์ 10 หลัก หรือ 4 หลักท้าย" };
  }
  return { error: "กรอกเบอร์ 10 หลัก หรือ 4 หลักท้าย" };
}

/** Payload ใน QR ลูกค้า — ร้านสแกนหรือวางรหัส */
export function loyaltyMemberQrPayload(memberId: number, qrToken: string): string {
  return `LS:${memberId}:${qrToken}`;
}

/** ทำความสะอาดข้อความที่สแกน/วางจาก QR */
export function normalizeLoyaltyQrPaste(raw: string): string {
  return raw
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, "");
}

export function parseLoyaltyMemberQrPayload(
  raw: string,
): { memberId: number; qrToken: string } | null {
  const t = normalizeLoyaltyQrPaste(raw);
  if (!t) return null;

  const inline = /LS:(\d+):([a-f0-9]{8,128})/i.exec(t);
  if (inline) {
    return { memberId: Number(inline[1]), qrToken: inline[2]!.toLowerCase() };
  }

  const mMatch = /(?:^|[?&])m=(\d+)/i.exec(t);
  const kMatch = /(?:^|[?&])k=([a-f0-9]{8,128})/i.exec(t);
  if (mMatch && kMatch) {
    try {
      return {
        memberId: Number(mMatch[1]),
        qrToken: decodeURIComponent(kMatch[1]!).toLowerCase(),
      };
    } catch {
      return { memberId: Number(mMatch[1]), qrToken: kMatch[1]!.toLowerCase() };
    }
  }

  try {
    const urlStr = t.startsWith("http")
      ? t
      : t.startsWith("/")
        ? `https://local${t}`
        : `https://local/${t}`;
    const url = new URL(urlStr);
    const m = url.searchParams.get("m");
    const k = url.searchParams.get("k");
    if (m && k && /^\d+$/.test(m) && /^[a-f0-9]{8,128}$/i.test(k)) {
      return { memberId: Number(m), qrToken: k.toLowerCase() };
    }
  } catch {
    /* not a URL */
  }

  return null;
}

export function loyaltyMemberScanPath(memberId: number, qrToken: string): string {
  return `/loyalty-stamp/scan?m=${memberId}&k=${encodeURIComponent(qrToken)}`;
}
