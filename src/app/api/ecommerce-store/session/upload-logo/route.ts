import { NextResponse } from "next/server";
import { getOrCreateEcommerceStore } from "@/lib/ecommerce/api-owner";
import { saveEcommerceUploadImage } from "@/lib/ecommerce/upload-image";
import { prisma } from "@/lib/prisma";
import { withEcommerceStoreOwnerContext } from "@/systems/ecommerce-store/lib/api-auth";

export async function POST(req: Request) {
  const auth = await withEcommerceStoreOwnerContext();
  if (!auth.ok) return auth.res;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
  }

  const saved = await saveEcommerceUploadImage(file, "logos", auth.ctx.ownerUserId);
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  const store = await getOrCreateEcommerceStore(auth.ctx.ownerUserId);
  const updated = await prisma.ecommerceStore.update({
    where: { id: store.id },
    data: { logoUrl: saved.imageUrl },
  });

  return NextResponse.json({ imageUrl: saved.imageUrl, store: updated });
}
