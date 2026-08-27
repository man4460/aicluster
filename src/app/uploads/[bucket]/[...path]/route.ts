/**
 * Static-file route สำหรับทุก bucket ที่อนุญาต
 *   /uploads/<bucket>/<filename>                   (legacy แบบไฟล์อยู่ที่ root ของ bucket)
 *   /uploads/<bucket>/<subdir>/<filename>          (แบบใหม่ แยกตามผู้ใช้ — ใช้ใน home-finance)
 *
 * - rejected: path traversal, separator/null/control char, ชื่อขึ้นต้นด้วย `.`
 * - filename ต้องมี extension ที่รู้จัก (ภาพ/svg/PDF)
 * - subdir (ถ้ามี) ต้องเป็น ASCII slug `[a-zA-Z0-9_-]+` เท่านั้น (ยาวสุด 64)
 */
import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const ALLOWED_BUCKETS = new Set([
  "appointment-queue",
  "attendance-faces",
  "attendance-roster",
  "avatars",
  "barber",
  "barber-cash-receipts",
  "barber-packages",
  "barber-portal-signatures",
  "barber-portal-slips",
  "barber-stylists",
  "building-pos",
  "building-pos-portal",
  "car-wash",
  "car-wash-portal-slips",
  "car-wash-portal-signatures",
  "doc-transmission",
  "dorm-cost-slips",
  "dorm-logos",
  "dorm-payment-proofs",
  "drink-pos",
  "ecommerce-store",
  "football-turf",
  "general-store-pos",
  "home-finance",
  "hotel-resort",
  "hotel-resort-portal",
  "laundry",
  "loyalty-stamp",
  "massage",
  "massage-cash-receipts",
  "massage-portal-signatures",
  "massage-portal-slips",
  "massage-therapists",
  "module-cards",
  "module-shop-car-wash",
  "village-cost-slips",
  "village-slips",
  "smart-police",
]);

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const MAX_FILENAME = 200;
/** ตรงกับ ownerSeg ของ API อัปโหลด (slice 0, 64) */
const MAX_SUBDIR = 64;

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

/** ownerId / cuid อาจมีตัวพิมพ์ใหญ่ — ต้องตรงกับโฟลเดอร์ที่อัปโหลดสร้าง */
function isAsciiSlug(s: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(s);
}

function safeBucket(raw: string): string | null {
  const s = safeSegment(raw, 80);
  if (!s || !ALLOWED_BUCKETS.has(s)) return null;
  return s;
}

export async function GET(_: Request, ctx: { params: Promise<{ bucket: string; path: string[] }> }) {
  const { bucket: rawBucket, path: rawParts } = await ctx.params;
  const bucket = safeBucket(rawBucket);
  if (!bucket || !rawParts?.length || rawParts.length > 2) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let subdir: string | null = null;
  let filename: string | null = null;
  if (rawParts.length === 2) {
    const sub = safeSegment(rawParts[0], MAX_SUBDIR);
    if (!sub || !isAsciiSlug(sub)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    subdir = sub;
    filename = safeSegment(rawParts[1], MAX_FILENAME);
  } else {
    filename = safeSegment(rawParts[0], MAX_FILENAME);
  }
  if (!filename) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME_BY_EXT[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const absolute = subdir
    ? path.join(process.cwd(), "public", "uploads", bucket, subdir, filename)
    : path.join(process.cwd(), "public", "uploads", bucket, filename);

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
