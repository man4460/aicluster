import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveOwnerModuleUploadImage } from "@/lib/upload/save-owner-module-image";
import { getAppointmentQueueOwnerContext } from "@/systems/appointment-queue/lib/api-auth";

export async function POST(req: Request) {
  const owner = await getAppointmentQueueOwnerContext();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const saved = await saveOwnerModuleUploadImage(file, "appointment-queue", "logos", owner.userId);
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  await prisma.appointmentQueueShopProfile.update({
    where: { id: owner.profile.id },
    data: { logoUrl: saved.imageUrl },
  });

  return NextResponse.json({ imageUrl: saved.imageUrl });
}
