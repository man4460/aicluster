/**
 * Static-file route สำหรับ bucket ที่จัดเก็บแยกตามโฟลเดอร์ย่อย (เช่นแยก per-user)
 *   /uploads/<bucket>/<subdir>/<filename>
 *
 * - validate ทั้ง 3 segment เป็น ASCII/Unicode-safe (กัน path traversal, control char ฯลฯ)
 * - bucket ต้องอยู่ใน ALLOWED_BUCKETS เดียวกับ route /uploads/<bucket>/<filename>
 * - filename ต้องมี extension ที่รู้จัก (รูป/PDF)
 */
import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const ALLOWED_BUCKETS = new Set([
  "attendance-faces",
  "attendance-roster",
  "avatars",
  "barber-cash-receipts",
  "barber-portal-slips",
  "barber-stylists",
  "building-pos",
  "car-wash",
  "dorm-cost-slips",
  "dorm-logos",
  "dorm-payment-proofs",
  "home-finance",
  "module-cards",
  "village-cost-slips",
  "village-slips",
]);

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

function safeSegment(raw: string, maxLen: number): string | null {
  let s = raw;
  try {
    s = decodeURIComponent(raw);
  } catch {
    return null;
  }
  s = s.trim();
  if (!s || s.length > maxLen) return null;
  if (s.startsWith(".")) return null;
  if (s.includes("..") || s.includes("/") || s.includes("\\") || s.includes("\0")) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(s)) return null;
  return s;
}

/** subdir ต้องเป็น ASCII slug ตัวเล็ก/ตัวเลข/-/_ เท่านั้น (สอดคล้อง sanitizeUploadSegment) */
function safeSubdir(raw: string): string | null {
  const s = safeSegment(raw, 40);
  if (!s) return null;
  if (!/^[a-z0-9_-]+$/.test(s)) return null;
  return s;
}

export async function GET(
  _: Request,
  ctx: { params: Promise<{ bucket: string; subdir: string; filename: string }> },
) {
  const { bucket: rawBucket, subdir: rawSubdir, filename: rawFilename } = await ctx.params;
  const bucket = safeSegment(rawBucket, 80);
  const subdir = safeSubdir(rawSubdir);
  const filename = safeSegment(rawFilename, 180);
  if (!bucket || !subdir || !filename || !ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME_BY_EXT[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const absolute = path.join(process.cwd(), "public", "uploads", bucket, subdir, filename);
  let buf: Buffer;
  try {
    buf = await readFile(absolute);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
