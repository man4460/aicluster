import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_PDF_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  const isPdf = file.type === "application/pdf";
  if (!isPdf && !ALLOWED_IMAGES.has(file.type)) {
    return NextResponse.json({ error: "รองรับ JPG PNG WEBP GIF หรือ PDF" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const maxBytes = isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
  if (buf.length > maxBytes) {
    return NextResponse.json(
      { error: isPdf ? "PDF ใหญ่เกิน 5MB" : "ไฟล์ใหญ่เกิน 3MB" },
      { status: 400 },
    );
  }

  if (isPdf) {
    if (buf.length < 5 || !buf.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
      return NextResponse.json({ error: "ไฟล์ PDF ไม่ถูกต้อง" }, { status: 400 });
    }
  }

  const ext = isPdf
    ? "pdf"
    : file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";
  const dir = path.join(process.cwd(), "public", "uploads", "home-finance");
  await mkdir(dir, { recursive: true });
  const filename = `${ctx.billingUserId.slice(0, 12)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await writeFile(path.join(dir, filename), buf);

  const imageUrl = `/uploads/home-finance/${filename}`;
  return NextResponse.json({ imageUrl });
}
