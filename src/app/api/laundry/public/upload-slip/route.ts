import { NextResponse } from "next/server";
import { isLaundryPickupPortalOpenForOwner } from "@/lib/laundry/portal-access";
import { jsonLaundrySessionError } from "@/lib/laundry/route-errors";
import { saveModuleUpload } from "@/lib/upload/save-module-upload";

/** อัปโหลดสลิปชำระจากลิงก์ลูกค้ารับผ้า */
export async function POST(req: Request) {
  try {
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

    const open = await isLaundryPickupPortalOpenForOwner(ownerId);
    if (!open) {
      return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });
    }

    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
    }

    const saved = await saveModuleUpload({
      file,
      moduleSlug: "laundry",
      ownerUserId: ownerId,
      accept: "image",
      kind: "slip",
      maxImageBytes: 6 * 1024 * 1024,
    });

    if (!saved.ok) {
      return NextResponse.json({ error: saved.error }, { status: saved.status });
    }

    return NextResponse.json({ imageUrl: saved.imageUrl });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/public/upload-slip POST");
  }
}
