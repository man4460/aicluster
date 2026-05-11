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
};

/**
 * รับชื่อ segment ที่อาจมาแบบ URL-encoded (เช่น ชื่อไฟล์ภาษาไทย)
 * - ปฏิเสธ path traversal, separator, null byte, hidden file, control char
 * - อนุญาต Unicode (ไทย/อังกฤษ/ตัวเลข/`_-.()` ฯลฯ) เพราะ extension/bucket ถูกจำกัดที่ MIME/ALLOWED แล้ว
 */
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

export async function GET(
  _: Request,
  ctx: { params: Promise<{ bucket: string; filename: string }> },
) {
  const { bucket: rawBucket, filename: rawFilename } = await ctx.params;
  const bucket = safeSegment(rawBucket, 80);
  const filename = safeSegment(rawFilename, 180);
  if (!bucket || !filename || !ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME_BY_EXT[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const absolute = path.join(process.cwd(), "public", "uploads", bucket, filename);
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

