import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withMediaRegistryAuth } from "@/systems/media-registry/lib/api-context";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    masterType?: string;
    masterName?: string;
    status?: string;
    sortOrder?: number;
  };

  const existing = await prisma.mediaRegistryMaster.findFirst({
    where: { id, ownerUserId: auth.userId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  const row = await prisma.mediaRegistryMaster.update({
    where: { id },
    data: {
      ...(body.masterType !== undefined ? { masterType: body.masterType.trim() } : {}),
      ...(body.masterName !== undefined ? { masterName: body.masterName.trim() } : {}),
      ...(body.status !== undefined ? { status: body.status.trim() } : {}),
      ...(typeof body.sortOrder === "number" ? { sortOrder: body.sortOrder } : {}),
    },
  });
  return NextResponse.json({ item: row });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  const { id } = await ctx.params;
  const existing = await prisma.mediaRegistryMaster.findFirst({
    where: { id, ownerUserId: auth.userId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
  await prisma.mediaRegistryMaster.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
