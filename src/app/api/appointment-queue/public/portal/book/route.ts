import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAppointmentQueueBookingForPortal } from "@/lib/appointment-queue/portal-create-booking";
import { isAppointmentQueuePortalOpenForOwner } from "@/lib/appointment-queue/portal-access";
import { APPOINTMENT_QUEUE_MODULE_SLUG } from "@/lib/modules/config";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isPrismaSchemaMismatch, THAI_PRISMA_SCHEMA_MISMATCH } from "@/lib/prisma-schema-mismatch";

const bodySchema = z.object({
  ownerId: z.string().min(10).max(64),
  phone: z.string().min(1).max(32),
  scheduledAtLocal: z.string().min(10).max(40),
  serviceId: z.number().int().positive(),
  staffId: z.number().int().positive().optional().nullable(),
  customerName: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => {
      if (v == null || v === undefined) return null;
      const t = String(v).trim();
      return t.length > 0 ? t.slice(0, 120) : null;
    }),
  note: z.string().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบหรือรูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const { ownerId } = parsed.data;
  const rl = rateLimit(`aq-portal-book:${ip}:${ownerId}`, 12, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "จองถี่เกินไป" }, { status: 429 });

  const portalOk = await isAppointmentQueuePortalOpenForOwner(ownerId);
  if (!portalOk) return NextResponse.json({ error: "ไม่สามารถจองได้" }, { status: 403 });

  const scope = await resolveDataScopeBySlug(ownerId, APPOINTMENT_QUEUE_MODULE_SLUG);

  try {
    const out = await createAppointmentQueueBookingForPortal(
      prisma,
      ownerId,
      scope.trialSessionId,
      {
        phone: parsed.data.phone,
        scheduledAtLocal: parsed.data.scheduledAtLocal,
        serviceId: parsed.data.serviceId,
        staffId: parsed.data.staffId ?? null,
        customerName: parsed.data.customerName,
        note: parsed.data.note ?? null,
      },
    );
    if (!out.ok) return NextResponse.json({ error: out.error }, { status: 400 });
    return NextResponse.json({ ok: true as const, booking: out.booking });
  } catch (e) {
    console.error("[appointment-queue/public/portal/book]", e);
    if (isPrismaSchemaMismatch(e)) {
      return NextResponse.json({ error: THAI_PRISMA_SCHEMA_MISMATCH }, { status: 503 });
    }
    return NextResponse.json({ error: "จองไม่สำเร็จ — ลองใหม่" }, { status: 500 });
  }
}
