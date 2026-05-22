import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAppointmentQueueOwnerContext } from "@/systems/appointment-queue/lib/api-auth";

const postSchema = z.object({
  name: z.string().min(1).max(160),
  durationMinutes: z.number().int().min(15).max(480).default(60),
  priceBaht: z.number().min(0).optional().nullable(),
  depositBaht: z.number().min(0).optional().nullable(),
});

export async function GET() {
  const owner = await getAppointmentQueueOwnerContext();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.appointmentQueueService.findMany({
    where: { ownerUserId: owner.userId, trialSessionId: owner.scope.trialSessionId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return NextResponse.json({
    services: rows.map((r) => ({
      id: r.id,
      name: r.name,
      durationMinutes: r.durationMinutes,
      priceBaht: r.priceBaht != null ? Number(r.priceBaht) : null,
      depositBaht: r.depositBaht != null ? Number(r.depositBaht) : null,
      isActive: r.isActive,
    })),
  });
}

export async function POST(req: Request) {
  const owner = await getAppointmentQueueOwnerContext();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  const maxSort = await prisma.appointmentQueueService.aggregate({
    where: { ownerUserId: owner.userId, trialSessionId: owner.scope.trialSessionId },
    _max: { sortOrder: true },
  });
  const row = await prisma.appointmentQueueService.create({
    data: {
      ownerUserId: owner.userId,
      trialSessionId: owner.scope.trialSessionId,
      name: parsed.data.name.trim(),
      durationMinutes: parsed.data.durationMinutes,
      priceBaht: parsed.data.priceBaht ?? null,
      depositBaht: parsed.data.depositBaht ?? null,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json({ service: { id: row.id, name: row.name } });
}
