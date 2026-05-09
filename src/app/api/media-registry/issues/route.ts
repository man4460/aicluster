import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { withMediaRegistryAuth } from "@/systems/media-registry/lib/api-context";
import { recalcMediaItemStatus } from "@/systems/media-registry/lib/status";
import { decString } from "@/systems/media-registry/lib/serialize";

function parseDate(s: string | undefined): Date | null {
  if (!s?.trim()) return null;
  const d = new Date(`${s.trim()}T12:00:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  const { searchParams } = new URL(req.url);
  const recordType = searchParams.get("recordType")?.trim();

  const rows = await prisma.mediaRegistryIssue.findMany({
    where: { ownerUserId: auth.userId, ...(recordType ? { recordType } : {}) },
    orderBy: [{ recordDate: "desc" }, { createdAt: "desc" }],
    include: { media: { select: { registerNo: true } } },
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      ...r,
      registerNo: r.media.registerNo,
      cost: decString(r.cost)!,
      recordDate: r.recordDate.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  const body = (await req.json()) as Record<string, unknown>;

  const mediaId = typeof body.mediaId === "string" ? body.mediaId.trim() : "";
  const recordType = typeof body.recordType === "string" ? body.recordType.trim() : "";
  if (!mediaId || !recordType) {
    return NextResponse.json({ error: "ต้องระบุสื่อและประเภทบันทึก" }, { status: 400 });
  }

  const recordDate = parseDate(typeof body.recordDate === "string" ? body.recordDate : undefined);
  if (!recordDate) {
    return NextResponse.json({ error: "ต้องระบุวันที่บันทึก" }, { status: 400 });
  }

  const quantityAffected = body.quantityAffected != null ? Number(body.quantityAffected) : 1;
  if (!Number.isFinite(quantityAffected) || quantityAffected <= 0) {
    return NextResponse.json({ error: "จำนวนที่เกิดเรื่องไม่ถูกต้อง" }, { status: 400 });
  }

  const cost = new Prisma.Decimal(String(body.cost ?? 0));
  const detail = typeof body.detail === "string" ? body.detail.trim() || null : null;
  const repairStatus =
    typeof body.repairStatus === "string" ? body.repairStatus.trim() || null : null;

  const media = await prisma.mediaRegistryItem.findFirst({
    where: { id: mediaId, ownerUserId: auth.userId },
  });
  if (!media) return NextResponse.json({ error: "ไม่พบรายการสื่อ" }, { status: 404 });

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.mediaRegistryIssue.create({
      data: {
        ownerUserId: auth.userId,
        mediaId: media.id,
        mediaName: media.mediaName,
        recordType,
        quantityAffected,
        cost,
        detail,
        repairStatus,
        recordDate,
      },
    });

    if (recordType === "ซ่อมบำรุง" && repairStatus === "เสร็จสิ้น") {
      await tx.mediaRegistryItem.update({
        where: { id: media.id },
        data: {
          mediaStatus: recalcMediaItemStatus({
            quantityTotal: media.quantityTotal,
            quantityAvailable: media.quantityAvailable,
            mediaStatus: "พร้อมใช้งาน",
          }),
        },
      });
    } else if (recordType === "ชำรุด") {
      const loseAvail = Math.min(quantityAffected, media.quantityAvailable);
      const newTotal = Math.max(0, media.quantityTotal - quantityAffected);
      const newAvail = Math.max(0, media.quantityAvailable - loseAvail);
      const cappedAvail = Math.min(newAvail, newTotal);
      await tx.mediaRegistryItem.update({
        where: { id: media.id },
        data: {
          quantityTotal: newTotal,
          quantityAvailable: cappedAvail,
          mediaStatus: "ชำรุด",
        },
      });
    } else if (recordType === "สูญหาย" || recordType === "จำหน่าย") {
      const q = Math.min(quantityAffected, media.quantityTotal);
      const newTotal = Math.max(0, media.quantityTotal - q);
      const newAvail = Math.max(0, media.quantityAvailable - Math.min(q, media.quantityAvailable));
      const cappedAvail = Math.min(newAvail, newTotal);
      await tx.mediaRegistryItem.update({
        where: { id: media.id },
        data: {
          quantityTotal: newTotal,
          quantityAvailable: cappedAvail,
          mediaStatus: recordType,
        },
      });
    }

    return created;
  });

  const full = await prisma.mediaRegistryIssue.findFirst({
    where: { id: row.id },
    include: { media: { select: { registerNo: true } } },
  });

  return NextResponse.json({
    item: full
      ? {
          ...full,
          registerNo: full.media.registerNo,
          cost: decString(full.cost)!,
          recordDate: full.recordDate.toISOString(),
        }
      : null,
  });
}
