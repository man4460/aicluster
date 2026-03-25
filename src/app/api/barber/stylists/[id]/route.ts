import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { writeSystemActivityLog } from "@/lib/audit-log";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(20).optional().nullable(),
  isActive: z.boolean().optional(),
});

function phoneOrNull(raw: string | null): string | null {
  if (raw == null || raw.trim() === "") return null;
  const d = raw.replace(/\D/g, "").slice(0, 20);
  return d.length > 0 ? d : null;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ไม่ถูกต้อง" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const existing = await prisma.barberStylist.findFirst({
    where: { id, ownerUserId: own.ownerId },
  });
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบช่าง" }, { status: 404 });
  }

  const data: { name?: string; phone?: string | null; isActive?: boolean } = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
  if (parsed.data.phone !== undefined) data.phone = phoneOrNull(parsed.data.phone);
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

  const s = await prisma.barberStylist.update({
    where: { id },
    data,
  });
  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "UPDATE",
    modelName: "BarberStylist",
    payload: { id, ownerUserId: own.ownerId, changes: data },
  });

  return NextResponse.json({
    stylist: {
      id: s.id,
      name: s.name,
      phone: s.phone,
      isActive: s.isActive,
    },
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ไม่ถูกต้อง" }, { status: 400 });
  }
  const existing = await prisma.barberStylist.findFirst({
    where: { id, ownerUserId: own.ownerId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบช่าง" }, { status: 404 });
  await prisma.barberStylist.delete({ where: { id } });
  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "DELETE",
    modelName: "BarberStylist",
    payload: { id, ownerUserId: own.ownerId },
  });
  return NextResponse.json({ ok: true });
}
