import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  const dir = path.join(process.cwd(), "public", "uploads", "dorm-logos");
  await mkdir(dir, { recursive: true });
  const filename = `${auth.session.sub}-${Date.now()}.${ext}`;
  const fsPath = path.join(dir, filename);
  await writeFile(fsPath, buf);

  const logoUrl = `/uploads/dorm-logos/${filename}`;

  await prisma.user.update({
    where: { id: auth.session.sub },
    data: { avatarUrl: logoUrl },
  });

  const scope = await getDormitoryDataScope(auth.session.sub);
  await prisma.dormitoryProfile.upsert({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: auth.session.sub,
        trialSessionId: scope.trialSessionId,
      },
    },
    create: {
      ownerUserId: auth.session.sub,
      trialSessionId: scope.trialSessionId,
      logoUrl,
    },
    update: { logoUrl },
  });

  return NextResponse.json({ logoUrl });
}
