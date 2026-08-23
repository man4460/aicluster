import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertOwnerPlanUpload, type PlanUploadKind } from "@/lib/modules/plan-entitlements";
import { detectImageKind, extensionForImageKind } from "@/lib/upload/detect-image-kind";
import { normalizeUploadDisplayName } from "@/lib/upload/display-name";
import { buildStoredUploadFileName } from "@/lib/upload/stored-filename";
import { resolveModuleUploadSegment, resolveUserUploadSegment } from "@/lib/upload/upload-segments";

const HEIC_HINT_TH =
  "รูป HEIC/HEIF ยังไม่รองรับ — ตั้ง iPhone: การตั้งค่า > กล้อง > รูปแบบ เป็น “ความเข้ากันได้ดีที่สุด” (JPG)";

export const UPLOAD_MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const UPLOAD_MAX_PDF_BYTES = 12 * 1024 * 1024;

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/x-png",
  "image/webp",
  "image/gif",
  "application/octet-stream",
]);

export type ModuleUploadKind = "image" | "pdf" | "image-or-pdf";

export type SaveModuleUploadInput = {
  file: File;
  moduleSlug: string;
  ownerUserId: string;
  /** image | pdf | image-or-pdf */
  accept: ModuleUploadKind;
  /** โฟลเดอร์ย่อย — ใช้เป็น kind ในชื่อไฟล์เท่านั้น (พาธจริงเป็น module/user/file) */
  subdir?: string;
  /** แทรกในชื่อไฟล์บนดิสก์ เช่น slip / logos */
  kind?: string;
  /** ชื่อที่แสดง — ผู้ใช้ตั้งเอง (ถ้าไม่ส่ง คืนค่าว่าง ให้ client ถาม) */
  displayName?: string | null;
  maxImageBytes?: number;
  maxPdfBytes?: number;
  /**
   * ข้ามเกตแพ็กเกจ (โลโก้ / รูปโปรไฟล์ ฯลฯ)
   * ค่าเริ่มต้น: อนุมานจาก kind — slip → สลิป · doc/attach → เอกสาร
   */
  skipPlanGate?: boolean;
  /** บังคับชนิดเกตแพ็กเกจ */
  planGate?: PlanUploadKind;
};

function resolvePlanUploadGate(input: SaveModuleUploadInput): PlanUploadKind | null {
  if (input.skipPlanGate) return null;
  if (input.planGate) return input.planGate;
  const k = (input.kind || input.subdir || "").trim().toLowerCase();
  if (!k) return null;
  if (k.includes("logo") || k === "image" || k === "avatar" || k === "poster") return null;
  if (k.includes("slip") || k === "receipt") return "slip";
  if (k === "doc" || k.includes("document") || k === "attach" || k === "pdf") return "document";
  return null;
}

export type SaveModuleUploadSuccess = {
  ok: true;
  /** พาธสาธารณะ เช่น /uploads/drink-pos/userxxx/drink-pos-userxxx-….jpg */
  fileUrl: string;
  /** ชื่อไฟล์บนดิสก์ */
  storedFileName: string;
  /** ชื่อที่แสดง (ว่างได้ — ให้ UI ให้ผู้ใช้ตั้ง) */
  displayName: string;
  mimeType: string;
  fileSize: number;
  /** alias เข้ากันกับ API เดิมที่คืน imageUrl */
  imageUrl: string;
};

export type SaveModuleUploadFailure = {
  ok: false;
  error: string;
  status: number;
};

function isPdfBuffer(buf: Buffer): boolean {
  return buf.length >= 5 && buf.toString("ascii", 0, 5) === "%PDF-";
}

function resolveImageExt(buf: Buffer, rawType: string): { ext: string; mimeType: string } | { error: string } {
  const detected = detectImageKind(buf);
  if (detected === "heic") return { error: HEIC_HINT_TH };
  if (detected === "jpeg" || detected === "png" || detected === "gif" || detected === "webp") {
    const ext = extensionForImageKind(detected);
    const mimeType =
      ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/jpeg";
    return { ext, mimeType };
  }
  if (ALLOWED_IMAGE_MIME.has(rawType)) {
    const ext =
      rawType === "image/png" || rawType === "image/x-png"
        ? "png"
        : rawType === "image/webp"
          ? "webp"
          : rawType === "image/gif"
            ? "gif"
            : "jpg";
    const mimeType =
      ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/jpeg";
    return { ext, mimeType };
  }
  return { error: "รองรับ JPG PNG WEBP GIF" };
}

/**
 * บันทึกไฟล์อัปโหลดมาตรฐานกลาง:
 * พาธ `/uploads/{module}/{user}/{module}-{user}-[{kind}-]{ts}-{rand}.{ext}`
 * ชื่อแสดงแยกจากชื่อบนดิสก์
 */
export async function saveModuleUpload(
  input: SaveModuleUploadInput,
): Promise<SaveModuleUploadSuccess | SaveModuleUploadFailure> {
  const planGate = resolvePlanUploadGate(input);
  if (planGate) {
    const gate = await assertOwnerPlanUpload(input.ownerUserId, planGate, input.moduleSlug);
    if (!gate.ok) {
      return { ok: false, error: gate.error, status: 402 };
    }
  }

  const maxImage = input.maxImageBytes ?? UPLOAD_MAX_IMAGE_BYTES;
  const maxPdf = input.maxPdfBytes ?? UPLOAD_MAX_PDF_BYTES;

  let buf: Buffer;
  try {
    buf = Buffer.from(await input.file.arrayBuffer());
  } catch {
    return { ok: false, error: "อ่านไฟล์ไม่สำเร็จ", status: 400 };
  }
  if (buf.length === 0) return { ok: false, error: "ไฟล์ว่าง", status: 400 };

  const rawType = (input.file.type || "").trim().toLowerCase();
  const looksPdf = rawType === "application/pdf" || isPdfBuffer(buf);

  let ext: string;
  let mimeType: string;
  let maxBytes: number;

  if (looksPdf) {
    if (input.accept === "image") {
      return { ok: false, error: "รองรับเฉพาะไฟล์รูป", status: 400 };
    }
    if (!isPdfBuffer(buf)) {
      return { ok: false, error: "ไฟล์ PDF ไม่ถูกต้อง", status: 400 };
    }
    ext = "pdf";
    mimeType = "application/pdf";
    maxBytes = maxPdf;
  } else {
    if (input.accept === "pdf") {
      return { ok: false, error: "รองรับเฉพาะไฟล์ PDF", status: 400 };
    }
    const resolved = resolveImageExt(buf, rawType);
    if ("error" in resolved) {
      return { ok: false, error: resolved.error, status: 400 };
    }
    ext = resolved.ext;
    mimeType = resolved.mimeType;
    maxBytes = maxImage;
  }

  if (buf.length > maxBytes) {
    const mb = (maxBytes / 1024 / 1024).toFixed(0);
    return {
      ok: false,
      error: looksPdf ? `PDF ใหญ่เกิน ${mb}MB` : `ไฟล์ใหญ่เกิน ${mb}MB`,
      status: 400,
    };
  }

  const moduleSeg = resolveModuleUploadSegment(input.moduleSlug);
  const userSeg = resolveUserUploadSegment(input.ownerUserId);
  const kind = input.kind || input.subdir || undefined;
  const storedFileName = buildStoredUploadFileName({
    moduleSlug: input.moduleSlug,
    ownerUserId: input.ownerUserId,
    ext,
    kind,
  });

  /** พาธมาตรฐาน: /uploads/{module}/{user}/{module}-{user}-[{kind}-]{ts}-{rand}.{ext} */
  const dir = path.join(process.cwd(), "public", "uploads", moduleSeg, userSeg);

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, storedFileName), buf);
  } catch (e) {
    console.error(`[upload/${moduleSeg}]`, e);
    return { ok: false, error: "บันทึกไฟล์ไม่สำเร็จ", status: 500 };
  }

  const fileUrl = `/uploads/${moduleSeg}/${userSeg}/${storedFileName}`;

  const displayName = normalizeUploadDisplayName(input.displayName);

  return {
    ok: true,
    fileUrl,
    storedFileName,
    displayName,
    mimeType,
    fileSize: buf.length,
    imageUrl: fileUrl,
  };
}
