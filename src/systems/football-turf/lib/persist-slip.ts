import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { detectImageKind, extensionForImageKind } from "@/lib/upload/detect-image-kind";
import { buildStoredUploadFileName } from "@/lib/upload/stored-filename";
import { resolveUserUploadSegment } from "@/lib/upload/upload-segments";

const DATA_URL_RE = /^data:(image\/(?:jpeg|jpg|pjpeg|png|x-png|webp|gif));base64,([a-zA-Z0-9+/=\s]+)$/i;

/** แปลง data URL สลิปเป็นไฟล์ใต้ public/uploads/football-turf/{user}/… แล้วคืน path สั้น */
export async function persistFootballTurfSlipUrl(
  ownerUserId: string,
  value: string | null | undefined,
): Promise<string | null> {
  return persistFootballTurfImageUrl(ownerUserId, value, "slip");
}

/** รูปปกสนาม — เก็บ path สั้นใต้ uploads */
export async function persistFootballTurfCourtImageUrl(
  ownerUserId: string,
  value: string | null | undefined,
): Promise<string | null> {
  return persistFootballTurfImageUrl(ownerUserId, value, "court");
}

async function persistFootballTurfImageUrl(
  ownerUserId: string,
  value: string | null | undefined,
  kind: "slip" | "court",
): Promise<string | null> {
  const raw = value?.trim() ?? "";
  if (!raw) return null;
  if (raw.startsWith("/uploads/") || raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.slice(0, 512);
  }

  const match = DATA_URL_RE.exec(raw);
  if (!match) {
    if (raw.length > 512) return null;
    return raw;
  }

  const b64 = match[2].replace(/\s+/g, "");
  const buf = Buffer.from(b64, "base64");
  if (buf.length === 0 || buf.length > 6 * 1024 * 1024) {
    throw new Error(kind === "court" ? "รูปสนามใหญ่เกินหรือว่าง" : "สลิปใหญ่เกินหรือว่าง");
  }

  const detected = detectImageKind(buf);
  const ext =
    detected === "png" || detected === "webp" || detected === "gif" || detected === "jpeg"
      ? extensionForImageKind(detected)
      : "jpg";

  const userSeg = resolveUserUploadSegment(ownerUserId);
  const filename = buildStoredUploadFileName({
    moduleSlug: "football-turf",
    ownerUserId,
    ext,
    kind,
  });
  const dir = path.join(process.cwd(), "public", "uploads", "football-turf", userSeg);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buf);
  return `/uploads/football-turf/${userSeg}/${filename}`;
}
