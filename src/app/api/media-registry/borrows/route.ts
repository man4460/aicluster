import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withMediaRegistryAuth } from "@/systems/media-registry/lib/api-context";
import { MEDIA_REGISTRY_BORROW_STATUS } from "@/systems/media-registry/lib/constants";
import { nextBorrowNo } from "@/systems/media-registry/lib/id-generators";
import { recalcMediaItemStatus } from "@/systems/media-registry/lib/status";
import { syncMediaRegistryOverdueBorrows } from "@/systems/media-registry/lib/sync-overdue";

function parseDate(s: string | undefined): Date | null {
  if (!s?.trim()) return null;
  const d = new Date(`${s.trim()}T12:00:00+07:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  await syncMediaRegistryOverdueBorrows(auth.userId);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.trim();

  const rows = await prisma.mediaRegistryBorrow.findMany({
    where: {
      ownerUserId: auth.userId,
      ...(status ? { borrowStatus: status } : {}),
    },
    orderBy: [{ borrowDate: "desc" }, { createdAt: "desc" }],
    include: { media: { select: { registerNo: true } } },
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      ...r,
      registerNo: r.media.registerNo,
      borrowDate: r.borrowDate.toISOString(),
      dueDate: r.dueDate?.toISOString() ?? null,
      returnDate: r.returnDate?.toISOString() ?? null,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  const body = (await req.json()) as Record<string, unknown>;

  const mediaId = typeof body.mediaId === "string" ? body.mediaId.trim() : "";
  const borrowerName = typeof body.borrowerName === "string" ? body.borrowerName.trim() : "";
  const quantityBorrow = Number(body.quantityBorrow);
  if (!mediaId || !borrowerName) {
    return NextResponse.json({ error: "ต้องระบุสื่อและผู้ยืม" }, { status: 400 });
  }
  if (!Number.isFinite(quantityBorrow) || quantityBorrow <= 0) {
    return NextResponse.json({ error: "จำนวนยืมไม่ถูกต้อง" }, { status: 400 });
  }

  const borrowDate = parseDate(typeof body.borrowDate === "string" ? body.borrowDate : undefined);
  if (!borrowDate) {
    return NextResponse.json({ error: "ต้องระบุวันที่ยืม" }, { status: 400 });
  }
  const dueDate = parseDate(typeof body.dueDate === "string" ? body.dueDate : undefined);

  try {
    const row = await prisma.$transaction(async (tx) => {
      const media = await tx.mediaRegistryItem.findFirst({
        where: { id: mediaId, ownerUserId: auth.userId },
      });
      if (!media) throw new Error("NOT_FOUND_MEDIA");
      if (quantityBorrow > media.quantityAvailable) {
        throw new Error("INSUFFICIENT_QTY");
      }

      const borrowNo = nextBorrowNo();
      const created = await tx.mediaRegistryBorrow.create({
        data: {
          ownerUserId: auth.userId,
          borrowNo,
          mediaId: media.id,
          mediaName: media.mediaName,
          borrowerName,
          borrowerId: typeof body.borrowerId === "string" ? body.borrowerId.trim() || null : null,
          borrowerType:
            typeof body.borrowerType === "string" && body.borrowerType.trim()
              ? body.borrowerType.trim()
              : "ครู",
          quantityBorrow,
          borrowDate,
          dueDate,
          purpose: typeof body.purpose === "string" ? body.purpose.trim() || null : null,
          conditionBefore:
            typeof body.conditionBefore === "string" ? body.conditionBefore.trim() || null : null,
          approveBy: typeof body.approveBy === "string" ? body.approveBy.trim() || null : null,
          borrowStatus: MEDIA_REGISTRY_BORROW_STATUS.ACTIVE,
          note: typeof body.note === "string" ? body.note.trim() || null : null,
        },
      });

      const newAvail = media.quantityAvailable - quantityBorrow;
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

      return created;
    });

    const full = await prisma.mediaRegistryBorrow.findFirst({
      where: { id: row.id },
      include: { media: { select: { registerNo: true } } },
    });
    if (!full) return NextResponse.json({ error: "สร้างไม่สำเร็จ" }, { status: 500 });

    return NextResponse.json({
      item: {
        ...full,
        registerNo: full.media.registerNo,
        borrowDate: full.borrowDate.toISOString(),
        dueDate: full.dueDate?.toISOString() ?? null,
        returnDate: full.returnDate?.toISOString() ?? null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND_MEDIA") {
      return NextResponse.json({ error: "ไม่พบรายการสื่อ" }, { status: 404 });
    }
    if (msg === "INSUFFICIENT_QTY") {
      return NextResponse.json({ error: "จำนวนคงเหลือไม่พอสำหรับยืม" }, { status: 409 });
    }
    throw e;
  }
}
