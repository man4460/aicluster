import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { withDocOwnerContext } from "@/systems/doc-transmission/lib/doc-api";

export const dynamic = "force-dynamic";

const ReplaceSchema = z.object({
  fileUrl: z.string().trim().min(1).max(512),
  fileName: z.string().trim().min(1).max(255),
  fileSize: z.number().int().nonnegative().optional(),
  note: z.string().trim().max(2000).nullable().optional(),
});

function toBigInt(id: string): bigint | null {
  if (!/^\d+$/.test(id)) return null;
  try {
    return BigInt(id);
  } catch {
    return null;
  }
}

/** บันทึกไฟล์แนบเวอร์ชันใหม่ — เก็บ revision history และอัปเดต record.attachmentUrl/Name */
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
  const parsed = ReplaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.docTransmissionRecord.findFirst({
    where: { id: idBig, ownerUserId, trialSessionId, isDeleted: false },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

  const lastRev = await prisma.docTransmissionAttachmentRevision.findFirst({
    where: { recordId: idBig },
    orderBy: { versionNo: "desc" },
    select: { versionNo: true },
  });
  const nextVersion = (lastRev?.versionNo ?? 0) + 1;

  const result = await prisma.$transaction(async (tx) => {
    const rev = await tx.docTransmissionAttachmentRevision.create({
      data: {
        recordId: idBig,
        ownerUserId,
        trialSessionId,
        fileUrl: parsed.data.fileUrl,
        fileName: parsed.data.fileName,
        fileSize: parsed.data.fileSize ?? null,
        mimeType: "application/pdf",
        versionNo: nextVersion,
        note: parsed.data.note ?? null,
        uploadedByUserId: actorUserId,
        uploadedByName: actorName,
      },
    });
    await tx.docTransmissionRecord.update({
      where: { id: idBig },
      data: {
        attachmentUrl: parsed.data.fileUrl,
        attachmentName: parsed.data.fileName,
      },
    });
    await tx.docTransmissionTimelineEntry.create({
      data: {
        recordId: idBig,
        ownerUserId,
        trialSessionId,
        action: "FILE_REPLACED",
        note: `เพิ่มไฟล์ v${nextVersion}: ${parsed.data.fileName}`,
        actorUserId,
        actorName,
      },
    });
    await tx.docTransmissionAuditLog.create({
      data: {
        ownerUserId,
        trialSessionId,
        recordId: idBig,
        action: "FILE_REPLACE",
        actorUserId,
        actorName,
        snapshot: {
          version: nextVersion,
          fileName: parsed.data.fileName,
          fileSize: parsed.data.fileSize ?? null,
        } as Prisma.InputJsonValue,
      },
    });
    return rev;
  });

  return NextResponse.json({
    revision: { ...result, id: result.id.toString(), recordId: result.recordId.toString() },
  });
}
