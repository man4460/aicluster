import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isCarWashCustomerPortalOpenForOwner } from "@/lib/car-wash/portal-access";
import { resolvePublicCarWashTrialSessionId } from "@/lib/car-wash/public-trial-scope";
import { carWashNormalizeDurationMinutes } from "@/lib/car-wash/booking-slot-availability";

const bodySchema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  phone: z.string().min(1).max(32),
  t: z.string().trim().max(36).optional().nullable(),
});

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

/** ค้นหาแพ็กเหมาที่เหลือใช้ได้สำหรับจอง */
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

  const rl = rateLimit(`car-wash-portal-member-pkgs:${ip}:${ownerId}`, 24, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "ค้นหาถี่เกินไป กรุณารอสักครู่" }, { status: 429 });
  }

  const open = await isCarWashCustomerPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicCarWashTrialSessionId(ownerId, parsed.data.t);

  const bundles = await prisma.carWashBundle.findMany({
    where: {
      ownerUserId: ownerId,
      trialSessionId,
      isActive: true,
      customerPhone: phone,
    },
    orderBy: { id: "desc" },
    take: 20,
  });

  const usable = bundles.filter((b) => b.totalUses - b.usedUses > 0);
  if (usable.length === 0) {
    const anyPhone = await prisma.carWashBundle.findFirst({
      where: { ownerUserId: ownerId, trialSessionId, customerPhone: phone },
      select: { id: true, customerName: true },
    });
    if (!anyPhone) {
      return NextResponse.json({ found: false as const, packages: [] });
    }
    return NextResponse.json({
      found: true as const,
      customerName: anyPhone.customerName?.trim() || null,
      packages: [],
    });
  }

  const pkgIds = [...new Set(usable.map((b) => b.packageId))];
  const pkgs = await prisma.carWashPackage.findMany({
    where: { id: { in: pkgIds }, ownerUserId: ownerId, trialSessionId },
    select: { id: true, durationMinutes: true, imageUrl: true },
  });
  const pkgMap = new Map(pkgs.map((p) => [p.id, p]));

  return NextResponse.json({
    found: true as const,
    customerName: usable[0]?.customerName?.trim() || null,
    packages: usable.map((b) => {
      const pkg = pkgMap.get(b.packageId);
      return {
        subscriptionId: b.id,
        packageId: b.packageId,
        packageName: b.packageName,
        remainingSessions: Math.max(0, b.totalUses - b.usedUses),
        durationMinutes: carWashNormalizeDurationMinutes(pkg?.durationMinutes ?? 60, 60),
        imageUrl: pkg?.imageUrl ?? null,
      };
    }),
  });
}
