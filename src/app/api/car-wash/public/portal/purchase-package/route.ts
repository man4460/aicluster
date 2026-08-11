import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isCarWashCustomerPortalOpenForOwner } from "@/lib/car-wash/portal-access";
import { resolvePublicCarWashTrialSessionId } from "@/lib/car-wash/public-trial-scope";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  t: z.string().trim().max(36).optional().nullable(),
  phone: z.string().min(1).max(32),
  customerName: z.string().trim().max(100).optional().nullable(),
  plateNumber: z.string().trim().max(64).optional().nullable(),
  packageId: z.number().int().positive(),
  paymentMethod: z.enum(["PROMPTPAY", "TRANSFER"]),
  receiptImageUrl: z.string().trim().min(1).max(512),
});

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

/** ซื้อแพ็กจากลิงก์ลูกค้า — สร้าง CarWashBundle + แนบสลิป */
export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const ownerId = parsed.data.ownerId;
  const phone = normalizePhone(parsed.data.phone);
  if (phone.length < 9) {
    return NextResponse.json({ error: "กรอกเบอร์อย่างน้อย 9 หลัก" }, { status: 400 });
  }

  const rl = rateLimit(`car-wash-portal-buy:${ip}:${ownerId}`, 12, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "ทำรายการถี่เกินไป" }, { status: 429 });
  }

  const open = await isCarWashCustomerPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicCarWashTrialSessionId(ownerId, parsed.data.t);

  const pkg = await prisma.carWashPackage.findFirst({
    where: {
      id: parsed.data.packageId,
      ownerUserId: ownerId,
      trialSessionId,
      isActive: true,
    },
  });
  if (!pkg) return NextResponse.json({ error: "ไม่พบแพ็กเกจ" }, { status: 404 });

  const totalUses = Math.max(1, Math.trunc(pkg.totalUses) || 1);
  const name =
    parsed.data.customerName != null && parsed.data.customerName.length > 0
      ? parsed.data.customerName.trim().slice(0, 160)
      : "ลูกค้า";
  const plate = (parsed.data.plateNumber?.trim() || "").slice(0, 64);

  const bundle = await prisma.carWashBundle.create({
    data: {
      ownerUserId: ownerId,
      trialSessionId,
      customerName: name,
      customerPhone: phone,
      plateNumber: plate,
      packageId: pkg.id,
      packageName: pkg.name,
      paidAmount: pkg.price,
      totalUses,
      usedUses: 0,
      isActive: true,
      slipPhotoUrl: parsed.data.receiptImageUrl.trim(),
    },
    select: {
      id: true,
      packageName: true,
      paidAmount: true,
      totalUses: true,
      usedUses: true,
      isActive: true,
    },
  });

  return NextResponse.json({
    ok: true,
    subscription: {
      id: bundle.id,
      packageName: bundle.packageName,
      priceBaht: bundle.paidAmount,
      remainingSessions: Math.max(0, bundle.totalUses - bundle.usedUses),
      status: bundle.isActive ? "ACTIVE" : "INACTIVE",
    },
  });
}
