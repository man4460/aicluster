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

  const result = await saveEcommerceUploadImage(file, "products", auth.ctx.ownerUserId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ imageUrl: result.imageUrl });
}
