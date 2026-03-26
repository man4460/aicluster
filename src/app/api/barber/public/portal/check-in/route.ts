import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isBarberCustomerPortalOpenForOwner } from "@/lib/barber/portal-access";
import { BARBER_MODULE_SLUG } from "@/lib/modules/config";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";

const bodySchema = z.object({
  ownerId: z.string().min(10).max(64),
  phone: z.string().min(1).max(32),
  subscriptionId: z.number().int().positive(),
});

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

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
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const { ownerId, phone: phoneRaw, subscriptionId } = parsed.data;
  const phone = normalizePhone(phoneRaw);
  if (phone.length < 9) {
    return NextResponse.json({ error: "กรอกเบอร์อย่างน้อย 9 หลัก" }, { status: 400 });
  }

  const rl = rateLimit(`barber-portal-checkin:${ip}:${ownerId}`, 24, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "ยืนยันถี่เกินไป กรุณารอสักครู่" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const portalOk = await isBarberCustomerPortalOpenForOwner(ownerId);
  if (!portalOk) {
    return NextResponse.json({ error: "ไม่สามารถใช้งานได้ในขณะนี้" }, { status: 403 });
  }

  const scope = await resolveDataScopeBySlug(ownerId, BARBER_MODULE_SLUG);

  try {
    const out = await prisma.$transaction(async (tx) => {
      const sub = await tx.barberCustomerSubscription.findFirst({
        where: { id: subscriptionId, ownerUserId: ownerId, trialSessionId: scope.trialSessionId },
        include: { customer: true, package: true },
      });
      if (!sub) throw new Error("NOT_FOUND");
      if (sub.customer.phone !== phone) throw new Error("PHONE_MISMATCH");
      if (sub.status !== "ACTIVE" || sub.remainingSessions <= 0) {
        throw new Error("NO_SESSIONS");
      }

      const next = sub.remainingSessions - 1;
      const updated = await tx.barberCustomerSubscription.update({
        where: { id: sub.id },
        data: {
          remainingSessions: next,
          status: next <= 0 ? "EXHAUSTED" : "ACTIVE",
        },
      });

      await tx.barberServiceLog.create({
        data: {
          ownerUserId: ownerId,
          trialSessionId: scope.trialSessionId,
          subscriptionId: sub.id,
          barberCustomerId: sub.barberCustomerId,
          visitType: "PACKAGE_USE",
        },
      });

      return {
        remainingSessions: updated.remainingSessions,
        status: updated.status,
        packageName: sub.package.name,
      };
    });

    return NextResponse.json({
      ok: true as const,
      remainingSessions: out.remainingSessions,
      status: out.status,
      packageName: out.packageName,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") {
      return NextResponse.json({ error: "ไม่พบแพ็กเกจนี้" }, { status: 404 });
    }
    if (msg === "PHONE_MISMATCH") {
      return NextResponse.json({ error: "เบอร์ไม่ตรงกับแพ็กเกจที่เลือก" }, { status: 400 });
    }
    if (msg === "NO_SESSIONS") {
      return NextResponse.json({ error: "ไม่มียอดครั้งคงเหลือในแพ็กนี้" }, { status: 400 });
    }
    console.error("[barber/public/portal/check-in]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 400 });
  }
}
