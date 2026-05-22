import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isMassageCustomerPortalOpenForOwner } from "@/lib/massage/portal-access";
import { createMassageBookingForPortal } from "@/lib/massage/portal-create-booking";
import { MASSAGE_MODULE_SLUG } from "@/lib/modules/config";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";
import { isPrismaSchemaMismatch, THAI_PRISMA_SCHEMA_MISMATCH } from "@/lib/prisma-schema-mismatch";

const bodySchema = z.object({
  ownerId: z.string().min(10).max(64),
  phone: z.string().min(1).max(32),
  scheduledAtLocal: z.string().min(10).max(40),
  customerName: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => {
      if (v == null || v === undefined) return null;
      const t = String(v).trim();
      return t.length > 0 ? t.slice(0, 100) : null;
    }),
  massageCustomerId: z.number().int().positive().optional().nullable(),
});

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบหรือรูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const { ownerId } = parsed.data;

  const rl = rateLimit(`massage-portal-book:${ip}:${ownerId}`, 12, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "จองถี่เกินไป กรุณารอสักครู่" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const portalOk = await isMassageCustomerPortalOpenForOwner(ownerId);
  if (!portalOk) {
    return NextResponse.json({ error: "ไม่สามารถจองได้ในขณะนี้" }, { status: 403 });
  }

  const scope = await resolveDataScopeBySlug(ownerId, MASSAGE_MODULE_SLUG);

  try {
    const out = await createMassageBookingForPortal(prisma, ownerId, scope.trialSessionId, {
      phone: parsed.data.phone,
      scheduledAtLocal: parsed.data.scheduledAtLocal,
      customerName: parsed.data.customerName,
      massageCustomerId: parsed.data.massageCustomerId ?? null,
    });
    if (!out.ok) {
      return NextResponse.json({ error: out.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true as const, booking: out.booking });
  } catch (e) {
    console.error("[massage/public/portal/book]", e);
    if (isPrismaSchemaMismatch(e)) {
      return NextResponse.json({ error: THAI_PRISMA_SCHEMA_MISMATCH }, { status: 503 });
    }
    return NextResponse.json({ error: "จองคิวไม่สำเร็จ — ลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
