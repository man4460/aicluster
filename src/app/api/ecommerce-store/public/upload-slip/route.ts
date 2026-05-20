import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const MAX_BYTES = 6 * 1024 * 1024;

export async function POST(req: Request) {
  const form = await req.formData();
  const storeId = String(form.get("storeId") ?? "").trim();
  const file = form.get("file");
  if (!storeId) return NextResponse.json({ error: "missing storeId" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "missing file" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0 || buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "ไฟล์ไม่ถูกต้องหรือใหญ่เกิน 6MB" }, { status: 400 });
  }

  const safeStore = storeId.replace(/[^a-zA-Z0-9_-]/g, "");
  const ext = file.name?.match(/\.(jpe?g|png|webp)$/i)?.[1]?.toLowerCase() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "ecommerce-slips", safeStore);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buf);

  const imageUrl = `/uploads/ecommerce-slips/${safeStore}/${filename}`;
  return NextResponse.json({ imageUrl });
}
