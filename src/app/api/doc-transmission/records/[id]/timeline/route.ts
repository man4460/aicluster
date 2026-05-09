import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { withDocOwnerContext } from "@/systems/doc-transmission/lib/doc-api";

export const dynamic = "force-dynamic";

const TimelineSchema = z.object({
  action: z.enum([
    "RECEIVED",
    "REGISTERED",
    "ASSIGNED",
    "IN_TRANSIT",
    "SIGNED",
    "DELIVERED",
    "COMPLETED",
    "CANCELED",
    "NOTE",
  ]),
  note: z.string().trim().max(2000).nullable().optional(),
  /** ถ้า action เป็น COMPLETED/CANCELED ระบบจะอัปเดตสถานะ record ให้ DONE/CANCELED ด้วย */
  syncStatus: z.boolean().optional(),
});

function toBigInt(id: string): bigint | null {
  if (!/^\d+$/.test(id)) return null;
  try {
    return BigInt(id);
  } catch {
    return null;
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withDocOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId, actorUserId, actorName } = auth.ctx;

  const { id } = await params;
  const idBig = toBigInt(id);
  if (idBig === null) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = TimelineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.docTransmissionRecord.findFirst({
    where: { id: idBig, ownerUserId, trialSessionId, isDeleted: false },
    select: { id: true, status: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

  const result = await prisma.$transaction(async (tx) => {
    const tl = await tx.docTransmissionTimelineEntry.create({
      data: {
        recordId: idBig,
        ownerUserId,
        trialSessionId,
        action: parsed.data.action,
        note: parsed.data.note ?? null,
        actorUserId,
        actorName,
      },
    });

    let nextStatus: "DONE" | "CANCELED" | null = null;
    if (parsed.data.syncStatus !== false) {
      if (parsed.data.action === "COMPLETED") nextStatus = "DONE";
      if (parsed.data.action === "CANCELED") nextStatus = "CANCELED";
    }

    if (nextStatus && existing.status !== nextStatus) {
      await tx.docTransmissionRecord.update({
        where: { id: idBig },
        data: { status: nextStatus },
      });
      await tx.docTransmissionAuditLog.create({
        data: {
          ownerUserId,
          trialSessionId,
          recordId: idBig,
          action: "STATUS_CHANGE",
          actorUserId,
          actorName,
          snapshot: {
            before: { status: existing.status },
            after: { status: nextStatus },
            via: "timeline",
          } as Prisma.InputJsonValue,
        },
      });
    }

    await tx.docTransmissionAuditLog.create({
      data: {
        ownerUserId,
        trialSessionId,
        recordId: idBig,
        action: "TIMELINE_ADDED",
        actorUserId,
        actorName,
        snapshot: { timelineAction: parsed.data.action } as Prisma.InputJsonValue,
      },
    });

    return tl;
  });

  return NextResponse.json({
    entry: { ...result, id: result.id.toString(), recordId: result.recordId.toString() },
  });
}
