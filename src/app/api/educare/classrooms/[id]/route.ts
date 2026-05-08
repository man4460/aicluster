import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withEducareOwnerContext } from "@/systems/educare/lib/educare-api";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  const r = await withEducareOwnerContext();
  if (!r.ok) return r.res;

  const { id } = await params;
  const cid = Number(id);
  if (!Number.isFinite(cid) || cid <= 0) {
    return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });
  }

  const existing = await prisma.educareClassroom.findFirst({
    where: {
      id: cid,
      ownerUserId: r.ctx.ownerUserId,
      trialSessionId: r.ctx.trialSessionId,
    },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบห้องเรียน" }, { status: 404 });

  await prisma.educareClassroom.update({
    where: { id: cid },
    data: { isActive: false },
  });
  return NextResponse.json({ ok: true });
}
