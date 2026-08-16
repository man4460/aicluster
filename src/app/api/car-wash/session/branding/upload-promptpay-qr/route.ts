import { NextResponse } from "next/server";
import { getCarWashOwnerOrStaffContext } from "@/lib/car-wash/owner-or-staff";
import { ensureModuleShopBranding } from "@/lib/module-shop/branding-store";
import { CAR_WASH_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { saveOwnerModuleUploadImage } from "@/lib/upload/save-owner-module-image";

/** อัปโหลดรูป QR พร้อมเพย์ที่มีอยู่แล้ว → บันทึกใน ModuleShopBranding ของคาร์แคร์ */
export async function POST(req: Request) {
  const own = await getCarWashOwnerOrStaffContext(req);
  if (!own.ok) return own.res;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
  }

  const saved = await saveOwnerModuleUploadImage(file, "car-wash", "promptpay-qr", own.ownerId);
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  await ensureModuleShopBranding(own.ownerId, own.trialSessionId, CAR_WASH_MODULE_SLUG);
  await prisma.moduleShopBranding.update({
    where: {
      ownerUserId_trialSessionId_moduleSlug: {
        ownerUserId: own.ownerId,
        trialSessionId: own.trialSessionId,
        moduleSlug: CAR_WASH_MODULE_SLUG,
      },
    },
    data: { promptPayQrImageUrl: saved.imageUrl },
  });

  return NextResponse.json({ imageUrl: saved.imageUrl });
}
