import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { saveOwnerModuleUploadImage } from "@/lib/upload/save-owner-module-image";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";
import { ensureDrinkPosShopProfile } from "@/systems/drink-pos/lib/member-service";

export async function POST(req: Request) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const scope = await getDrinkPosDataScope(auth.ctx.ownerUserId);

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

  const saved = await saveOwnerModuleUploadImage(
    file,
    "drink-pos",
    "logos",
    auth.ctx.ownerUserId,
  );
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  const existing = await ensureDrinkPosShopProfile(prisma, auth.ctx.ownerUserId, scope.trialSessionId);
  await prisma.drinkPosShopProfile.update({
    where: { id: existing.id },
    data: { logoUrl: saved.imageUrl },
  });

  return NextResponse.json({ imageUrl: saved.imageUrl });
}
