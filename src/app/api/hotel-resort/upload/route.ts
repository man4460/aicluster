import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { detectImageKind, extensionForImageKind } from "@/lib/upload/detect-image-kind";
import { withHotelResortOwnerOrStaffContext } from "@/systems/hotel-resort/lib/api-auth";

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

export async function POST(req: Request) {
  const auth = await withHotelResortOwnerOrStaffContext(req);
  if (!auth.ok) return auth.res;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0 || buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "ไฟล์ว่างหรือใหญ่เกิน 6MB" }, { status: 400 });
  }

  const detected = detectImageKind(buf);
  if (detected === "heic") {
    return NextResponse.json({ error: "รูป HEIC ยังไม่รองรับ — ใช้ JPG" }, { status: 400 });
  }

  const rawType = (file.type || "").trim().toLowerCase();
  let ext: string;
  if (detected === "jpeg" || detected === "png" || detected === "gif" || detected === "webp") {
    ext = extensionForImageKind(detected);
  } else if (ALLOWED_MIME.has(rawType)) {
    ext = rawType.includes("png") ? "png" : rawType.includes("webp") ? "webp" : rawType.includes("gif") ? "gif" : "jpg";
  } else {
    return NextResponse.json({ error: "รูปแบบไฟล์ไม่รองรับ" }, { status: 400 });
  }

  const ownerSeg = auth.ctx.ownerUserId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) || "owner";
  const dir = path.join(process.cwd(), "public", "uploads", "hotel-resort", ownerSeg);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buf);
  return NextResponse.json({ imageUrl: `/uploads/hotel-resort/${ownerSeg}/${filename}` });
}
