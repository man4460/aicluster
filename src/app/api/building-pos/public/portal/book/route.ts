import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isBuildingPosPortalOpenForOwner } from "@/lib/building-pos/portal-access";
import { resolvePublicBuildingPosTrialSessionId } from "@/lib/building-pos/public-trial-scope";
import { ensureBuildingPosShopProfile } from "@/lib/building-pos/ensure-shop-profile";
import {
  buildingPosCartItemsTotalBaht,
  buildingPosComputePortalPayDue,
  buildingPosNormalizePortalCartItems,
  buildingPosPortalSlipProofMessage,
  normalizeBuildingPosPortalPaymentMode,
} from "@/lib/building-pos/portal-booking";
import { assertOwnerPlanUpload } from "@/lib/modules/plan-entitlements";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { bangkokDateKey } from "@/lib/time/bangkok";

const bodySchema = z.object({
  ownerId: z.string().min(10).max(64),
  trialSessionId: z.string().max(36).optional(),
  t: z.string().max(36).optional().nullable(),
  customerName: z.string().trim().min(1).max(160),
  phone: z.string().trim().min(9).max(20),
  partySize: z.number().int().min(1).max(99).optional(),
  tablePreference: z.string().trim().max(40).optional().nullable(),
  visitDateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  visitTimeHm: z.string().regex(/^\d{2}:\d{2}$/),
  note: z.string().trim().max(1000).optional().nullable(),
  items: z.array(z.unknown()).optional(),
  paymentMethod: z.enum(["PROMPTPAY", "TRANSFER"]).optional(),
  paymentSlipUrl: z.string().max(2048).optional().nullable(),
});

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 20);
}

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit(`bpos-portal-book:${ip}`, 40, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "ส่งคำขอถี่เกินไป" }, { status: 429 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const d = parsed.data;
  const ownerId = d.ownerId;
  const phone = normalizePhone(d.phone);
  if (phone.length < 9) {
    return NextResponse.json({ error: "กรอกเบอร์อย่างน้อย 9 หลัก" }, { status: 400 });
  }

  const open = await isBuildingPosPortalOpenForOwner(ownerId);
  if (!open) return NextResponse.json({ error: "พอร์ทัลปิดชั่วคราว" }, { status: 403 });

  const trialParam = d.trialSessionId?.trim() || d.t?.trim() || "";
  const { trialSessionId } = await resolvePublicBuildingPosTrialSessionId(ownerId, trialParam || null);

  const today = bangkokDateKey();
  if (d.visitDateKey < today) {
    return NextResponse.json({ error: "ไม่สามารถจองวันที่ย้อนหลังได้" }, { status: 400 });
  }

  await ensureBuildingPosShopProfile(prisma, ownerId, trialSessionId);
  const profile = await prisma.buildingPosShopProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId } },
  });

  const cartItems = buildingPosNormalizePortalCartItems(d.items ?? []);
  if (cartItems.length > 0) {
    const menuIds = cartItems.map((it) => it.menuItemId);
    const menus = await prisma.buildingPosMenuItem.findMany({
      where: {
        ownerUserId: ownerId,
        trialSessionId,
        isActive: true,
        id: { in: menuIds },
      },
      select: { id: true, name: true, price: true },
    });
    const byId = new Map(menus.map((m) => [m.id, m]));
    for (const it of cartItems) {
      const m = byId.get(it.menuItemId);
      if (!m) {
        return NextResponse.json({ error: `ไม่พบเมนู: ${it.name}` }, { status: 400 });
      }
      it.name = m.name;
      it.unitPrice = m.price;
    }
  }

  const itemsTotalBaht = buildingPosCartItemsTotalBaht(cartItems);
  const mode = normalizeBuildingPosPortalPaymentMode(profile?.portalBookingPaymentMode);
  const payDue = buildingPosComputePortalPayDue({
    mode,
    depositAmountBaht: profile?.depositAmountBaht,
    depositPercent: profile?.depositPercent,
    itemsTotalBaht,
  });

  const slipUrl = d.paymentSlipUrl?.trim() || "";
  if (payDue > 0) {
    if (!slipUrl) {
      return NextResponse.json({ error: buildingPosPortalSlipProofMessage(mode) }, { status: 400 });
    }
    const planGate = await assertOwnerPlanUpload(ownerId, "slip");
    if (!planGate.ok) {
      return NextResponse.json({ error: planGate.error, code: planGate.code }, { status: 402 });
    }
  }

  const paymentMethod =
    payDue > 0 ? (d.paymentMethod === "TRANSFER" ? "TRANSFER" : "PROMPTPAY") : "";

  const reservation = await prisma.buildingPosReservation.create({
    data: {
      ownerUserId: ownerId,
      trialSessionId,
      customerName: d.customerName.trim(),
      phone,
      partySize: d.partySize ?? 2,
      tablePreference: d.tablePreference?.trim() ?? "",
      visitDateKey: d.visitDateKey,
      visitTimeHm: d.visitTimeHm,
      itemsJson: cartItems,
      itemsTotalBaht,
      paymentMode: mode,
      payDueBaht: payDue,
      amountPaidBaht: payDue > 0 && slipUrl ? payDue : 0,
      paymentMethod,
      paymentSlipUrl: slipUrl,
      status: "SCHEDULED",
      note: d.note?.trim() ?? "",
    },
  });

  return NextResponse.json({
    reservation: {
      id: reservation.id,
      customerName: reservation.customerName,
      phone: reservation.phone,
      partySize: reservation.partySize,
      visitDateKey: reservation.visitDateKey,
      visitTimeHm: reservation.visitTimeHm,
      itemsTotalBaht: reservation.itemsTotalBaht,
      payDueBaht: reservation.payDueBaht,
      amountPaidBaht: reservation.amountPaidBaht,
      paymentMode: reservation.paymentMode,
      paymentMethod: reservation.paymentMethod,
      paymentSlipUrl: reservation.paymentSlipUrl || null,
      status: reservation.status,
      note: reservation.note || null,
      createdAt: reservation.createdAt.toISOString(),
    },
  });
}
