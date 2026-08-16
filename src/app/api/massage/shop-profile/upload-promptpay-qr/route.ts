import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getMassageDataScope } from "@/lib/trial/module-scopes";
import { saveOwnerModuleUploadImage } from "@/lib/upload/save-owner-module-image";

/** อัปโหลดรูป QR พร้อมเพย์ที่มีอยู่แล้ว → บันทึกในโปรไฟล์ร้านนวด */
export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getMassageDataScope(auth.session.sub);

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

  const saved = await saveOwnerModuleUploadImage(file, "massage", "promptpay-qr", auth.session.sub);
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  await prisma.massageShopProfile.upsert({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: auth.session.sub,
        trialSessionId: scope.trialSessionId,
      },
    },
    create: {
      ownerUserId: auth.session.sub,
      trialSessionId: scope.trialSessionId,
      promptPayQrImageUrl: saved.imageUrl,
    },
    update: { promptPayQrImageUrl: saved.imageUrl },
  });

  return NextResponse.json({ imageUrl: saved.imageUrl });
}
