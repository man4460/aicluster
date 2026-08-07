import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { requireSession } from "@/lib/api-auth";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";
import { findDrinkPosMemberByPhoneQuery } from "@/systems/drink-pos/lib/member-service";
import {
  drinkPosResolveUnitPrice,
  drinkPosSaleLineDisplayName,
  DRINK_POS_SIZE_CODES,
  normalizeDrinkPosSizePrices,
} from "@/systems/drink-pos/lib/size-prices";
import {
  DRINK_POS_PAYMENT_METHODS,
  drinkPosPaymentRequiresSlip,
  type DrinkPosPaymentMethod,
} from "@/systems/drink-pos/lib/payment-method";
import { notifyDrinkPosOrderBoard } from "@/systems/drink-pos/lib/order-board-sse";
import {
  applyDrinkPosLoyaltyEarnOnSale,
  ensureDrinkPosLoyaltySettings,
  redeemDrinkPosLoyaltyReward,
} from "@/systems/drink-pos/lib/loyalty";
import { normalizeMemberPhone } from "@/lib/loyalty-stamp/member-qr";

const lineSchema = z.object({
  productId: z.string().trim().min(1).max(191),
  quantity: z.number().int().min(1).max(9999),
  size: z.enum(DRINK_POS_SIZE_CODES).optional().nullable(),
});

const createSaleSchema = z.object({
  note: z.string().trim().max(500).optional().nullable(),
  memberPhone: z.string().trim().max(20).optional().nullable(),
  /** @deprecated ใช้ loyaltyRewardId */
  isRewardRedemption: z.boolean().optional(),
  loyaltyRewardId: z.number().int().positive().optional().nullable(),
  paymentMethod: z.enum(DRINK_POS_PAYMENT_METHODS).optional(),
  paymentSlipUrl: z.string().trim().max(512).optional().nullable(),
  lines: z.array(lineSchema).min(1).max(50),
});

export async function GET(req: Request) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;

  const { searchParams } = new URL(req.url);
  const takeRaw = Number(searchParams.get("take") || "40") || 40;
  const phoneDigits = normalizeMemberPhone(searchParams.get("phone") ?? "");
  const take = Math.min(phoneDigits.length >= 3 ? 300 : 100, Math.max(1, takeRaw));

  const rows = await prisma.drinkPosSale.findMany({
    where: {
      ownerUserId,
      ...(phoneDigits.length >= 3 ? { memberPhone: { contains: phoneDigits } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      lines: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          productName: true,
          sizeLabel: true,
          unitPriceBaht: true,
          quantity: true,
          lineTotalBaht: true,
        },
      },
    },
  });

  return NextResponse.json({
    sales: rows.map((s) => ({
      id: s.id,
      note: s.note,
      totalBaht: s.totalBaht,
      paymentMethod: s.paymentMethod,
      paymentSlipUrl: s.paymentSlipUrl,
      fulfillmentStatus: s.fulfillmentStatus,
      statusUpdatedAt: s.statusUpdatedAt.toISOString(),
      isRewardRedemption: s.isRewardRedemption,
      pointsEarned: s.pointsEarned,
      pointsRedeemed: s.pointsRedeemed,
      memberPhone: s.memberPhone,
      createdAt: s.createdAt.toISOString(),
      lines: s.lines,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) {
    return NextResponse.json({ error: "เฉพาะเจ้าขององค์กร" }, { status: 403 });
  }
  const ownerUserId = ctx.billingUserId;
  const scope = await getDrinkPosDataScope(ownerUserId);
  const trialSessionId = scope.trialSessionId;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON ไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = createSaleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", issues: parsed.error.flatten() }, { status: 400 });
  }

  const productIds = [...new Set(parsed.data.lines.map((l) => l.productId))];
  const products = await prisma.drinkPosProduct.findMany({
    where: { ownerUserId, id: { in: productIds }, isActive: true },
    select: { id: true, name: true, priceBaht: true, sizePrices: true },
  });
  const pmap = new Map(
    products.map((p) => [
      p.id,
      {
        ...p,
        sizePrices: normalizeDrinkPosSizePrices(p.sizePrices),
      },
    ]),
  );
  for (const l of parsed.data.lines) {
    if (!pmap.has(l.productId)) {
      return NextResponse.json({ error: `ไม่พบสินค้า: ${l.productId}` }, { status: 400 });
    }
    const p = pmap.get(l.productId)!;
    const unit = drinkPosResolveUnitPrice(p, l.size ?? null);
    if (unit == null) {
      return NextResponse.json({ error: `กรุณาเลือกขนาดสำหรับ ${p.name}` }, { status: 400 });
    }
  }

  const lineCreates = parsed.data.lines.map((l) => {
    const p = pmap.get(l.productId)!;
    const unitPriceBaht = drinkPosResolveUnitPrice(p, l.size ?? null)!;
    const lineTotalBaht = unitPriceBaht * l.quantity;
    return {
      productId: p.id,
      productName: drinkPosSaleLineDisplayName(p.name, l.size ?? null),
      sizeLabel: l.size?.trim() || null,
      unitPriceBaht,
      quantity: l.quantity,
      lineTotalBaht,
    };
  });

  const loyaltyRewardId = parsed.data.loyaltyRewardId ?? null;
  const isRewardRedemption = Boolean(loyaltyRewardId) || Boolean(parsed.data.isRewardRedemption);
  let totalBaht = lineCreates.reduce((s, x) => s + x.lineTotalBaht, 0);
  if (isRewardRedemption) totalBaht = 0;

  const paymentMethod: DrinkPosPaymentMethod =
    isRewardRedemption || totalBaht <= 0 ? "CASH" : (parsed.data.paymentMethod ?? "CASH");
  const paymentSlipUrl = parsed.data.paymentSlipUrl?.trim() || null;
  if (drinkPosPaymentRequiresSlip(paymentMethod, totalBaht) && !paymentSlipUrl) {
    return NextResponse.json(
      { error: paymentMethod === "PROMPTPAY" ? "กรุณาแนบสลิปหลังโอนพร้อมเพย์" : "กรุณาแนบสลิปการโอน" },
      { status: 400 },
    );
  }

  let memberId: string | null = null;
  let memberPhone: string | null = null;
  const phoneRaw = parsed.data.memberPhone?.trim() || "";
  if (phoneRaw) {
    const memberResult = await findDrinkPosMemberByPhoneQuery(
      prisma,
      ownerUserId,
      trialSessionId,
      phoneRaw,
    );
    if ("error" in memberResult) {
      return NextResponse.json({ error: memberResult.error }, { status: 400 });
    }
    memberId = memberResult.id;
    memberPhone = memberResult.phone;
  }

  if (loyaltyRewardId != null) {
    if (!memberPhone) {
      return NextResponse.json({ error: "กรอกเบอร์สมาชิกก่อนแลกคะแนน" }, { status: 400 });
    }
    const settings = await ensureDrinkPosLoyaltySettings(ownerUserId, trialSessionId);
    if (!settings.enabled) {
      return NextResponse.json({ error: "ยังไม่เปิดระบบสะสมคะแนน" }, { status: 400 });
    }
  }

  const sale = await prisma.drinkPosSale.create({
    data: {
      ownerUserId,
      memberId,
      memberPhone,
      isRewardRedemption,
      paymentMethod,
      paymentSlipUrl: drinkPosPaymentRequiresSlip(paymentMethod, totalBaht) ? paymentSlipUrl : null,
      fulfillmentStatus: "RECEIVED",
      statusUpdatedAt: new Date(),
      note: parsed.data.note?.trim() || (loyaltyRewardId ? "แลกคะแนน" : null),
      totalBaht,
      lines: { create: lineCreates },
    },
    include: {
      lines: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          productName: true,
          sizeLabel: true,
          unitPriceBaht: true,
          quantity: true,
          lineTotalBaht: true,
        },
      },
    },
  });

  if (loyaltyRewardId != null && memberPhone) {
    const redeem = await redeemDrinkPosLoyaltyReward({
      ownerUserId,
      trialSessionId,
      phoneRaw: memberPhone,
      rewardId: loyaltyRewardId,
      saleId: sale.id,
      createSale: false,
    });
    if (!redeem.ok) {
      await prisma.drinkPosSale.delete({ where: { id: sale.id } });
      return NextResponse.json({ error: redeem.error }, { status: 400 });
    }
  } else if (memberPhone && totalBaht > 0 && !isRewardRedemption) {
    await applyDrinkPosLoyaltyEarnOnSale({
      ownerUserId,
      trialSessionId,
      saleId: sale.id,
      totalAmount: totalBaht,
      memberPhone,
      previousPointsEarned: 0,
    });
  } else if (memberPhone && !isRewardRedemption) {
    const digits = normalizeMemberPhone(memberPhone);
    if (digits.length >= 9) {
      await prisma.drinkPosSale.update({
        where: { id: sale.id },
        data: { memberPhone: digits, memberId },
      });
    }
  }

  notifyDrinkPosOrderBoard(ownerUserId);

  const fresh = await prisma.drinkPosSale.findUnique({
    where: { id: sale.id },
    include: {
      lines: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          productName: true,
          sizeLabel: true,
          unitPriceBaht: true,
          quantity: true,
          lineTotalBaht: true,
        },
      },
    },
  });

  return NextResponse.json({
    sale: {
      id: fresh!.id,
      note: fresh!.note,
      totalBaht: fresh!.totalBaht,
      paymentMethod: fresh!.paymentMethod,
      paymentSlipUrl: fresh!.paymentSlipUrl,
      fulfillmentStatus: fresh!.fulfillmentStatus,
      statusUpdatedAt: fresh!.statusUpdatedAt.toISOString(),
      isRewardRedemption: fresh!.isRewardRedemption,
      pointsEarned: fresh!.pointsEarned,
      pointsRedeemed: fresh!.pointsRedeemed,
      memberPhone: fresh!.memberPhone,
      createdAt: fresh!.createdAt.toISOString(),
      lines: fresh!.lines,
    },
  });
}
