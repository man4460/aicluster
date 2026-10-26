import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireModuleApi } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { mapSuspectPhoto } from "@/lib/smart-police/investigation/photo-serialize";
import { SUSPECT_PHOTO_KINDS } from "@/lib/smart-police/investigation/photo-types";

const MAX_BYTES = 8 * 1024 * 1024;

type Kind = "jpeg" | "png" | "gif" | "webp";

function detectKind(buf: Buffer): Kind | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "gif";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

const EXT: Record<Kind, string> = { jpeg: "jpg", png: "png", gif: "gif", webp: "webp" };

/** GET — รูปทั้งหมดของบุคคลต้องสงสัย */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  const guard = await requireModuleApi(SMART_POLICE_MODULE_SLUG);
  if (guard) return guard;

  const { id } = await params;
  const rows = await prisma.smartPoliceSuspectPhoto.findMany({
    where: { suspectId: id, suspect: { ownerUserId: gate.ctx.ownerUserId } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ photos: rows.map(mapSuspectPhoto) });
}

/** POST — อัปโหลดรูป (multipart: file, kind?, caption?) */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  const guard = await requireModuleApi(SMART_POLICE_MODULE_SLUG);
  if (guard) return guard;

  const { id } = await params;
  const suspect = await prisma.smartPoliceSuspect.findFirst({
    where: { id, ownerUserId: gate.ctx.ownerUserId },
    select: { id: true },
  });
  if (!suspect) return NextResponse.json({ error: "ไม่พบบุคคลต้องสงสัย" }, { status: 404 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) return NextResponse.json({ error: "ไฟล์ว่าง" }, { status: 400 });
  if (buf.length > MAX_BYTES) return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 8MB" }, { status: 400 });

  const kind = detectKind(buf);
  if (!kind) return NextResponse.json({ error: "รองรับเฉพาะ JPG PNG GIF WEBP" }, { status: 400 });

  const rawKind = String(form.get("kind") ?? "FRONT").toUpperCase();
  const photoKind = SUSPECT_PHOTO_KINDS.includes(rawKind as never) ? rawKind : "FRONT";
  const caption = String(form.get("caption") ?? "").trim() || null;

  const dir = path.join(process.cwd(), "public", "uploads", "smart-police-suspects", id);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${EXT[kind]}`;
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buf);
  } catch {
    return NextResponse.json({ error: "บันทึกไฟล์ไม่สำเร็จ" }, { status: 500 });
  }

  const url = `/uploads/smart-police-suspects/${id}/${filename}`;
  const created = await prisma.smartPoliceSuspectPhoto.create({
    data: { suspectId: id, url, kind: photoKind, caption, bytes: buf.length },
  });

  // รูปแรกเป็นรูปหลักของโปรไฟล์
  const count = await prisma.smartPoliceSuspectPhoto.count({ where: { suspectId: id } });
  if (count === 1) {
    await prisma.smartPoliceSuspect.update({ where: { id }, data: { photoUrl: url } });
  }

  return NextResponse.json({ photo: mapSuspectPhoto(created) }, { status: 201 });
}

/** DELETE — ลบรูป (?photoId=) */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  const guard = await requireModuleApi(SMART_POLICE_MODULE_SLUG);
  if (guard) return guard;

  const { id } = await params;
  const photoId = (new URL(req.url).searchParams.get("photoId") ?? "").trim();
  if (!photoId) return NextResponse.json({ error: "ต้องระบุ photoId" }, { status: 400 });

  const row = await prisma.smartPoliceSuspectPhoto.findFirst({
    where: { id: photoId, suspectId: id, suspect: { ownerUserId: gate.ctx.ownerUserId } },
    select: { id: true, url: true },
  });
  if (!row) return NextResponse.json({ error: "ไม่พบรูป" }, { status: 404 });

  await prisma.smartPoliceSuspectPhoto.delete({ where: { id: photoId } });

  // ถ้าลบรูปหลัก ให้ตั้งรูปถัดไปเป็นรูปหลัก
  const suspect = await prisma.smartPoliceSuspect.findUnique({
    where: { id },
    select: { photoUrl: true, photos: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  if (suspect?.photoUrl === row.url) {
    await prisma.smartPoliceSuspect.update({
      where: { id },
      data: { photoUrl: suspect.photos[0]?.url ?? null },
    });
  }

  return NextResponse.json({ ok: true });
}
