import { NextResponse } from "next/server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";

import { updateAppointmentQueueBookingFromDashboard } from "@/lib/appointment-queue/dashboard-booking-mutate";

import {

  assertAppointmentQueueBookingOwned,

  getAppointmentQueueOwnerContext,

} from "@/systems/appointment-queue/lib/api-auth";



const patchSchema = z.object({

  serviceId: z.number().int().positive().optional(),

  scheduledAtLocal: z.string().min(10).max(32).optional(),

  phone: z.string().min(9).max(20).optional(),

  customerName: z.string().max(120).optional().nullable(),

  note: z.string().max(500).optional().nullable(),

});



export async function PATCH(

  req: Request,

  ctx: { params: Promise<{ id: string }> },

) {

  const owner = await getAppointmentQueueOwnerContext();

  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });



  const { id: idRaw } = await ctx.params;

  const id = Number(idRaw);

  if (!Number.isFinite(id)) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });



  let json: unknown;

  try {

    json = await req.json();

  } catch {

    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });

  }

  const parsed = patchSchema.safeParse(json);

  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });



  const row = await assertAppointmentQueueBookingOwned(

    id,

    owner.userId,

    owner.scope.trialSessionId,

  );

  if (!row) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });



  const result = await updateAppointmentQueueBookingFromDashboard(

    prisma,

    owner.userId,

    owner.scope.trialSessionId,

    id,

    parsed.data,

  );

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });



  return NextResponse.json({ ok: true });

}



export async function DELETE(

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



  await prisma.appointmentQueueBooking.update({

    where: { id: row.id },

    data: { status: "CANCELLED" },

  });



  return NextResponse.json({ ok: true });

}


