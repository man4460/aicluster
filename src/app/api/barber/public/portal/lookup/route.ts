import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isBarberCustomerPortalOpenForOwner } from "@/lib/barber/portal-access";
import { maskPersonName, maskThaiPhone } from "@/lib/barber/portal-privacy";

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

  const rl = rateLimit(`barber-portal-lookup:${ip}:${ownerId}`, 24, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "ค้นหาถี่เกินไป กรุณารอสักครู่" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const portalOk = await isBarberCustomerPortalOpenForOwner(ownerId);
  if (!portalOk) {
    return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
  }

  const customer = await prisma.barberCustomer.findUnique({
    where: { ownerUserId_phone: { ownerUserId: ownerId, phone } },
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
  });
}
