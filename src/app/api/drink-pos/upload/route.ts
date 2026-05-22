import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { detectImageKind, extensionForImageKind } from "@/lib/upload/detect-image-kind";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";

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
  "รูป HEIC/HEIF ยังไม่รองรับ — ตั้ง iPhone: การตั้งค่า > กล้อง > รูปแบบ เป็น “ความเข้ากันได้ดีที่สุด” (JPG) หรือแปลงเป็น JPG ก่อน";

export async function POST(req: Request) {
  const auth = await withDrinkPosOwnerContext();
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

  let buf: Buffer;
  try {
    buf = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "อ่านไฟล์ไม่สำเร็จ" }, { status: 400 });
  }

  if (buf.length === 0) {
    return NextResponse.json({ error: "ไฟล์ว่าง" }, { status: 400 });
  }
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 6MB — ลองถ่ายใหม่หรือเลือกรูปที่เล็กลง" }, { status: 400 });
  }

  const rawType = (file.type || "").trim().toLowerCase();
  const detected = detectImageKind(buf);

  if (detected === "heic") {
    return NextResponse.json({ error: HEIC_HINT_TH }, { status: 400 });
  }

  let ext: string;
  if (detected === "jpeg" || detected === "png" || detected === "gif" || detected === "webp") {
    ext = extensionForImageKind(detected);
  } else if (ALLOWED_MIME.has(rawType)) {
    ext =
      rawType === "image/png" || rawType === "image/x-png" ? "png"
      : rawType === "image/webp" ? "webp"
      : rawType === "image/gif" ? "gif"
      : "jpg";
  } else {
    return NextResponse.json(
      {
        error:
          "รูปแบบไฟล์ไม่รองรับ — ใช้ JPG PNG WEBP หรือ GIF (ถ่ายจากกล้องมือถือมักได้ JPG อัตโนมัติ)",
      },
      { status: 400 },
    );
  }

  const ownerSeg = auth.ctx.ownerUserId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) || "owner";
  const dir = path.join(process.cwd(), "public", "uploads", "drink-pos", ownerSeg);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buf);
  } catch (e) {
    console.error("[drink-pos/upload]", e);
    const msg =
      e instanceof Error && /ENOENT|EACCES|EPERM|ENOTDIR/i.test(e.message) ?
        "บันทึกไฟล์ไม่สำเร็จ — ตรวจสิทธิ์โฟลเดอร์ public/uploads/drink-pos หรือรันแอปจากโฟลเดอร์โปรเจกต์"
      : "บันทึกไฟล์ไม่สำเร็จ";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const imageUrl = `/uploads/drink-pos/${ownerSeg}/${filename}`;
  return NextResponse.json({ imageUrl });
}
