import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isMassageCustomerPortalOpenForOwner } from "@/lib/massage/portal-access";
import { resolvePublicMassageTrialSessionId } from "@/lib/massage/public-trial-scope";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  ownerId: z.string().trim().min(10).max(191),
  t: z.string().trim().max(36).optional().nullable(),
  phone: z.string().min(1).max(32),
  customerName: z.string().trim().max(100).optional().nullable(),
  packageId: z.number().int().positive(),
  paymentMethod: z.enum(["PROMPTPAY", "TRANSFER"]),
  receiptImageUrl: z.string().trim().min(1).max(512),
});

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

/** ซื้อแพ็กเกจจากลิงก์ลูกค้า — ต้องแนบสลิป */
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

  const rl = rateLimit(`massage-portal-buy:${ip}:${ownerId}`, 12, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "ทำรายการถี่เกินไป" }, { status: 429 });
  }

  const open = await isMassageCustomerPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const { trialSessionId } = await resolvePublicMassageTrialSessionId(ownerId, parsed.data.t);

  const pkg = await prisma.massagePackage.findFirst({
    where: { id: parsed.data.packageId, ownerUserId: ownerId, trialSessionId },
  });
  if (!pkg) return NextResponse.json({ error: "ไม่พบแพ็กเกจ" }, { status: 404 });

  const name =
    parsed.data.customerName != null && parsed.data.customerName.length > 0
      ? parsed.data.customerName.trim().slice(0, 100)
      : null;

  const whereCustomer = {
    ownerUserId_phone_trialSessionId: { ownerUserId: ownerId, phone, trialSessionId },
  } as const;
  let customer = await prisma.massageCustomer.findUnique({ where: whereCustomer });
  if (!customer) {
    customer = await prisma.massageCustomer.create({
      data: { ownerUserId: ownerId, trialSessionId, phone, name },
    });
  } else if (name) {
    customer = await prisma.massageCustomer.update({
      where: { id: customer.id },
      data: { name },
    });
  }

  const remainingSessions = Math.trunc(Number(pkg.totalSessions));
  if (!Number.isFinite(remainingSessions) || remainingSessions < 1) {
    return NextResponse.json({ error: "แพ็กเกจนี้ยังไม่พร้อมขาย" }, { status: 400 });
  }

  const sub = await prisma.massageCustomerSubscription.create({
    data: {
      ownerUserId: ownerId,
      trialSessionId,
      massageCustomerId: customer.id,
      packageId: pkg.id,
      remainingSessions,
      saleReceiptImageUrl: parsed.data.receiptImageUrl.trim(),
    },
    select: {
      id: true,
      remainingSessions: true,
      status: true,
      package: { select: { name: true, price: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    subscription: {
      id: sub.id,
      packageName: sub.package.name,
      priceBaht: Number(sub.package.price),
      remainingSessions: sub.remainingSessions,
      status: sub.status,
    },
  });
}
