import { NextResponse } from "next/server";
import { saveModuleUpload } from "@/lib/upload/save-module-upload";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";

export async function POST(req: Request) {
  const auth = await getParkingOwnerContext(req);
  if (!auth || auth.isStaff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
  const saved = await saveModuleUpload({
    file,
    moduleSlug: "parking",
    ownerUserId: auth.ownerUserId,
    accept: "image",
    kind: "logo",
    maxImageBytes: 4 * 1024 * 1024,
  });
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: saved.status });
  return NextResponse.json({ imageUrl: saved.imageUrl });
}
