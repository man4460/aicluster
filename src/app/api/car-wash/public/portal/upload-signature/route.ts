import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isCarWashCustomerPortalOpenForOwner } from "@/lib/car-wash/portal-access";
import {
  carWashPortalSignatureOwnerTag,
  carWashPortalSignaturePathPrefix,
} from "@/lib/car-wash/portal-signature";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const ownerSchema = z.string().min(10).max(64);

/** อัปโหลดลายเซ็นจากพอร์ทัลลูกค้า (หักแพ็กเอง) */
export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`carwash-portal-sig:${ip}`, 40, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "อัปโหลดถี่เกินไป กรุณารอสักครู่" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

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

  const portalOk = await isCarWashCustomerPortalOpenForOwner(ownerId);
  if (!portalOk) {
    return NextResponse.json({ error: "ไม่สามารถใช้งานได้ในขณะนี้" }, { status: 403 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "รองรับเฉพาะ JPG PNG WEBP" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 2MB" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const tag = carWashPortalSignatureOwnerTag(ownerId);
  const filename = `s-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "car-wash-portal-signatures");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buf);

  return NextResponse.json({ imageUrl: `${carWashPortalSignaturePathPrefix()}${filename}` });
}
