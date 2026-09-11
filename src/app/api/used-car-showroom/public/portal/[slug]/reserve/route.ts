import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { USED_CAR_SHOWROOM_MODULE_SLUG } from "@/lib/modules/config";
import { ensureOwnerModuleDailyChargeOnPublicUse } from "@/lib/modules/public-portal-access";
import { gateUsedCarShowroomPublicShop } from "@/systems/used-car-showroom/lib/load-public-shop";
import { mapUsedCarReservation } from "@/systems/used-car-showroom/lib/mappers";
import {
  isUsedCarPaymentMethod,
  usedCarPaymentRequiresSlip,
} from "@/systems/used-car-showroom/lib/payment-method";
import { parseUsedCarPortalPaymentMode } from "@/systems/used-car-showroom/lib/status";

type Ctx = { params: Promise<{ slug: string }> };

/** จองรถจากเว็บลูกค้า — มัดจำ / เต็ม / ไม่ชำระ + สลิป */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
    }

    const trialParam =
      typeof body.t === "string" ? body.t : typeof body.trialSessionId === "string" ? body.trialSessionId : null;
    const gate = await gateUsedCarShowroomPublicShop(slug, trialParam);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }
    const { shop } = gate;

    const charge = await ensureOwnerModuleDailyChargeOnPublicUse(
      shop.ownerUserId,
      USED_CAR_SHOWROOM_MODULE_SLUG,
    );
    if (!charge.ok) {
      return NextResponse.json({ error: "ลิงก์ปิดชั่วคราว" }, { status: 403 });
    }

    const vehicleId = typeof body.vehicleId === "string" ? body.vehicleId.trim() : "";
    const customerName =
      typeof body.customerName === "string" ? body.customerName.trim().slice(0, 200) : "";
    const customerPhone =
      typeof body.customerPhone === "string" ? body.customerPhone.trim().slice(0, 32) : "";
    if (!vehicleId || !customerName || !customerPhone) {
      return NextResponse.json({ error: "กรอกรถ ชื่อ และเบอร์" }, { status: 400 });
    }

    const vehicle = await prisma.usedCarVehicle.findFirst({
      where: { id: vehicleId, shopId: shop.id },
    });
    if (!vehicle) return NextResponse.json({ error: "ไม่พบรถ" }, { status: 404 });
    if (vehicle.status === "RESERVED") {
      return NextResponse.json({ error: "รถคันนี้ติดจองแล้ว" }, { status: 409 });
    }
    if (vehicle.status !== "FOR_SALE") {
      return NextResponse.json({ error: "รถคันนี้ยังไม่เปิดจอง" }, { status: 400 });
    }

    const mode = parseUsedCarPortalPaymentMode(shop.portalBookingPaymentMode);
    /** จองรถออนไลน์เฟสนี้ = มัดจำหรือชำระเต็มเท่านั้น (ตามเต็นท์จริง) — นัดดูรถใช้ /appointments */
    if (mode === "NONE") {
      return NextResponse.json(
        { error: "ร้านนี้รับแค่นัดดูรถออนไลน์ — ไม่เปิดจองมัดจำผ่านเว็บ" },
        { status: 400 },
      );
    }
    let depositBaht = 0;
    if (mode === "DEPOSIT") {
      depositBaht = Math.max(0, shop.depositAmountBaht);
      if (depositBaht <= 0) {
        return NextResponse.json({ error: "ร้านยังไม่ได้ตั้งยอดมัดจำ" }, { status: 400 });
      }
    } else if (mode === "FULL") {
      depositBaht = Math.max(0, vehicle.askingPriceBaht);
      if (depositBaht <= 0) {
        return NextResponse.json({ error: "รถยังไม่มีราคาขาย" }, { status: 400 });
      }
    }

    const paymentMethod =
      depositBaht <= 0
        ? "NONE"
        : isUsedCarPaymentMethod(body.paymentMethod)
          ? body.paymentMethod
          : null;
    if (depositBaht > 0 && !paymentMethod) {
      return NextResponse.json({ error: "เลือกวิธีชำระ" }, { status: 400 });
    }

    const slipImageUrl =
      typeof body.slipImageUrl === "string" ? body.slipImageUrl.trim().slice(0, 512) : null;
    if (usedCarPaymentRequiresSlip(paymentMethod, depositBaht) && !slipImageUrl) {
      return NextResponse.json({ error: "แนบสลิปการโอน" }, { status: 400 });
    }
    if (
      slipImageUrl &&
      !slipImageUrl.startsWith("/uploads/used-car-showroom/") &&
      !slipImageUrl.startsWith("/uploads/")
    ) {
      return NextResponse.json({ error: "สลิปไม่ถูกต้อง" }, { status: 400 });
    }

    const note = typeof body.note === "string" ? body.note.trim().slice(0, 2000) || null : null;

    const row = await prisma.$transaction(async (tx) => {
      let customerId: string | null = null;
      const existingCustomer = await tx.usedCarCustomer.findFirst({
        where: { shopId: shop.id, phone: customerPhone },
        select: { id: true },
      });
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const createdCustomer = await tx.usedCarCustomer.create({
          data: {
            ownerUserId: shop.ownerUserId,
            trialSessionId: shop.trialSessionId,
            shopId: shop.id,
            fullName: customerName,
            phone: customerPhone,
          },
        });
        customerId = createdCustomer.id;
      }

      await tx.usedCarLead.create({
        data: {
          ownerUserId: shop.ownerUserId,
          trialSessionId: shop.trialSessionId,
          shopId: shop.id,
          customerId,
          vehicleId,
          fullName: customerName,
          phone: customerPhone,
          source: "WEB",
          status: "INTERESTED",
          note: note ?? `จองจากเว็บ · ${vehicle.brand} ${vehicle.model}`,
        },
      });

      const created = await tx.usedCarReservation.create({
        data: {
          ownerUserId: shop.ownerUserId,
          trialSessionId: shop.trialSessionId,
          shopId: shop.id,
          vehicleId,
          customerId,
          source: "WEB",
          customerName,
          customerPhone,
          depositBaht,
          paymentMethod: paymentMethod ?? "NONE",
          slipImageUrl,
          status: depositBaht > 0 ? "PAID" : "PENDING",
          note,
        },
        include: {
          vehicle: { select: { brand: true, model: true, year: true, coverImageUrl: true } },
        },
      });

      await tx.usedCarVehicle.update({
        where: { id: vehicleId },
        data: { status: "RESERVED" },
      });

      return created;
    });

    return NextResponse.json(
      {
        ok: true,
        reservation: mapUsedCarReservation(row),
        message:
          depositBaht > 0
            ? "จองสำเร็จ — รอทีมงานยืนยันสลิปและติดต่อกลับ"
            : "บันทึกความสนใจแล้ว — ทีมงานจะติดต่อกลับ",
      },
      { status: 201 },
    );
  } catch (e) {
    console.error("[used-car-showroom/public/portal/[slug]/reserve POST]", e);
    return NextResponse.json({ error: "จองไม่สำเร็จ" }, { status: 500 });
  }
}
