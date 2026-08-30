import { NextResponse } from "next/server";
import { saveModuleUpload } from "@/lib/upload/save-module-upload";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";

export async function POST(req: Request) {
  const auth = await getParkingOwnerContext(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
  const saved = await saveModuleUpload({
    file,
    moduleSlug: "parking",
    ownerUserId: auth.ownerUserId,
    accept: "image",
    kind: "slip",
    maxImageBytes: 4 * 1024 * 1024,
  });
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: saved.status });
  return NextResponse.json({ imageUrl: saved.imageUrl });
}
