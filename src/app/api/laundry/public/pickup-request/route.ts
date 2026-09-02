import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/car-wash/http";
import { isLaundryPickupPortalOpenForOwner } from "@/lib/laundry/portal-access";
import { jsonLaundrySessionError } from "@/lib/laundry/route-errors";
import { LAUNDRY_MODULE_SLUG } from "@/lib/modules/config";
import { resolveDataScopeForModule } from "@/lib/trial/scope";
import { LAUNDRY_RECORDED_BY_CUSTOMER_PICKUP_QR } from "@/systems/laundry/laundry-customer-pickup-request";
import { laundryDistanceKm, laundryPickupFeeBaht } from "@/systems/laundry/lib/pickup-distance";
import { notifyLaundryDashboard } from "@/systems/laundry/lib/dashboard-sse";

const basketTierZod = z.object({
  label: z.string().min(1).max(80).trim(),
  price: z.number().int().min(0).max(9_999_999),
});

function normalizeBasketTiers(raw: unknown): { label: string; price: number }[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  const parsed = z.array(basketTierZod).safeParse(raw);
  return parsed.success ? parsed.data : null;
}

const postSchema = z.object({
  owner_id: z.string().min(10).max(191),
  package_id: z.number().int().positive(),
  basket_tier_index: z.number().int().min(0).max(63).optional().nullable(),
  customer_name: z.string().min(1).max(160),
  customer_phone: z.string().min(1).max(32),
  pickup_address: z.string().min(1).max(500),
  dropoff_address: z.string().max(500).optional().nullable(),
  preferred_pickup_note: z.string().max(500).optional().nullable(),
  estimated_weight_kg: z.number().min(0).max(9999.999).optional(),
  estimated_item_count: z.number().int().min(0).max(999_999).optional(),
  pickup_lat: z.number().min(-90).max(90).optional().nullable(),
  pickup_lng: z.number().min(-180).max(180).optional().nullable(),
  extra_note: z.string().max(500).optional().nullable(),
  payment_method: z.enum(["CASH", "PROMPTPAY", "TRANSFER"]).optional().nullable(),
  receipt_image_url: z.string().max(512).optional().nullable(),
});

function buildPickupNote(parsed: z.infer<typeof postSchema>): string {
  const lines: string[] = ["คำขอบริการรับ-ส่ง (QR)"];
  const pref = parsed.preferred_pickup_note?.trim();
  if (pref) lines.push(`ช่วงเวลาที่สะดวกรับผ้า: ${pref}`);
  const parts: string[] = [];
  const w = parsed.estimated_weight_kg;
  const c = parsed.estimated_item_count;
  if (w != null && w > 0) parts.push(`${w} กก.`);
  if (c != null && c > 0) parts.push(`${c} ชิ้น`);
  if (parts.length) lines.push(`ประมาณการ: ${parts.join(" · ")}`);
  const ex = parsed.extra_note?.trim();
  if (ex) lines.push(ex);
  return lines.join("\n").slice(0, 1000);
}

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

    const ownerId = parsed.data.owner_id.trim();
    const open = await isLaundryPickupPortalOpenForOwner(ownerId);
    if (!open) return NextResponse.json({ error: "ไม่พบเซอร์วิสหรือปิดการใช้งาน" }, { status: 403 });

    const mod = await prisma.appModule.findFirst({
      where: { slug: LAUNDRY_MODULE_SLUG, isActive: true },
      select: { id: true },
    });
    if (!mod) return NextResponse.json({ error: "ระบบซักผ้ายังไม่พร้อม" }, { status: 503 });

    const scope = await resolveDataScopeForModule(ownerId, mod.id);

    const pkgRow = await prisma.laundryPackage.findFirst({
      where: {
        id: parsed.data.package_id,
        ownerUserId: ownerId,
        trialSessionId: scope.trialSessionId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        basePrice: true,
        basketTiers: true,
      },
    });
    if (!pkgRow) {
      return NextResponse.json({ error: "ไม่พบแพ็กเกจหรือปิดการใช้งาน" }, { status: 400 });
    }

    const tiers = normalizeBasketTiers(pkgRow.basketTiers)?.filter((t) => t.label.trim()) ?? [];
    let finalPrice = pkgRow.basePrice;
    let serviceType: string;
    if (tiers.length > 0) {
      const idx = parsed.data.basket_tier_index ?? 0;
      const tier = tiers[idx];
      if (!tier) {
        return NextResponse.json({ error: "ระดับตะกร้าไม่ถูกต้อง" }, { status: 400 });
      }
      finalPrice = tier.price;
      serviceType = `${pkgRow.name} (${tier.label})`;
    } else {
      serviceType = pkgRow.name;
    }

    const phone = normalizePhone(parsed.data.customer_phone);
    const pickup = parsed.data.pickup_address.trim();
    const dropoff = (parsed.data.dropoff_address?.trim() || pickup).slice(0, 500);
    const note = buildPickupNote(parsed.data);
    const weight = parsed.data.estimated_weight_kg ?? 0;
    const items = parsed.data.estimated_item_count ?? 0;

    const shopProfile = await prisma.laundryShopProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId: scope.trialSessionId },
      },
      select: { shopLat: true, shopLng: true, pickupFeePerKmBaht: true },
    });

    const pickupLat = parsed.data.pickup_lat ?? null;
    const pickupLng = parsed.data.pickup_lng ?? null;
    const shopLat = shopProfile?.shopLat != null ? Number(shopProfile.shopLat) : null;
    const shopLng = shopProfile?.shopLng != null ? Number(shopProfile.shopLng) : null;
    const distanceKm = laundryDistanceKm(shopLat, shopLng, pickupLat, pickupLng);
    const pickupFee = laundryPickupFeeBaht(distanceKm, shopProfile?.pickupFeePerKmBaht ?? null);
    if (pickupFee != null && pickupFee > 0) {
      finalPrice += pickupFee;
    }

    const payMethod = parsed.data.payment_method?.trim() || null;
    const slipUrl = parsed.data.receipt_image_url?.trim() || null;
    if (payMethod === "PROMPTPAY" || payMethod === "TRANSFER") {
      if (!slipUrl || !slipUrl.startsWith("/uploads/")) {
        return NextResponse.json({ error: "กรุณาแนบสลิปการชำระเงิน" }, { status: 400 });
      }
    }

    const pickupPublicToken = randomUUID();
    const row = await prisma.laundryOrder.create({
      data: {
        ownerUserId: ownerId,
        trialSessionId: scope.trialSessionId,
        customerName: parsed.data.customer_name.trim(),
        customerPhone: phone,
        pickupAddress: pickup,
        dropoffAddress: dropoff,
        serviceType,
        packageId: pkgRow.id,
        packageName: pkgRow.name,
        weightKg: new Prisma.Decimal(weight),
        itemCount: items,
        finalPrice,
        note,
        recordedByName: LAUNDRY_RECORDED_BY_CUSTOMER_PICKUP_QR,
        status: "PENDING_PICKUP",
        pickupPublicToken,
        pickupLat: pickupLat != null ? new Prisma.Decimal(pickupLat) : null,
        pickupLng: pickupLng != null ? new Prisma.Decimal(pickupLng) : null,
        distanceKm: distanceKm != null ? new Prisma.Decimal(distanceKm) : null,
        paymentMethod: payMethod,
        receiptImageUrl: slipUrl,
      },
    });

    notifyLaundryDashboard(ownerId);
    return NextResponse.json({
      ok: true,
      order_id: row.id,
      tracking_token: pickupPublicToken,
      message: "ส่งคำขอแล้ว — ทางร้านจะติดต่อกลับเพื่อนัดรับผ้า",
    });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/public/pickup-request POST");
  }
}
