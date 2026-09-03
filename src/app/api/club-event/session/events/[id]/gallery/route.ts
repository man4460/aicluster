import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";
import { clubEventGalleryFileName } from "@/systems/club-event/lib/gallery-filename";
import {
  assertClubEventGalleryCount,
  resolveClubEventMediaLimits,
} from "@/systems/club-event/lib/plan-limits";

type Ctx = { params: Promise<{ id: string }> };

const MAX_BYTES = 6 * 1024 * 1024;

export async function POST(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id: eventId } = await ctx.params;
    const { scope } = await clubEventSessionContext(own.ownerId);

    const event = await prisma.clubEventRecord.findFirst({
      where: { id: eventId, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
      select: { id: true },
    });
    if (!event) return NextResponse.json({ error: "ไม่พบกิจกรรม" }, { status: 404 });

    const limits = resolveClubEventMediaLimits(own.access);
    const galleryCount = await prisma.clubEventGalleryImage.count({ where: { eventId } });
    const gate = assertClubEventGalleryCount(galleryCount + 1, limits);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error, code: gate.code }, { status: 403 });
    }

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

    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_BYTES) {
      return NextResponse.json({ error: "ไฟล์ว่างหรือใหญ่เกิน 6MB" }, { status: 400 });
    }

    const isWebp =
      buf.length >= 12 &&
      buf.toString("ascii", 0, 4) === "RIFF" &&
      buf.toString("ascii", 8, 12) === "WEBP";
    if (!isWebp && file.type !== "image/webp") {
      return NextResponse.json({ error: "อัปโหลดแกลเลอรีต้องเป็น WebP" }, { status: 400 });
    }

    const fileName = clubEventGalleryFileName(own.ownerId, eventId);
    const dir = path.join(process.cwd(), "public", "uploads", "club-event", own.ownerId);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, fileName), buf);

    const imageUrl = `/uploads/club-event/${own.ownerId}/${fileName}`;
    const maxSort = await prisma.clubEventGalleryImage.aggregate({
      where: { eventId },
      _max: { sortOrder: true },
    });

    const row = await prisma.clubEventGalleryImage.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        eventId,
        imageUrl,
        fileName,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json({
      image: {
        id: row.id,
        eventId: row.eventId,
        imageUrl: row.imageUrl,
        fileName: row.fileName,
        sortOrder: row.sortOrder,
      },
    });
  } catch (e) {
    console.error("[club-event/session/events/[id]/gallery/upload]", e);
    return NextResponse.json({ error: "อัปโหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id: eventId } = await ctx.params;
    const { scope } = await clubEventSessionContext(own.ownerId);
    const url = new URL(req.url);
    const imageId = url.searchParams.get("imageId");
    if (!imageId) return NextResponse.json({ error: "ไม่มี imageId" }, { status: 400 });

    const row = await prisma.clubEventGalleryImage.findFirst({
      where: {
        id: imageId,
        eventId,
        ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId),
      },
    });
    if (!row) return NextResponse.json({ error: "ไม่พบรูป" }, { status: 404 });

    await prisma.clubEventGalleryImage.delete({ where: { id: imageId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[club-event/session/events/[id]/gallery DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
