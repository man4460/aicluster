import { NextResponse } from "next/server";
import { saveModuleUpload } from "@/lib/upload/save-module-upload";
import { withDocOwnerContext } from "@/systems/doc-transmission/lib/doc-api";

export const dynamic = "force-dynamic";

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

    const displayNameRaw = form.get("displayName");
    const displayName =
      typeof displayNameRaw === "string" ? displayNameRaw : null;

    const saved = await saveModuleUpload({
      file,
      moduleSlug: "doc-transmission",
      ownerUserId,
      accept: "pdf",
      kind: "doc",
      displayName,
      maxPdfBytes: 12 * 1024 * 1024,
    });

    if (!saved.ok) {
      return NextResponse.json({ error: saved.error }, { status: saved.status });
    }

    return NextResponse.json({
      fileUrl: saved.fileUrl,
      /** ชื่อบนดิสก์ — ไม่ใช้แสดงใน UI */
      storedFileName: saved.storedFileName,
      /** ชื่อที่แสดง — ผู้ใช้ตั้งเอง (อาจว่าง ถ้ายังไม่ส่งมา) */
      displayName: saved.displayName,
      fileName: saved.displayName,
      fileSize: saved.fileSize,
      mimeType: saved.mimeType,
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
