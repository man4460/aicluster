import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { massageOwnerFromAuth } from "@/lib/massage/api-owner";
import { prismaErrorToApiMessage } from "@/lib/prisma-api-error";
import { getMassageDataScope } from "@/lib/trial/module-scopes";

const patchSchema = z.object({
  name: z.string().min(1).max(120),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  const own = await massageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getMassageDataScope(own.ownerId);
  const { id: idRaw } = await ctx.params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const existing = await prisma.massageCostCategory.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  try {
    const row = await prisma.massageCostCategory.update({
      where: { id },
      data: { name: parsed.data.name.trim() },
    });
    return NextResponse.json({
      category: {
        id: row.id,
        name: row.name,
        created_at: row.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error("massage/cost-categories PATCH", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json(
      { error: msg ?? "แก้ไขหมวดต้นทุนไม่สำเร็จ" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  const own = await massageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getMassageDataScope(own.ownerId);
  const { id: idRaw } = await ctx.params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  const existing = await prisma.massageCostCategory.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

  try {
    await prisma.massageCostCategory.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("massage/cost-categories DELETE", e);
    const msg = prismaErrorToApiMessage(e);
    return NextResponse.json(
      { error: msg ?? "ลบหมวดต้นทุนไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
