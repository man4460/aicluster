import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertAppointmentQueueBookingOwned,
  getAppointmentQueueOwnerContext,
} from "@/systems/appointment-queue/lib/api-auth";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const owner = await getAppointmentQueueOwnerContext();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: idRaw } = await ctx.params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  const row = await assertAppointmentQueueBookingOwned(
    id,
    owner.userId,
    owner.scope.trialSessionId,
  );
  if (!row) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
  if (row.status !== "PENDING_DEPOSIT") {
    return NextResponse.json({ error: "รายการนี้ไม่รอมัดจำ" }, { status: 400 });
  }

  const updated = await prisma.appointmentQueueBooking.update({
    where: { id: row.id },
    data: {
      status: "CONFIRMED",
      depositPaidAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, booking: { id: updated.id, status: updated.status } });
}
