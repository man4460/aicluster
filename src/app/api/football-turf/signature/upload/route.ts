import { NextResponse } from "next/server";
import { saveOwnerModuleUploadImage } from "@/lib/upload/save-owner-module-image";
import { getFootballTurfOwnerOrStaffContext } from "@/systems/football-turf/lib/api-auth";

/** อัปโหลดลายเซ็นลูกค้าตอนใช้สิทธิ์โปร / หักแพ็ก (เจ้าของ/พนักงาน) */
export async function POST(req: Request) {
  const gate = await getFootballTurfOwnerOrStaffContext(req);
  if (!gate.ok) return gate.res;

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

  const saved = await saveOwnerModuleUploadImage(file, "football-turf", "signatures", gate.userId);
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  return NextResponse.json({ imageUrl: saved.imageUrl });
}
