import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { SITE_SETTING_DEFAULT_ID } from "@/lib/landing/site-setting";
import { resolveLandingBannerUrl } from "@/lib/landing/banner-url";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

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
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "รองรับเฉพาะ JPG PNG WEBP GIF" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 4MB" }, { status: 400 });
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";
  const dir = path.join(process.cwd(), "public", "uploads", "landing");
  await mkdir(dir, { recursive: true });
  const filename = `banner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await writeFile(path.join(dir, filename), buf);

  const landingBannerUrl = `/uploads/landing/${filename}`;
  const row = await prisma.siteSetting.upsert({
    where: { id: SITE_SETTING_DEFAULT_ID },
    create: { id: SITE_SETTING_DEFAULT_ID, landingBannerUrl },
    update: { landingBannerUrl },
    select: { landingBannerUrl: true },
  });

  return NextResponse.json({
    landingBannerUrl: row.landingBannerUrl,
    displayUrl: resolveLandingBannerUrl(row.landingBannerUrl),
    imageUrl: landingBannerUrl,
  });
}
