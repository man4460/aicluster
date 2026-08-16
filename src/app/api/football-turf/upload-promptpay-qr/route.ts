import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveOwnerModuleUploadImage } from "@/lib/upload/save-owner-module-image";
import { getFootballTurfOwnerOrStaffContext } from "@/systems/football-turf/lib/api-auth";
import { ensureFootballTurfProfile } from "@/systems/football-turf/lib/ensure-profile";

/** อัปโหลดรูป QR พร้อมเพย์ที่มีอยู่แล้ว → บันทึกในโปรไฟล์สนาม */
export async function POST(req: Request) {
  const gate = await getFootballTurfOwnerOrStaffContext(req);
  if (!gate.ok) return gate.res;

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

  const saved = await saveOwnerModuleUploadImage(file, "football-turf", "promptpay-qr", gate.userId);
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  await ensureFootballTurfProfile(gate.userId, gate.trialSessionId);
  await prisma.footballTurfShopProfile.update({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: gate.userId,
        trialSessionId: gate.trialSessionId,
      },
    },
    data: { promptPayQrImageUrl: saved.imageUrl },
  });

  return NextResponse.json({ imageUrl: saved.imageUrl });
}
