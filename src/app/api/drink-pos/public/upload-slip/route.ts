import { NextResponse } from "next/server";
import { isDrinkPosPortalOpenForOwner } from "@/lib/drink-pos/portal-access";
import { saveModuleUpload } from "@/lib/upload/save-module-upload";

/** อัปโหลดสลิปชำระจากลิงก์ลูกค้า */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const ownerId = String(form.get("ownerId") ?? "").trim();
  if (ownerId.length < 10) {
    return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 400 });
  }

  const open = await isDrinkPosPortalOpenForOwner(ownerId);
  if (!open) {
    return NextResponse.json({ error: "ร้านปิดรับออเดอร์ชั่วคราว" }, { status: 403 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
  }

  const saved = await saveModuleUpload({
    file,
    moduleSlug: "drink-pos",
    ownerUserId: ownerId,
    accept: "image",
    kind: "slip",
    maxImageBytes: 6 * 1024 * 1024,
  });

  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  return NextResponse.json({ imageUrl: saved.imageUrl });
}
