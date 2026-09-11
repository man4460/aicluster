import { NextResponse } from "next/server";
import { USED_CAR_SHOWROOM_MODULE_SLUG } from "@/lib/modules/config";
import { ensureOwnerModuleDailyChargeOnPublicUse } from "@/lib/modules/public-portal-access";
import { saveModuleUpload } from "@/lib/upload/save-module-upload";
import { gateUsedCarShowroomPublicShop } from "@/systems/used-car-showroom/lib/load-public-shop";

/** อัปโหลดสลิปจากเว็บลูกค้าโชว์รูม */
export async function POST(req: Request) {
  try {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
    }

    const slug = String(form.get("slug") ?? "").trim().toLowerCase();
    const ownerId = String(form.get("ownerId") ?? "").trim();
    const trialParam = String(form.get("t") ?? form.get("trialSessionId") ?? "").trim() || null;

    let resolvedOwnerId = ownerId;
    if (slug.length >= 2) {
      const gate = await gateUsedCarShowroomPublicShop(slug, trialParam);
      if (!gate.ok) {
        return NextResponse.json({ error: gate.error }, { status: gate.status });
      }
      resolvedOwnerId = gate.shop.ownerUserId;
    } else if (ownerId.length < 10) {
      return NextResponse.json({ error: "ไม่พบโชว์รูม" }, { status: 400 });
    }

    const charge = await ensureOwnerModuleDailyChargeOnPublicUse(
      resolvedOwnerId,
      USED_CAR_SHOWROOM_MODULE_SLUG,
    );
    if (!charge.ok) {
      return NextResponse.json({ error: "ลิงก์ปิดชั่วคราว" }, { status: 403 });
    }

    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
    }

    const saved = await saveModuleUpload({
      file,
      moduleSlug: USED_CAR_SHOWROOM_MODULE_SLUG,
      ownerUserId: resolvedOwnerId,
      accept: "image",
      kind: "slip",
      maxImageBytes: 6 * 1024 * 1024,
    });

    if (!saved.ok) {
      return NextResponse.json({ error: saved.error }, { status: saved.status });
    }

    return NextResponse.json({ imageUrl: saved.imageUrl });
  } catch (e) {
    console.error("[used-car-showroom/public/upload-slip]", e);
    return NextResponse.json({ error: "อัปโหลดไม่สำเร็จ" }, { status: 500 });
  }
}
