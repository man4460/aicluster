import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAppointmentQueueOwnerContext } from "@/systems/appointment-queue/lib/api-auth";

const patchSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  durationMinutes: z.number().int().min(15).max(480).optional(),
  priceBaht: z.number().min(0).optional().nullable(),
  depositBaht: z.number().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
});

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const owner = await getAppointmentQueueOwnerContext();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบบริการ" }, { status: 404 });

  const existing = await prisma.appointmentQueueService.findFirst({
    where: { id, ownerUserId: owner.userId, trialSessionId: owner.scope.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบบริการ" }, { status: 404 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const d = parsed.data;
  const row = await prisma.appointmentQueueService.update({
    where: { id },
    data: {
      ...(d.name !== undefined && { name: d.name.trim() }),
      ...(d.durationMinutes !== undefined && { durationMinutes: d.durationMinutes }),
      ...(d.priceBaht !== undefined && { priceBaht: d.priceBaht }),
      ...(d.depositBaht !== undefined && { depositBaht: d.depositBaht }),
      ...(d.isActive !== undefined && { isActive: d.isActive }),
    },
  });

  return NextResponse.json({
    service: {
      id: row.id,
      name: row.name,
      durationMinutes: row.durationMinutes,
      priceBaht: row.priceBaht != null ? Number(row.priceBaht) : null,
      depositBaht: row.depositBaht != null ? Number(row.depositBaht) : null,
      isActive: row.isActive,
    },
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const owner = await getAppointmentQueueOwnerContext();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบบริการ" }, { status: 404 });

  const existing = await prisma.appointmentQueueService.findFirst({
    where: { id, ownerUserId: owner.userId, trialSessionId: owner.scope.trialSessionId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบบริการ" }, { status: 404 });

  const refs = await prisma.appointmentQueueBooking.count({
    where: { serviceId: id, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
  });
  if (refs > 0) {
    await prisma.appointmentQueueService.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ ok: true, softDeleted: true });
  }

  await prisma.appointmentQueueService.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
