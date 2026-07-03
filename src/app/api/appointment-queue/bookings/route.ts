import { NextResponse } from "next/server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";

import { createAppointmentQueueBookingFromDashboard } from "@/lib/appointment-queue/dashboard-booking-mutate";

import {

  bangkokTodayDateKey,

  loadAppointmentQueueDashboard,

} from "@/systems/appointment-queue/lib/load-dashboard";

import { getAppointmentQueueOwnerContext } from "@/systems/appointment-queue/lib/api-auth";



const postSchema = z.object({

  serviceId: z.number().int().positive(),

  scheduledAtLocal: z.string().min(10).max(32),

  phone: z.string().min(9).max(20),

  customerName: z.string().max(120).optional().nullable(),

  note: z.string().max(500).optional().nullable(),

});



export async function GET(req: Request) {

  const owner = await getAppointmentQueueOwnerContext();

  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });



  const dateKey =

    new URL(req.url).searchParams.get("dateKey")?.trim() || bangkokTodayDateKey();

  const data = await loadAppointmentQueueDashboard(

    owner.userId,

    owner.scope.trialSessionId,

    dateKey,

  );

  if (!data) return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });

  return NextResponse.json(data);

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



  const result = await createAppointmentQueueBookingFromDashboard(

    prisma,

    owner.userId,

    owner.scope.trialSessionId,

    parsed.data,

  );

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });



  return NextResponse.json({ ok: true, id: result.id });

}


