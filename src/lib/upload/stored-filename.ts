import { randomBytes } from "node:crypto";
import { resolveModuleUploadSegment, resolveUserUploadSegment } from "@/lib/upload/upload-segments";

/**
 * ชื่อไฟล์บนดิสก์ — รูปแบบเดียวกันทั้งระบบ:
 * `{module}-{user}-{timestamp}-{rand}.{ext}`
 *
 * ชื่อที่แสดงให้ผู้ใช้ (displayName) แยกเก็บใน DB — ไม่ใช้ชื่อนี้
 */
export function buildStoredUploadFileName(input: {
  moduleSlug: string;
  ownerUserId: string;
  ext: string;
  /** ถ้ามี จะแทรกก่อน timestamp เช่น slip / logo */
  kind?: string;
}): string {
  const moduleSeg = resolveModuleUploadSegment(input.moduleSlug);
  const userSeg = resolveUserUploadSegment(input.ownerUserId);
  const ext = (input.ext || "bin").replace(/^\./, "").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const kind = input.kind ? resolveModuleUploadSegment(input.kind).slice(0, 16) : "";
  const rand = randomBytes(4).toString("hex");
  const ts = Date.now();
  return kind
    ? `${moduleSeg}-${userSeg}-${kind}-${ts}-${rand}.${ext}`
    : `${moduleSeg}-${userSeg}-${ts}-${rand}.${ext}`;
}
