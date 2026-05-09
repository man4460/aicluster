import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withDocOwnerContext } from "@/systems/doc-transmission/lib/doc-api";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withDocOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;

  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum) || idNum <= 0) {
    return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });
  }

  const found = await prisma.docTransmissionDepartment.findFirst({
    where: { id: idNum, ownerUserId, trialSessionId },
    select: { id: true },
  });
  if (!found) return NextResponse.json({ error: "ไม่พบหน่วยงาน" }, { status: 404 });

  // soft delete
  await prisma.docTransmissionDepartment.update({
    where: { id: idNum },
    data: { isActive: false },
  });
  return NextResponse.json({ ok: true });
}
