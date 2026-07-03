import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveOwnerModuleUploadImage } from "@/lib/upload/save-owner-module-image";
import { ensureHotelResortProfile } from "@/systems/hotel-resort/lib/ensure-profile";
import { withHotelResortOwnerContext } from "@/systems/hotel-resort/lib/api-auth";

export async function POST(req: Request) {
  const auth = await withHotelResortOwnerContext();
  if (!auth.ok) return auth.res;

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
    "hotel-resort",
    "logos",
    auth.ctx.ownerUserId,
  );
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  await ensureHotelResortProfile(prisma, auth.ctx.ownerUserId, auth.ctx.trialSessionId);
  await prisma.hotelResortProfile.update({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: auth.ctx.ownerUserId,
        trialSessionId: auth.ctx.trialSessionId,
      },
    },
    data: { logoUrl: saved.imageUrl },
  });

  return NextResponse.json({ imageUrl: saved.imageUrl });
}
