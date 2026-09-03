import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CLUB_EVENT_MODULE_SLUG } from "@/lib/modules/config";
import { ensureOwnerModuleDailyChargeOnPublicUse } from "@/lib/modules/public-portal-access";
import { saveModuleUpload } from "@/lib/upload/save-module-upload";

/** อัปโหลดสลิปจากลิงก์สาธารณะชมรม */
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
      return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 400 });
    }

    const profile = await prisma.clubEventProfile.findFirst({
      where: { ownerUserId: ownerId },
      select: { id: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 404 });
    }

    const charge = await ensureOwnerModuleDailyChargeOnPublicUse(ownerId, CLUB_EVENT_MODULE_SLUG);
    if (!charge.ok) {
      return NextResponse.json({ error: "ลิงก์ปิดชั่วคราว" }, { status: 403 });
    }

    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
    }

    const saved = await saveModuleUpload({
      file,
      moduleSlug: "club-event",
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
    console.error("[club-event/public/upload-slip]", e);
    return NextResponse.json({ error: "อัปโหลดไม่สำเร็จ" }, { status: 500 });
  }
}
