import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { isParkingPortalOpenForOwner } from "@/lib/parking/portal-access";
import { PARKING_MODULE_SLUG } from "@/lib/modules/config";
import { assertOwnerPlanUpload } from "@/lib/modules/plan-entitlements";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { detectImageKind, extensionForImageKind } from "@/lib/upload/detect-image-kind";

const MAX_BYTES = 3 * 1024 * 1024;

export async function POST(req: Request) {
  const rl = rateLimit(`parking-portal-upload:${clientIp(req.headers)}`, 30, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "อัปโหลดถี่เกินไป" }, { status: 429 });
  const form = await req.formData().catch(() => null);
  const ownerId = form?.get("ownerId");
  if (typeof ownerId !== "string" || ownerId.length < 10) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  if (!(await isParkingPortalOpenForOwner(ownerId))) {
    return NextResponse.json({ error: "ไม่สามารถใช้งานได้" }, { status: 403 });
  }
  const gate = await assertOwnerPlanUpload(ownerId, "slip", PARKING_MODULE_SLUG);
  if (!gate.ok) return NextResponse.json({ error: gate.error, code: gate.code }, { status: 402 });
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.length || buffer.length > MAX_BYTES) {
    return NextResponse.json({ error: "ไฟล์ว่างหรือใหญ่เกิน 3MB" }, { status: 400 });
  }
  const kind = detectImageKind(buffer);
  if (kind !== "jpeg" && kind !== "png" && kind !== "gif" && kind !== "webp") {
    return NextResponse.json({ error: "รองรับเฉพาะ JPG PNG WEBP GIF" }, { status: 400 });
  }
  const ownerSeg = ownerId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  const directory = path.join(process.cwd(), "public", "uploads", "parking-portal", ownerSeg);
  const filename = `slip-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extensionForImageKind(kind)}`;
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), buffer);
  return NextResponse.json({ imageUrl: `/uploads/parking-portal/${ownerSeg}/${filename}` });
}
