import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { withDocOwnerContext } from "@/systems/doc-transmission/lib/doc-api";

export const dynamic = "force-dynamic";

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB ต่อไฟล์ — เผื่อ PDF สแกน

const ALLOWED_MIME = new Set(["application/pdf"]);

function isPdfBuffer(buf: Buffer): boolean {
  return buf.length >= 5 && buf.toString("ascii", 0, 5) === "%PDF-";
}

function safeFileBaseName(rawName: string): string {
  const base = rawName.replace(/\\/g, "/").split("/").pop() ?? rawName;
  // ตัดอักขระอันตราย เก็บเฉพาะ a-z, 0-9, ._-
  const cleaned = base
    .normalize("NFC")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._\u0E00-\u0E7F-]/gu, "")
    .slice(0, 80);
  return cleaned || "document";
}

export async function POST(req: Request) {
  try {
    const auth = await withDocOwnerContext();
    if (!auth.ok) return auth.res;
    const { ownerUserId } = auth.ctx;

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
      return NextResponse.json(
        { error: `ไฟล์ใหญ่เกิน ${(MAX_BYTES / 1024 / 1024).toFixed(0)}MB` },
        { status: 400 },
      );
    }

    const rawType = (file.type ?? "").trim().toLowerCase();
    if (!ALLOWED_MIME.has(rawType) || !isPdfBuffer(buf)) {
      return NextResponse.json(
        { error: "รองรับเฉพาะไฟล์ PDF" },
        { status: 400 },
      );
    }

    const baseName = safeFileBaseName(file.name || "document.pdf");
    const baseNoExt = baseName.replace(/\.pdf$/i, "");
    const dir = path.join(process.cwd(), "public", "uploads", "doc-transmission");
    await mkdir(dir, { recursive: true });
    const filename = `${ownerUserId.slice(0, 8)}-${Date.now()}-${baseNoExt}.pdf`;
    await writeFile(path.join(dir, filename), buf);
    return NextResponse.json({
      fileUrl: `/uploads/doc-transmission/${filename}`,
      fileName: file.name || filename,
      fileSize: buf.length,
      mimeType: "application/pdf",
    });
  } catch (e) {
    console.error("[doc-transmission/upload]", e);
    const msg =
      e instanceof Error && /ENOENT|EACCES|EPERM|ENOTDIR/i.test(e.message)
        ? "บันทึกไฟล์ไม่สำเร็จ — ตรวจสิทธิ์โฟลเดอร์ public/uploads/doc-transmission"
        : "อัปโหลดไม่สำเร็จ";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
