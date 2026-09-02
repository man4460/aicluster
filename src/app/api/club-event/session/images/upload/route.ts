import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";

const MAX_BYTES = 6 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/x-png",
  "image/webp",
  "image/gif",
]);

function detectImageKind(buf: Buffer): "jpeg" | "png" | "gif" | "webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "gif";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

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
    const ext =
      detected === "png" ? "png"
      : detected === "gif" ? "gif"
      : detected === "webp" ? "webp"
      : detected === "jpeg" ? "jpg"
      : ALLOWED_MIME.has(file.type.trim().toLowerCase())
        ? file.type.includes("png") ? "png"
        : file.type.includes("webp") ? "webp"
        : file.type.includes("gif") ? "gif"
        : "jpg"
        : null;

    if (!ext) {
      return NextResponse.json({ error: "รูปแบบไฟล์ไม่รองรับ" }, { status: 400 });
    }

    const dir = path.join(process.cwd(), "public", "uploads", "club-event", own.ownerId);
    await mkdir(dir, { recursive: true });
    const filename = `${own.ownerId}-${Date.now()}.${ext}`;
    await writeFile(path.join(dir, filename), buf);
    return NextResponse.json({ imageUrl: `/uploads/club-event/${own.ownerId}/${filename}` });
  } catch (e) {
    console.error("[club-event/session/images/upload]", e);
    return NextResponse.json({ error: "อัปโหลดไม่สำเร็จ" }, { status: 500 });
  }
}
