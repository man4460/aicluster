import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { saveModuleUpload } from "@/lib/upload/save-module-upload";

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    moduleSlug: "dorm-cost-slips",
    ownerUserId: auth.session.sub,
    accept: "image",
    kind: "slip",
    maxImageBytes: 3 * 1024 * 1024,
  });

  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  return NextResponse.json({ imageUrl: saved.imageUrl });
}
