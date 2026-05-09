import crypto from "crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildDocNumber,
  buildTrackingCode,
  categoryPrefix,
  type DocCategoryKey,
  type DocPrefixSettings,
} from "@/systems/doc-transmission/lib/doc-types";

/** โหลด/สร้าง settings ต่อ owner+scope */
export async function getOrCreateDocSettings(ownerUserId: string, trialSessionId: string) {
  return prisma.docTransmissionSettings.upsert({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    update: {},
    create: { ownerUserId, trialSessionId },
  });
}

/** ดึง prefix settings เป็น object รวม */
export function pickPrefixes(setting: {
  ordersPrefix: string;
  memosPrefix: string;
  incomingPrefix: string;
  outgoingPrefix: string;
  circularsPrefix: string;
  trackPrefix: string;
}): DocPrefixSettings {
  return {
    orders: setting.ordersPrefix,
    memos: setting.memosPrefix,
    incoming: setting.incomingPrefix,
    outgoing: setting.outgoingPrefix,
    circulars: setting.circularsPrefix,
    track: setting.trackPrefix,
  };
}

/** หา running seq ถัดไป สำหรับ category+year ของ owner+scope (ไม่ใช่ atomic — ใช้ใน transaction) */
export async function nextRunningSeq(
  tx: Prisma.TransactionClient,
  args: { ownerUserId: string; trialSessionId: string; category: DocCategoryKey; academicYear: string },
): Promise<number> {
  const last = await tx.docTransmissionRecord.findFirst({
    where: {
      ownerUserId: args.ownerUserId,
      trialSessionId: args.trialSessionId,
      category: args.category,
      academicYear: args.academicYear,
    },
    orderBy: { runningSeq: "desc" },
    select: { runningSeq: true },
  });
  return (last?.runningSeq ?? 0) + 1;
}

/** สร้าง tracking code ที่ unique ในขอบเขต owner+scope (retry ถ้าชน) */
export async function generateUniqueTrackingCode(
  tx: Prisma.TransactionClient,
  args: { ownerUserId: string; trialSessionId: string; trackPrefix: string; category: DocCategoryKey; seq: number },
): Promise<string> {
  for (let i = 0; i < 6; i += 1) {
    const code = buildTrackingCode(args.trackPrefix, args.category, args.seq + i * 7);
    const exists = await tx.docTransmissionRecord.findFirst({
      where: { ownerUserId: args.ownerUserId, trialSessionId: args.trialSessionId, trackingCode: code },
      select: { id: true },
    });
    if (!exists) return code;
  }
  // fallback: ผูก timestamp+random
  return `${args.trackPrefix.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
}

/** สร้าง doc number — รับ override ได้ ถ้าไม่ส่งจะ auto จาก prefix+year+seq */
export function resolveDocNumber(args: {
  prefix: string;
  year: string;
  seq: number;
  override?: string | null;
}): string {
  const trimmed = args.override?.trim();
  if (trimmed && trimmed.length > 0) return trimmed.slice(0, 60);
  return buildDocNumber(args.prefix, args.year, args.seq);
}

/** prefix ตาม category */
export function prefixForCategory(setting: DocPrefixSettings, category: DocCategoryKey): string {
  return categoryPrefix(setting, category);
}

/** สร้าง public share token (URL-safe, 32 chars) */
export function generateShareToken(): string {
  return crypto.randomBytes(24).toString("base64url").slice(0, 32);
}
