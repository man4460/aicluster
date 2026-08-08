import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isHotelResortPortalOpenForOwner } from "@/lib/hotel-resort/portal-access";
import { assertOwnerPlanUpload } from "@/lib/modules/plan-entitlements";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { detectImageKind, extensionForImageKind } from "@/lib/upload/detect-image-kind";

const MAX_BYTES = 3 * 1024 * 1024;
const ownerSchema = z.string().min(10).max(64);

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`hr-portal-upload:${ip}`, 30, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "อัปโหลดถี่เกินไป" }, { status: 429 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const ownerRaw = form.get("ownerId");
  const ownerParsed = ownerSchema.safeParse(typeof ownerRaw === "string" ? ownerRaw : "");
  if (!ownerParsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const ownerId = ownerParsed.data;

  const portalOk = await isHotelResortPortalOpenForOwner(ownerId);
  if (!portalOk) return NextResponse.json({ error: "ไม่สามารถใช้งานได้" }, { status: 403 });

  const planGate = await assertOwnerPlanUpload(ownerId, "slip");
  if (!planGate.ok) {
    return NextResponse.json({ error: planGate.error, code: planGate.code }, { status: 402 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0 || buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "ไฟล์ว่างหรือใหญ่เกิน 3MB" }, { status: 400 });
  }

  const detected = detectImageKind(buf);
  if (detected === "heic") {
    return NextResponse.json({ error: "รูป HEIC ยังไม่รองรับ — ใช้ JPG" }, { status: 400 });
  }
  if (detected !== "jpeg" && detected !== "png" && detected !== "gif" && detected !== "webp") {
    return NextResponse.json({ error: "รองรับเฉพาะ JPG PNG WEBP GIF" }, { status: 400 });
  }

  const ext = extensionForImageKind(detected);
  const ownerSeg = ownerId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) || "owner";
  const dir = path.join(process.cwd(), "public", "uploads", "hotel-resort-portal", ownerSeg);
  const filename = `slip-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buf);

  return NextResponse.json({
    imageUrl: `/uploads/hotel-resort-portal/${ownerSeg}/${filename}`,
  });
}
