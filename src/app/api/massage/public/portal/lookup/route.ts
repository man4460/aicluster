import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isMassageCustomerPortalOpenForOwner } from "@/lib/massage/portal-access";
import { MASSAGE_MODULE_SLUG } from "@/lib/modules/config";
import { resolveDataScopeBySlug } from "@/lib/trial/scope";
import {
  bangkokDateKeyFromScheduledAt,
  bangkokTimeHHmmFromScheduledAt,
} from "@/lib/massage/booking-slot-availability";
import { maskPersonName, maskThaiPhone } from "@/lib/massage/portal-privacy";

const bodySchema = z.object({
  ownerId: z.string().min(10).max(64),
  phone: z.string().min(1).max(32),
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

  const { ownerId, phone: phoneRaw } = parsed.data;
  const phone = normalizePhone(phoneRaw);
  if (phone.length < 9) {
    return NextResponse.json({ error: "กรอกเบอร์อย่างน้อย 9 หลัก" }, { status: 400 });
  }

  const rl = rateLimit(`massage-portal-lookup:${ip}:${ownerId}`, 24, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "ค้นหาถี่เกินไป กรุณารอสักครู่" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const portalOk = await isMassageCustomerPortalOpenForOwner(ownerId);
  if (!portalOk) {
    return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
  }

  const scope = await resolveDataScopeBySlug(ownerId, MASSAGE_MODULE_SLUG);
  const customer = await prisma.massageCustomer.findUnique({
    where: {
      ownerUserId_phone_trialSessionId: {
        ownerUserId: ownerId,
        phone,
        trialSessionId: scope.trialSessionId,
      },
    },
    include: {
      subscriptions: {
        where: { status: { in: ["ACTIVE", "EXHAUSTED"] } },
        include: { package: true },
        orderBy: { id: "desc" },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ found: false as const });
  }

  const now = new Date();
  const upcomingRows = await prisma.massageBooking.findMany({
    where: {
      ownerUserId: ownerId,
      trialSessionId: scope.trialSessionId,
      phone: customer.phone,
      status: { in: ["SCHEDULED", "ARRIVED", "IN_SERVICE"] },
      scheduledAt: { gte: now },
    },
    orderBy: { scheduledAt: "asc" },
    take: 8,
    select: { id: true, scheduledAt: true, status: true },
  });

  const phoneMasked = maskThaiPhone(customer.phone);
  const displayName = maskPersonName(customer.name);

  return NextResponse.json({
    found: true as const,
    customer: {
      id: customer.id,
      displayName,
      phoneMasked,
    },
    subscriptions: customer.subscriptions.map((s) => ({
      id: s.id,
      packageName: s.package.name,
      remainingSessions: s.remainingSessions,
      status: s.status,
    })),
    upcomingBookings: upcomingRows.map((b) => ({
      id: b.id,
      status: b.status,
      scheduledAt: b.scheduledAt.toISOString(),
      dateLabel: bangkokDateKeyFromScheduledAt(b.scheduledAt),
      timeLabel: bangkokTimeHHmmFromScheduledAt(b.scheduledAt),
    })),
  });
}
