import { NextResponse } from "next/server";
import { saveEcommerceUploadImage } from "@/lib/ecommerce/upload-image";
import { withEcommerceStoreOwnerContext } from "@/systems/ecommerce-store/lib/api-auth";

export async function POST(req: Request) {
  const auth = await withEcommerceStoreOwnerContext();
  if (!auth.ok) return auth.res;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
  }

  const saved = await saveEcommerceUploadImage(file, "slips", auth.ctx.ownerUserId);
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  return NextResponse.json({ imageUrl: saved.imageUrl });
}
