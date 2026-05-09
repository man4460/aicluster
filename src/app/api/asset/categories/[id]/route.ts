import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAssetOwnerContext } from "@/systems/asset/lib/asset-api";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAssetOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId, trialSessionId } = auth.ctx;
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum) || idNum <= 0) {
    return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });
  }

  const found = await prisma.assetCategory.findFirst({
    where: { id: idNum, ownerUserId, trialSessionId },
    select: { id: true },
  });
  if (!found) return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });

  await prisma.assetCategory.update({
    where: { id: idNum },
    data: { isActive: false },
  });
  return NextResponse.json({ ok: true });
}
