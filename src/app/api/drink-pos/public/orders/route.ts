import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isDrinkPosPortalOpenForOwner } from "@/lib/drink-pos/portal-access";
import { normalizeMemberPhone } from "@/lib/loyalty-stamp/member-qr";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { notifyDrinkPosOrderBoard } from "@/systems/drink-pos/lib/order-board-sse";
import { applyDrinkPosLoyaltyEarnOnSale } from "@/systems/drink-pos/lib/loyalty";
import {
  drinkPosPaymentRequiresSlip,
  DRINK_POS_PAYMENT_METHODS,
  type DrinkPosPaymentMethod,
} from "@/systems/drink-pos/lib/payment-method";
import {
  drinkPosResolveUnitPrice,
  drinkPosSaleLineDisplayName,
  DRINK_POS_SIZE_CODES,
  normalizeDrinkPosSizePrices,
} from "@/systems/drink-pos/lib/size-prices";

const uuidSchema = z.string().uuid();

const lineSchema = z.object({
  productId: z.string().trim().min(1).max(191),
  quantity: z.number().int().min(1).max(99),
  size: z.enum(DRINK_POS_SIZE_CODES).optional().nullable(),
});

const postSchema = z.object({
  ownerId: z.string().min(10).max(64),
  trialSessionId: z.string().max(36).optional().nullable(),
  customer_name: z.string().max(120).optional().nullable(),
  member_phone: z.string().max(20).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  customer_session_id: z.string().max(40).optional().nullable(),
  paymentMethod: z.enum(DRINK_POS_PAYMENT_METHODS).optional(),
  paymentSlipUrl: z.string().trim().max(512).optional().nullable(),
  lines: z.array(lineSchema).min(1).max(40),
});

export async function POST(req: Request) {
  try {
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const open = await isDrinkPosPortalOpenForOwner(parsed.data.ownerId);
    if (!open) return NextResponse.json({ error: "ร้านปิดรับออเดอร์ชั่วคราว" }, { status: 403 });

    const scope = await getDrinkPosDataScope(parsed.data.ownerId);
    const trialSessionId =
      parsed.data.trialSessionId && parsed.data.trialSessionId.length > 0
        ? parsed.data.trialSessionId
        : scope.trialSessionId;

    const productIds = [...new Set(parsed.data.lines.map((l) => l.productId))];
    const products = await prisma.drinkPosProduct.findMany({
      where: {
        ownerUserId: parsed.data.ownerId,
        id: { in: productIds },
        isActive: true,
      },
      select: { id: true, name: true, priceBaht: true, sizePrices: true },
    });
    const pmap = new Map(
      products.map((p) => [
        p.id,
        { ...p, sizePrices: normalizeDrinkPosSizePrices(p.sizePrices) },
      ]),
    );

    for (const l of parsed.data.lines) {
      const p = pmap.get(l.productId);
      if (!p) return NextResponse.json({ error: "มีสินค้าที่ไม่พร้อมขาย" }, { status: 400 });
      const unit = drinkPosResolveUnitPrice(p, l.size ?? null);
      if (unit == null) {
        return NextResponse.json({ error: `กรุณาเลือกขนาดสำหรับ ${p.name}` }, { status: 400 });
      }
    }

    const lineCreates = parsed.data.lines.map((l) => {
      const p = pmap.get(l.productId)!;
      const unitPriceBaht = drinkPosResolveUnitPrice(p, l.size ?? null)!;
      return {
        productId: p.id,
        productName: drinkPosSaleLineDisplayName(p.name, l.size ?? null),
        sizeLabel: l.size?.trim() || null,
        unitPriceBaht,
        quantity: l.quantity,
        lineTotalBaht: unitPriceBaht * l.quantity,
      };
    });
    const totalBaht = lineCreates.reduce((s, x) => s + x.lineTotalBaht, 0);
    const paymentMethod: DrinkPosPaymentMethod =
      totalBaht <= 0 ? "CASH" : (parsed.data.paymentMethod ?? "CASH");
    const paymentSlipUrl = parsed.data.paymentSlipUrl?.trim() || null;
    if (drinkPosPaymentRequiresSlip(paymentMethod, totalBaht) && !paymentSlipUrl) {
      return NextResponse.json(
        {
          error:
            paymentMethod === "PROMPTPAY"
              ? "กรุณาแนบสลิปหลังโอนพร้อมเพย์"
              : "กรุณาแนบสลิปการโอน",
        },
        { status: 400 },
      );
    }
    if (
      paymentSlipUrl &&
      !paymentSlipUrl.startsWith("/uploads/drink-pos/") &&
      !paymentSlipUrl.startsWith("/uploads/")
    ) {
      return NextResponse.json({ error: "สลิปไม่ถูกต้อง" }, { status: 400 });
    }

    const memberPhone = normalizeMemberPhone(parsed.data.member_phone ?? "");
    const rawSess = parsed.data.customer_session_id?.trim() ?? "";
    const customerSessionId = rawSess && uuidSchema.safeParse(rawSess).success ? rawSess : null;
    const customerName = parsed.data.customer_name?.trim() || null;
    const noteCustom = parsed.data.note?.trim() || "";
    const noteParts = ["ลูกค้าสั่งผ่าน QR"];
    if (customerName) noteParts.push(customerName);
    if (noteCustom) noteParts.push(noteCustom);
    if (paymentMethod === "PROMPTPAY") noteParts.push("ชำระพร้อมเพย์");
    else if (paymentMethod === "TRANSFER") noteParts.push("ชำระโอนเงิน");
    else noteParts.push("จ่ายที่ร้าน");

    const sale = await prisma.drinkPosSale.create({
      data: {
        ownerUserId: parsed.data.ownerId,
        memberPhone: memberPhone.length >= 9 ? memberPhone : null,
        customerSessionId,
        paymentMethod,
        paymentSlipUrl,
        fulfillmentStatus: "RECEIVED",
        statusUpdatedAt: new Date(),
        note: noteParts.join(" · ").slice(0, 500),
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

    if (memberPhone.length >= 9 && totalBaht > 0) {
      await applyDrinkPosLoyaltyEarnOnSale({
        ownerUserId: parsed.data.ownerId,
        trialSessionId,
        saleId: sale.id,
        totalAmount: totalBaht,
        memberPhone,
        customerName: customerName ?? "",
        previousPointsEarned: 0,
      });
    }

    notifyDrinkPosOrderBoard(parsed.data.ownerId);

    return NextResponse.json({
      ok: true,
      sale: {
        id: sale.id,
        note: sale.note,
        totalBaht: sale.totalBaht,
        fulfillmentStatus: sale.fulfillmentStatus,
        statusUpdatedAt: sale.statusUpdatedAt.toISOString(),
        memberPhone: sale.memberPhone,
        createdAt: sale.createdAt.toISOString(),
        lines: sale.lines,
      },
    });
  } catch (e) {
    console.error("[drink-pos/public/orders POST]", e);
    return NextResponse.json({ error: "บันทึกออเดอร์ไม่สำเร็จ" }, { status: 500 });
  }
}
