import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { saveOwnerModuleUploadImage } from "@/lib/upload/save-owner-module-image";

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getBarberDataScope(auth.session.sub);

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

  const saved = await saveOwnerModuleUploadImage(file, "barber", "logos", auth.session.sub);
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  await prisma.barberShopProfile.upsert({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: auth.session.sub,
        trialSessionId: scope.trialSessionId,
      },
    },
    create: {
      ownerUserId: auth.session.sub,
      trialSessionId: scope.trialSessionId,
      logoUrl: saved.imageUrl,
    },
    update: { logoUrl: saved.imageUrl },
  });

  return NextResponse.json({ imageUrl: saved.imageUrl });
}
