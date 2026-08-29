import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isMassageCustomerPortalOpenForOwner } from "@/lib/massage/portal-access";
import { resolvePublicMassageTrialSessionId } from "@/lib/massage/public-trial-scope";
import { massageNormalizeDurationMinutes } from "@/systems/massage/lib/booking-slots";

const bodySchema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  phone: z.string().min(1).max(32),
  t: z.string().trim().max(36).optional().nullable(),
});

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

/** ค้นหาแพ็กเกจสมาชิกที่เหลือใช้ได้สำหรับจอง */
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
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const ownerId = parsed.data.ownerId;
  const phone = normalizePhone(parsed.data.phone);
  if (phone.length < 9) {
    return NextResponse.json({ error: "กรอกเบอร์อย่างน้อย 9 หลัก" }, { status: 400 });
  }

  const rl = rateLimit(`massage-portal-member-pkgs:${ip}:${ownerId}`, 24, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "ค้นหาถี่เกินไป กรุณารอสักครู่" }, { status: 429 });
  }

  const open = await isMassageCustomerPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicMassageTrialSessionId(ownerId, parsed.data.t);

  const customer = await prisma.massageCustomer.findUnique({
    where: {
      ownerUserId_phone_trialSessionId: {
        ownerUserId: ownerId,
        phone,
        trialSessionId,
      },
    },
    select: {
      name: true,
      subscriptions: {
        where: { status: "ACTIVE", remainingSessions: { gt: 0 } },
        orderBy: { id: "desc" },
        select: {
          id: true,
          remainingSessions: true,
          package: {
            select: {
              id: true,
              name: true,
              durationMinutes: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ found: false as const, packages: [] });
  }

  return NextResponse.json({
    found: true as const,
    customerName: customer.name?.trim() || null,
    packages: customer.subscriptions.map((s) => ({
      subscriptionId: s.id,
      packageId: s.package.id,
      packageName: s.package.name,
      remainingSessions: s.remainingSessions,
      durationMinutes: massageNormalizeDurationMinutes(s.package.durationMinutes, 60),
      imageUrl: s.package.imageUrl ?? null,
    })),
  });
}
