import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { requireSession } from "@/lib/api-auth";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";
import {
  applyDrinkPosSaleLoyalty,
  findDrinkPosMemberByPhoneQuery,
} from "@/systems/drink-pos/lib/member-service";

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

const lineSchema = z.object({
  productId: z.string().trim().min(1).max(191),
  quantity: z.number().int().min(1).max(9999),
  size: z.enum(DRINK_POS_SIZE_CODES).optional().nullable(),
});

const createSaleSchema = z.object({
  note: z.string().trim().max(500).optional().nullable(),
  memberPhone: z.string().trim().max(20).optional().nullable(),
  isRewardRedemption: z.boolean().optional(),
  paymentMethod: z.enum(DRINK_POS_PAYMENT_METHODS).optional(),
  paymentSlipUrl: z.string().trim().max(512).optional().nullable(),
  lines: z.array(lineSchema).min(1).max(50),
});

export async function GET(req: Request) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const { ownerUserId } = auth.ctx;

  const { searchParams } = new URL(req.url);
  const take = Math.min(100, Math.max(1, Number(searchParams.get("take") || "40") || 40));

  const rows = await prisma.drinkPosSale.findMany({
    where: { ownerUserId },
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
  let totalBaht = lineCreates.reduce((s, x) => s + x.lineTotalBaht, 0);
  const isRewardRedemption = Boolean(parsed.data.isRewardRedemption);
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
  if (parsed.data.memberPhone?.trim()) {
    const memberResult = await findDrinkPosMemberByPhoneQuery(
      prisma,
      ownerUserId,
      trialSessionId,
      parsed.data.memberPhone,
    );
    if ("error" in memberResult) {
      return NextResponse.json({ error: memberResult.error }, { status: 400 });
    }
    if (isRewardRedemption && !memberResult.readyToRedeem) {
      return NextResponse.json({ error: "ยังสะสมแต้มไม่ครบเพื่อแลกฟรี" }, { status: 400 });
    }
    memberId = memberResult.id;
    memberPhone = memberResult.phone;
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
      note: parsed.data.note?.trim() || null,
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

  if (memberId) {
    await applyDrinkPosSaleLoyalty(prisma, ownerUserId, trialSessionId, memberId, isRewardRedemption);
  }

  notifyDrinkPosOrderBoard(ownerUserId);

  return NextResponse.json({
    sale: {
      id: sale.id,
      note: sale.note,
      totalBaht: sale.totalBaht,
      paymentMethod: sale.paymentMethod,
      paymentSlipUrl: sale.paymentSlipUrl,
      fulfillmentStatus: sale.fulfillmentStatus,
      statusUpdatedAt: sale.statusUpdatedAt.toISOString(),
      isRewardRedemption: sale.isRewardRedemption,
      createdAt: sale.createdAt.toISOString(),
      lines: sale.lines,
    },
  });
}
