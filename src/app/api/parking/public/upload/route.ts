import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { saveModuleUpload } from "@/lib/upload/save-module-upload";

export async function POST(req: Request) {
  const limited = rateLimit(`parking-public-upload:${clientIp(req.headers)}`, 20, 10 * 60 * 1000);
  if (!limited.ok) return NextResponse.json({ error: "ถี่เกินไป" }, { status: 429 });
  const form = await req.formData().catch(() => null);
  const token = form?.get("token");
  const file = form?.get("file");
  if (typeof token !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  }
  const spot = await prisma.parkingSpot.findUnique({
    where: { checkInToken: token },
    include: { site: { select: { ownerUserId: true } } },
  });
  if (!spot) return NextResponse.json({ error: "ลิงก์ไม่ถูกต้อง" }, { status: 404 });
  const saved = await saveModuleUpload({
    file,
    moduleSlug: "parking",
    ownerUserId: spot.site.ownerUserId,
    accept: "image",
    kind: "slip",
    maxImageBytes: 4 * 1024 * 1024,
  });
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: saved.status });
  return NextResponse.json({ imageUrl: saved.imageUrl });
}
