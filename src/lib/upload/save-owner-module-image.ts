import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { detectImageKind, extensionForImageKind } from "@/lib/upload/detect-image-kind";

const MAX_BYTES = 6 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/x-png",
  "image/webp",
  "image/gif",
  "application/octet-stream",
]);

const HEIC_HINT_TH =
  "รูป HEIC/HEIF ยังไม่รองรับ — ตั้ง iPhone: การตั้งค่า > กล้อง > รูปแบบ เป็น “ความเข้ากันได้ดีที่สุด” (JPG)";

export async function saveOwnerModuleUploadImage(
  file: File,
  moduleSlug: string,
  subdir: string,
  ownerUserId: string,
): Promise<{ ok: true; imageUrl: string } | { ok: false; error: string; status: number }> {
  let buf: Buffer;
  try {
    buf = Buffer.from(await file.arrayBuffer());
  } catch {
    return { ok: false, error: "อ่านไฟล์ไม่สำเร็จ", status: 400 };
  }
  if (buf.length === 0) return { ok: false, error: "ไฟล์ว่าง", status: 400 };
  if (buf.length > MAX_BYTES) {
    return { ok: false, error: "ไฟล์ใหญ่เกิน 6MB", status: 400 };
  }

  const detected = detectImageKind(buf);
  if (detected === "heic") {
    return { ok: false, error: HEIC_HINT_TH, status: 400 };
  }

  const rawType = (file.type || "").trim().toLowerCase();
  let ext: string;
  if (detected === "jpeg" || detected === "png" || detected === "gif" || detected === "webp") {
    ext = extensionForImageKind(detected);
  } else if (ALLOWED_MIME.has(rawType)) {
    ext =
      rawType === "image/png" || rawType === "image/x-png"
        ? "png"
        : rawType === "image/webp"
          ? "webp"
          : rawType === "image/gif"
            ? "gif"
            : "jpg";
  } else {
    return { ok: false, error: "รองรับ JPG PNG WEBP GIF", status: 400 };
  }

  const moduleSeg = moduleSlug.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 48) || "module";
  const ownerSeg = ownerUserId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) || "owner";
  const dir = path.join(process.cwd(), "public", "uploads", moduleSeg, subdir, ownerSeg);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buf);
  } catch (e) {
    console.error(`[upload/${moduleSlug}]`, e);
    return { ok: false, error: "บันทึกไฟล์ไม่สำเร็จ", status: 500 };
  }

  return { ok: true, imageUrl: `/uploads/${moduleSeg}/${subdir}/${ownerSeg}/${filename}` };
}
