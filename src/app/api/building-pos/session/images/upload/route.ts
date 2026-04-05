import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";

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

type DetectedKind = "jpeg" | "png" | "gif" | "webp" | "heic";

function detectImageKind(buf: Buffer): DetectedKind | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "gif";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 4, 8) === "ftyp" && buf.length >= 12) {
    const brand = buf.toString("ascii", 8, 12);
    if (["heic", "heix", "mif1", "msf1", "hevc", "hevx"].includes(brand)) return "heic";
  }
  return null;
}

function extForKind(kind: Exclude<DetectedKind, "heic">): string {
  if (kind === "png") return "png";
  if (kind === "gif") return "gif";
  if (kind === "webp") return "webp";
  return "jpg";
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
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
    if (buf.length === 0) {
      return NextResponse.json({ error: "ไฟล์ว่าง" }, { status: 400 });
    }
    if (buf.length > MAX_BYTES) {
      return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 6MB — ลองถ่ายใหม่หรือเลือกรูปที่เล็กลง" }, { status: 400 });
    }

    const rawType = file.type.trim().toLowerCase();
    const detected = detectImageKind(buf);

    if (detected === "heic") {
      return NextResponse.json(
        {
          error:
            "รูป HEIC/HEIF ยังไม่รองรับ — ตั้ง iPhone: การตั้งค่า > กล้อง > รูปแบบ เป็น “ความเข้ากันได้ดีที่สุด” (JPG) หรือแปลงเป็น JPG ก่อน",
        },
        { status: 400 },
      );
    }

    let ext: string;
    if (detected === "jpeg" || detected === "png" || detected === "gif" || detected === "webp") {
      ext = extForKind(detected);
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

    const dir = path.join(process.cwd(), "public", "uploads", "building-pos");
    await mkdir(dir, { recursive: true });
    const filename = `${own.ownerId}-${Date.now()}.${ext}`;
    await writeFile(path.join(dir, filename), buf);
    return NextResponse.json({ imageUrl: `/uploads/building-pos/${filename}` });
  } catch (e) {
    console.error("[building-pos/session/images/upload]", e);
    const msg =
      e instanceof Error && /ENOENT|EACCES|EPERM|ENOTDIR/i.test(e.message) ?
        "บันทึกไฟล์ไม่สำเร็จ — ตรวจสิทธิ์โฟลเดอร์ public/uploads/building-pos หรือรัน next dev จากโฟลเดอร์โปรเจกต์ (D:\\Ai Cluster)"
      : formatBuildingPosDbError(e);
    return jsonBuildingPosError(msg, e, 500);
  }
}
