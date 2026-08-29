import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getVillageDataScope } from "@/lib/trial/module-scopes";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "รองรับเฉพาะ JPG PNG WEBP GIF" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 2MB" }, { status: 400 });
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";
  const dir = path.join(process.cwd(), "public", "uploads", "village-logos");
  await mkdir(dir, { recursive: true });
  const filename = `${own.ownerId}-${Date.now()}.${ext}`;
  await writeFile(path.join(dir, filename), buf);

  const logoUrl = `/uploads/village-logos/${filename}`;
  const scope = await getVillageDataScope(own.ownerId);
  await prisma.villageProfile.upsert({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
      },
    },
    create: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      logoUrl,
    },
    update: { logoUrl },
  });

  return NextResponse.json({ imageUrl: logoUrl, logoUrl });
}
