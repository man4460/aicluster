import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isCarWashCustomerPortalOpenForOwner } from "@/lib/car-wash/portal-access";
import { createCarWashBookingForPortal } from "@/lib/car-wash/portal-create-booking";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";
import { isPrismaSchemaMismatch, THAI_PRISMA_SCHEMA_MISMATCH } from "@/lib/prisma-schema-mismatch";

const bodySchema = z.object({
  ownerId: z.string().min(10).max(64),
  phone: z.string().min(1).max(32),
  plateNumber: z.union([z.string(), z.null()]).optional(),
  scheduledAtLocal: z.string().min(10).max(40),
  packageId: z.number().int().min(1),
  customerName: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => {
      if (v == null || v === undefined) return null;
      const t = String(v).trim();
      return t.length > 0 ? t.slice(0, 160) : null;
    }),
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

  const rl = rateLimit(`car-wash-portal-book:${ip}:${ownerId}`, 12, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "จองถี่เกินไป กรุณารอสักครู่" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const portalOk = await isCarWashCustomerPortalOpenForOwner(ownerId);
  if (!portalOk) {
    return NextResponse.json({ error: "ไม่สามารถจองได้ในขณะนี้" }, { status: 403 });
  }

  const scope = await getCarWashDataScope(ownerId);

  try {
    const out = await createCarWashBookingForPortal(prisma, ownerId, scope.trialSessionId, {
      phone: parsed.data.phone,
      plateNumber: parsed.data.plateNumber,
      scheduledAtLocal: parsed.data.scheduledAtLocal,
      packageId: parsed.data.packageId,
      customerName: parsed.data.customerName,
    });
    if (!out.ok) {
      return NextResponse.json({ error: out.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true as const, booking: out.booking });
  } catch (e) {
    console.error("[car-wash/public/book]", e);
    if (isPrismaSchemaMismatch(e)) {
      return NextResponse.json({ error: THAI_PRISMA_SCHEMA_MISMATCH }, { status: 503 });
    }
    return NextResponse.json({ error: "จองคิวไม่สำเร็จ — ลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
