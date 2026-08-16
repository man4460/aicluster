import { NextResponse } from "next/server";
import { getCarWashOwnerOrStaffContext } from "@/lib/car-wash/owner-or-staff";
import { saveOwnerModuleUploadImage } from "@/lib/upload/save-owner-module-image";

/** อัปโหลดลายเซ็นลูกค้าตอนหักแพ็กเหมา (เจ้าของ/พนักงาน) */
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

  const saved = await saveOwnerModuleUploadImage(file, "car-wash", "signatures", own.ownerId);
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  return NextResponse.json({ imageUrl: saved.imageUrl });
}
