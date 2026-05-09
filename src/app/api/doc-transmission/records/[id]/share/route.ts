import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { withDocOwnerContext } from "@/systems/doc-transmission/lib/doc-api";
import { generateShareToken } from "@/systems/doc-transmission/lib/doc-helpers";

export const dynamic = "force-dynamic";

function toBigInt(id: string): bigint | null {
  if (!/^\d+$/.test(id)) return null;
  try {
    return BigInt(id);
  } catch {
    return null;
  }
}

/** เปิด public share — สร้าง token ใหม่ ถ้ายังไม่มี */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withDocOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId, actorUserId, actorName } = auth.ctx;

  const { id } = await params;
  const idBig = toBigInt(id);
  if (idBig === null) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

  const existing = await prisma.docTransmissionRecord.findFirst({
    where: { id: idBig, ownerUserId, trialSessionId, isDeleted: false },
    select: { id: true, publicShareToken: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

  const setting = await prisma.docTransmissionSettings.findFirst({
    where: { ownerUserId, trialSessionId },
    select: { publicShareEnabled: true },
  });
  if (setting && !setting.publicShareEnabled) {
    return NextResponse.json({ error: "ปิดการแชร์ลิงก์ภายนอก (ดูที่ตั้งค่า)" }, { status: 400 });
  }

  const token = existing.publicShareToken ?? generateShareToken();
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.docTransmissionRecord.update({
      where: { id: idBig },
      data: {
        publicShareToken: token,
        publicShareEnabledAt: new Date(),
      },
    });
    await tx.docTransmissionAuditLog.create({
      data: {
        ownerUserId,
        trialSessionId,
        recordId: idBig,
        action: "SHARE_ENABLED",
        actorUserId,
        actorName,
        snapshot: { token } as Prisma.InputJsonValue,
      },
    });
    return u;
  });

  return NextResponse.json({
    token: updated.publicShareToken,
    publicUrl: `/share/doc-transmission/${updated.publicShareToken}`,
  });
}

/** ปิด public share — เคลียร์ token */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withDocOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId, actorUserId, actorName } = auth.ctx;

  const { id } = await params;
  const idBig = toBigInt(id);
  if (idBig === null) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

  const existing = await prisma.docTransmissionRecord.findFirst({
    where: { id: idBig, ownerUserId, trialSessionId, isDeleted: false },
    select: { id: true, publicShareToken: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบเอกสาร" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.docTransmissionRecord.update({
      where: { id: idBig },
      data: { publicShareToken: null, publicShareEnabledAt: null },
    });
    await tx.docTransmissionAuditLog.create({
      data: {
        ownerUserId,
        trialSessionId,
        recordId: idBig,
        action: "SHARE_DISABLED",
        actorUserId,
        actorName,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
