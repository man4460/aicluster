/**
 * Endpoint ให้ openclaw (หรือ agent ภายนอกอื่น) อัปโหลดรูป/ไฟล์แนบของรายการรายรับ-รายจ่าย
 *
 * - ตรวจสิทธิ์ด้วย shared secret เดียวกับ /api/sync/openclaw/events
 *   ส่งผ่าน `X-OpenClaw-Sync-Secret: <token>` หรือ `Authorization: Bearer <token>`
 * - รับเป็น multipart/form-data:
 *     file       : ไฟล์ (image/* หรือ application/pdf)
 *     ownerUserId: User.id ที่จะเป็นเจ้าของรายการ (ต้องมีจริง)
 *     externalId : ID ฝั่ง openclaw (เช่น message_id/file_unique_id) — ใช้กันชนชื่อไฟล์ซ้ำ + ใช้เป็น externalId ตอน upsert event
 *
 * - บันทึกลง public/uploads/home-finance/<filename> ที่มีรูปแบบ:
 *     <userPrefix>-<external>-<ts>-<rand>.<ext>
 *   เพื่อให้ /uploads/home-finance/[filename] route serve ได้และไม่มี collision
 *
 * - คืน { imageUrl: "/uploads/home-finance/..." } ให้ openclaw นำไปวางใน slipImageUrl/attachmentUrls
 *   ในคำขอ POST /api/sync/openclaw/events ต่อ
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeSystemActivityLog } from "@/lib/audit-log";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_PDF = "application/pdf";

function extOf(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "application/pdf") return "pdf";
  return "jpg";
}

function safeIdToken(raw: string, maxLen: number): string {
  return raw
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen)
    .toLowerCase();
}

function readBearerToken(req: Request): string {
  const v = req.headers.get("authorization")?.trim() ?? "";
  if (!v.toLowerCase().startsWith("bearer ")) return "";
  return v.slice(7).trim();
}

function readSyncSecret(req: Request): string {
  return req.headers.get("x-openclaw-sync-secret")?.trim() || readBearerToken(req);
}

function verifySyncSecret(req: Request): NextResponse | null {
  const expected = process.env.OPENCLAW_SYNC_SECRET?.trim() || "";
  if (!expected) {
    return NextResponse.json({ error: "OPENCLAW_SYNC_SECRET is not configured" }, { status: 500 });
  }
  if (readSyncSecret(req) !== expected) {
    return NextResponse.json({ error: "invalid sync secret" }, { status: 401 });
  }
  return null;
}

export async function POST(req: Request) {
  const authError = verifySyncSecret(req);
  if (authError) return authError;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid multipart payload" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "missing field 'file'" }, { status: 400 });
  }

  const ownerUserId = (form.get("ownerUserId") ?? "").toString().trim();
  if (!ownerUserId || ownerUserId.length > 191) {
    return NextResponse.json({ error: "missing or invalid ownerUserId" }, { status: 400 });
  }

  const externalIdRaw = (form.get("externalId") ?? "").toString().trim();
  if (externalIdRaw && externalIdRaw.length > 128) {
    return NextResponse.json({ error: "externalId too long (max 128)" }, { status: 400 });
  }

  const isPdf = file.type === ALLOWED_PDF;
  if (!isPdf && !ALLOWED_IMAGES.has(file.type)) {
    return NextResponse.json(
      { error: "supported types: JPG PNG WEBP GIF PDF" },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const maxBytes = isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
  if (buf.length > maxBytes) {
    return NextResponse.json(
      { error: isPdf ? "PDF larger than 8MB" : "image larger than 5MB" },
      { status: 400 },
    );
  }
  if (isPdf && (buf.length < 5 || !buf.subarray(0, 5).equals(Buffer.from("%PDF-")))) {
    return NextResponse.json({ error: "not a valid PDF" }, { status: 400 });
  }

  const owner = await prisma.user.findUnique({
    where: { id: ownerUserId },
    select: { id: true },
  });
  if (!owner) {
    return NextResponse.json({ error: "ownerUserId not found" }, { status: 404 });
  }

  const userPrefix = ownerUserId.slice(0, 12);
  const externalToken = externalIdRaw ? safeIdToken(externalIdRaw, 40) : "";
  const ts = Date.now();
  const rand = randomBytes(3).toString("hex");
  const ext = extOf(file.type);
  const filename = externalToken
    ? `${userPrefix}-${externalToken}-${ts}-${rand}.${ext}`
    : `${userPrefix}-${ts}-${rand}.${ext}`;

  const dir = path.join(process.cwd(), "public", "uploads", "home-finance");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buf);

  const imageUrl = `/uploads/home-finance/${filename}`;

  await writeSystemActivityLog({
    actorUserId: ownerUserId,
    action: "CREATE",
    modelName: "OpenClawHomeFinanceAttachment",
    payload: {
      ownerUserId,
      externalId: externalIdRaw || null,
      filename,
      bytes: buf.length,
      mime: file.type,
    },
  });

  return NextResponse.json({
    ok: true,
    imageUrl,
    filename,
    bytes: buf.length,
    mime: file.type,
  });
}
