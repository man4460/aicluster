import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withMediaRegistryAuth } from "@/systems/media-registry/lib/api-context";
import { MEDIA_REGISTRY_BORROW_STATUS } from "@/systems/media-registry/lib/constants";
import { recalcMediaItemStatus } from "@/systems/media-registry/lib/status";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  const { id } = await ctx.params;
  const body = (await req.json()) as { quantityReturn?: number; conditionAfter?: string; note?: string };

  const borrow = await prisma.mediaRegistryBorrow.findFirst({
    where: { id, ownerUserId: auth.userId },
  });
  if (!borrow) return NextResponse.json({ error: "ไม่พบรายการยืม" }, { status: 404 });
  if (borrow.borrowStatus === MEDIA_REGISTRY_BORROW_STATUS.RETURNED) {
    return NextResponse.json({ error: "รายการนี้คืนครบแล้ว" }, { status: 409 });
  }

  const additional = Number(body.quantityReturn);
  if (!Number.isFinite(additional) || additional <= 0) {
    return NextResponse.json({ error: "ต้องระบุจำนวนคืนให้ถูกต้อง" }, { status: 400 });
  }

  const newCumulative = borrow.quantityReturn + additional;
  if (newCumulative > borrow.quantityBorrow) {
    return NextResponse.json({ error: "จำนวนคืนรวมเกินจำนวนที่ยืม" }, { status: 400 });
  }

  const media = await prisma.mediaRegistryItem.findFirst({
    where: { id: borrow.mediaId, ownerUserId: auth.userId },
  });
  if (!media) return NextResponse.json({ error: "ไม่พบสื่อ" }, { status: 404 });

  const newAvail = media.quantityAvailable + additional;
  if (newAvail > media.quantityTotal) {
    return NextResponse.json({ error: "ข้อมูลจำนวนสื่อไม่สอดคล้อง — ตรวจสอบทะเบียน" }, { status: 409 });
  }

  const fullyReturned = newCumulative >= borrow.quantityBorrow;
  const nextStatus = fullyReturned
    ? MEDIA_REGISTRY_BORROW_STATUS.RETURNED
    : MEDIA_REGISTRY_BORROW_STATUS.PARTIAL;

  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.mediaRegistryBorrow.update({
      where: { id },
      data: {
        quantityReturn: newCumulative,
        borrowStatus: nextStatus,
        returnDate: fullyReturned ? new Date() : borrow.returnDate,
        conditionAfter:
          body.conditionAfter !== undefined
            ? body.conditionAfter.trim() || null
            : borrow.conditionAfter,
        receiverName: borrow.receiverName,
        note: body.note !== undefined ? body.note.trim() || borrow.note : borrow.note,
      },
    });
    await tx.mediaRegistryItem.update({
      where: { id: media.id },
      data: {
        quantityAvailable: newAvail,
        mediaStatus: recalcMediaItemStatus({
          quantityTotal: media.quantityTotal,
          quantityAvailable: newAvail,
          mediaStatus: media.mediaStatus,
        }),
      },
    });
    return updated;
  });

  const full = await prisma.mediaRegistryBorrow.findFirst({
    where: { id: row.id },
    include: { media: { select: { registerNo: true } } },
  });

  return NextResponse.json({
    item: full
      ? {
          ...full,
          registerNo: full.media.registerNo,
          borrowDate: full.borrowDate.toISOString(),
          dueDate: full.dueDate?.toISOString() ?? null,
          returnDate: full.returnDate?.toISOString() ?? null,
        }
      : null,
  });
}
