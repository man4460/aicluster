import { NextResponse } from "next/server";
import { saveModuleUpload } from "@/lib/upload/save-module-upload";
import { getFootballTurfOwnerOrStaffContext } from "@/systems/football-turf/lib/api-auth";

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
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
  }

  const saved = await saveModuleUpload({
    file,
    moduleSlug: "football-turf",
    ownerUserId: gate.userId,
    accept: "image",
    kind: "slip",
    maxImageBytes: 6 * 1024 * 1024,
  });

  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  return NextResponse.json({ imageUrl: saved.imageUrl });
}
