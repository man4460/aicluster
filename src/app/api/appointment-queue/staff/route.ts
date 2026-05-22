import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAppointmentQueueOwnerContext } from "@/systems/appointment-queue/lib/api-auth";

const postSchema = z.object({ name: z.string().min(1).max(120) });

export async function GET() {
  const owner = await getAppointmentQueueOwnerContext();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.appointmentQueueStaff.findMany({
    where: { ownerUserId: owner.userId, trialSessionId: owner.scope.trialSessionId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  return NextResponse.json({
    staff: rows.map((r) => ({ id: r.id, name: r.name, isActive: r.isActive })),
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
  const maxSort = await prisma.appointmentQueueStaff.aggregate({
    where: { ownerUserId: owner.userId, trialSessionId: owner.scope.trialSessionId },
    _max: { sortOrder: true },
  });
  const row = await prisma.appointmentQueueStaff.create({
    data: {
      ownerUserId: owner.userId,
      trialSessionId: owner.scope.trialSessionId,
      name: parsed.data.name.trim(),
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json({ staff: { id: row.id, name: row.name } });
}
