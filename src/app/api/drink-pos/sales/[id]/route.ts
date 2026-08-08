import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";
import {
  DRINK_POS_PAYMENT_METHODS,
  drinkPosPaymentRequiresSlip,
} from "@/systems/drink-pos/lib/payment-method";
import { notifyDrinkPosOrderBoard } from "@/systems/drink-pos/lib/order-board-sse";
import { normalizeMemberPhone } from "@/lib/loyalty-stamp/member-qr";
const lineSchema = z.object({
  productId: z.string().trim().min(1).max(191).optional().nullable(),
  productName: z.string().trim().min(1).max(160),
  sizeLabel: z.string().trim().max(8).optional().nullable(),
  unitPriceBaht: z.number().int().min(0).max(99_999_999),
  quantity: z.number().int().min(1).max(9999),
});

const patchSchema = z.object({
  note: z.string().trim().max(500).optional().nullable(),
  paymentMethod: z.enum(DRINK_POS_PAYMENT_METHODS).optional(),
  paymentSlipUrl: z.string().trim().max(512).optional().nullable(),
  memberPhone: z.string().trim().max(20).optional().nullable(),
  createdAt: z.string().datetime().optional(),
  lines: z.array(lineSchema).min(1).max(50).optional(),
});

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteCtx) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const { id } = await ctx.params;

  const existing = await prisma.drinkPosSale.findFirst({
    where: { id, ownerUserId: auth.ctx.ownerUserId },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายการขาย" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON ไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  let nextTotal = existing.totalBaht;
  let lineCreates:
    | {
        productId: string | null;
        productName: string;
        sizeLabel: string | null;
        unitPriceBaht: number;
        quantity: number;
        lineTotalBaht: number;
      }[]
    | undefined;

  if (parsed.data.lines) {
    lineCreates = parsed.data.lines.map((l) => {
      const qty = l.quantity;
      const unit = l.unitPriceBaht;
      return {
        productId: l.productId?.trim() || null,
        productName: l.productName.trim(),
        sizeLabel: l.sizeLabel?.trim() || null,
        unitPriceBaht: unit,
        quantity: qty,
        lineTotalBaht: unit * qty,
      };
    });
    nextTotal = lineCreates.reduce((s, l) => s + l.lineTotalBaht, 0);
  }

  const nextMethod = (
    parsed.data.paymentMethod ??
    (DRINK_POS_PAYMENT_METHODS.includes(existing.paymentMethod as (typeof DRINK_POS_PAYMENT_METHODS)[number])
      ? existing.paymentMethod
      : "CASH")
  ) as (typeof DRINK_POS_PAYMENT_METHODS)[number];
  const nextSlip =
    parsed.data.paymentSlipUrl !== undefined
      ? parsed.data.paymentSlipUrl?.trim() || null
      : existing.paymentSlipUrl;

  if (drinkPosPaymentRequiresSlip(nextMethod, nextTotal) && !nextSlip) {
    return NextResponse.json({ error: "แนบสลิปชำระเงินก่อนบันทึก" }, { status: 400 });
  }

  const memberPhone =
    parsed.data.memberPhone !== undefined
      ? (() => {
          const digits = normalizeMemberPhone(parsed.data.memberPhone ?? "");
          return digits.length >= 9 ? digits : null;
        })()
      : undefined;

  const row = await prisma.$transaction(async (tx) => {
    if (lineCreates) {
      await tx.drinkPosSaleLine.deleteMany({ where: { saleId: id } });
      await tx.drinkPosSaleLine.createMany({
        data: lineCreates.map((l) => ({ saleId: id, ...l })),
      });
    }
    return tx.drinkPosSale.update({
      where: { id },
      data: {
        ...(parsed.data.note !== undefined ? { note: parsed.data.note?.trim() || null } : {}),
        ...(parsed.data.paymentMethod !== undefined ? { paymentMethod: parsed.data.paymentMethod } : {}),
        ...(parsed.data.paymentSlipUrl !== undefined
          ? { paymentSlipUrl: parsed.data.paymentSlipUrl?.trim() || null }
          : {}),
        ...(memberPhone !== undefined ? { memberPhone } : {}),
        ...(parsed.data.createdAt !== undefined ? { createdAt: new Date(parsed.data.createdAt) } : {}),
        ...(lineCreates ? { totalBaht: nextTotal } : {}),
      },
      include: {
        lines: {
          orderBy: { id: "asc" },
          select: {
            id: true,
            productId: true,
            productName: true,
            sizeLabel: true,
            unitPriceBaht: true,
            quantity: true,
            lineTotalBaht: true,
          },
        },
      },
    });
  });

  notifyDrinkPosOrderBoard(auth.ctx.ownerUserId);

  return NextResponse.json({
    sale: {
      id: row.id,
      note: row.note,
      totalBaht: row.totalBaht,
      paymentMethod: row.paymentMethod,
      paymentSlipUrl: row.paymentSlipUrl,
      fulfillmentStatus: row.fulfillmentStatus,
      statusUpdatedAt: row.statusUpdatedAt.toISOString(),
      isRewardRedemption: row.isRewardRedemption,
      pointsEarned: row.pointsEarned,
      pointsRedeemed: row.pointsRedeemed,
      memberPhone: row.memberPhone,
      createdAt: row.createdAt.toISOString(),
      lines: row.lines,
    },
  });
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const { id } = await ctx.params;

  const existing = await prisma.drinkPosSale.findFirst({
    where: { id, ownerUserId: auth.ctx.ownerUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบรายการขาย" }, { status: 404 });

  await prisma.drinkPosSale.delete({ where: { id } });
  notifyDrinkPosOrderBoard(auth.ctx.ownerUserId);
  return NextResponse.json({ ok: true });
}
