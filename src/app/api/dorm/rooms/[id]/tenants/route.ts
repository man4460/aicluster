import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withDormitoryOwnerOrStaffContext } from "@/lib/dormitory/api-auth";
import { DORM_PAYMENT_METHODS, isDormPaymentMethod } from "@/systems/dormitory/lib/payment-method";

const moneySchema = z.number().finite().min(0).max(1_000_000);

const postSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  idCard: z.string().min(1).max(13),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  bookingDepositBaht: moneySchema.optional(),
  securityDepositBaht: moneySchema.optional(),
  depositPaymentMethod: z.enum(DORM_PAYMENT_METHODS).optional().nullable(),
});

type Ctx = { params: Promise<{ id: string }> };

function parseRoomId(id: string): number | null {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await withDormitoryOwnerOrStaffContext(req);
  if (!auth.ok) return auth.res;
  const rid = parseRoomId((await ctx.params).id);
  if (rid === null) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  const room = await prisma.room.findFirst({
    where: { id: rid, ownerUserId: auth.ctx.ownerUserId, trialSessionId: auth.ctx.trialSessionId },
    include: { tenants: { where: { status: "ACTIVE" } } },
  });
  if (!room) return NextResponse.json({ error: "ไม่พบห้อง" }, { status: 404 });

  if (room.tenants.length >= room.maxOccupants) {
    return NextResponse.json({ error: "ห้องเต็มตามจำนวนสูงสุด" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const checkIn = parsed.data.checkInDate
    ? new Date(`${parsed.data.checkInDate}T12:00:00+07:00`)
    : new Date();

  const bookingDepositBaht = parsed.data.bookingDepositBaht ?? 0;
  const securityDepositBaht = parsed.data.securityDepositBaht ?? 0;
  const depositPaymentMethod = isDormPaymentMethod(parsed.data.depositPaymentMethod)
    ? parsed.data.depositPaymentMethod
    : bookingDepositBaht > 0 || securityDepositBaht > 0
      ? "CASH"
      : null;

  const tenant = await prisma.tenant.create({
    data: {
      roomId: rid,
      name: parsed.data.name.trim(),
      phone: parsed.data.phone.trim(),
      idCard: parsed.data.idCard.trim(),
      checkInDate: checkIn,
      bookingDepositBaht,
      securityDepositBaht,
      depositPaymentMethod,
    },
  });

  return NextResponse.json({
    tenant: {
      ...tenant,
      bookingDepositBaht: Number(tenant.bookingDepositBaht),
      securityDepositBaht: Number(tenant.securityDepositBaht),
      damageDeductionBaht: tenant.damageDeductionBaht != null ? Number(tenant.damageDeductionBaht) : null,
      securityRefundBaht: tenant.securityRefundBaht != null ? Number(tenant.securityRefundBaht) : null,
    },
  });
}
