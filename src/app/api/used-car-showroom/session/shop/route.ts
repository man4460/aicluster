import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { usedCarShowroomSessionContext } from "@/lib/used-car-showroom/session-context";
import { prisma } from "@/lib/prisma";
import {
  hashStaffDailyPin,
  normalizeStaffDailyPinInput,
  validateStaffDailyPinPlain,
} from "@/lib/modules/staff-daily-pin";
import { mapUsedCarShop } from "@/systems/used-car-showroom/lib/mappers";
import { parseUsedCarPortalPaymentMode } from "@/systems/used-car-showroom/lib/status";

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await usedCarShowroomSessionContext(own.ownerId);
    return NextResponse.json({ shop: mapUsedCarShop(shop) });
  } catch (e) {
    console.error("[used-car-showroom/session/shop GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop, scope } = await usedCarShowroomSessionContext(own.ownerId);
    const body = (await req.json()) as Record<string, unknown>;

    let slug = shop.slug;
    if (typeof body.slug === "string") {
      slug = body.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
      if (slug.length < 3) {
        return NextResponse.json({ error: "slug ต้องมีอย่างน้อย 3 ตัวอักษร" }, { status: 400 });
      }
      const taken = await prisma.usedCarShowroomShop.findFirst({
        where: { slug, trialSessionId: scope.trialSessionId, NOT: { id: shop.id } },
        select: { id: true },
      });
      if (taken) return NextResponse.json({ error: "slug นี้ถูกใช้แล้ว" }, { status: 409 });
    }

    const str = (k: string, max: number) =>
      typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : undefined;
    const nullable = (k: string, max: number) => {
      if (body[k] === null) return null;
      if (typeof body[k] === "string") return (body[k] as string).trim().slice(0, max) || null;
      return undefined;
    };

    const gallery = Array.isArray(body.portalGallery)
      ? JSON.stringify(
          body.portalGallery
            .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
            .map((u) => u.slice(0, 512))
            .slice(0, 40),
        )
      : undefined;

    let staffDailyPinHash: string | null | undefined = undefined;
    if (body.staffDailyPinClear === true) {
      staffDailyPinHash = null;
    } else if (body.staffDailyPin !== undefined) {
      const pin = normalizeStaffDailyPinInput(body.staffDailyPin);
      if (pin != null) {
        const pinErr = validateStaffDailyPinPlain(pin);
        if (pinErr) return NextResponse.json({ error: pinErr }, { status: 400 });
        staffDailyPinHash = await hashStaffDailyPin(pin);
      }
    }

    const updated = await prisma.usedCarShowroomShop.update({
      where: { id: shop.id },
      data: {
        slug,
        displayName: str("displayName", 200) ?? shop.displayName,
        logoUrl: nullable("logoUrl", 512),
        tagline: nullable("tagline", 300),
        address: body.address === null ? null : typeof body.address === "string" ? body.address : undefined,
        contactPhone: nullable("contactPhone", 32),
        contactLine: nullable("contactLine", 120),
        facebookUrl: nullable("facebookUrl", 512),
        mapUrl: nullable("mapUrl", 512),
        openTimeHm: nullable("openTimeHm", 5),
        closeTimeHm: nullable("closeTimeHm", 5),
        portalBannerUrl: nullable("portalBannerUrl", 512),
        portalGalleryJson: gallery,
        portalEnabled: typeof body.portalEnabled === "boolean" ? body.portalEnabled : undefined,
        portalBookingPaymentMode:
          body.portalBookingPaymentMode !== undefined
            ? parseUsedCarPortalPaymentMode(body.portalBookingPaymentMode)
            : undefined,
        depositAmountBaht:
          typeof body.depositAmountBaht === "number"
            ? Math.max(0, Math.round(body.depositAmountBaht))
            : undefined,
        promptPayPhone: nullable("promptPayPhone", 20),
        promptPayQrImageUrl: nullable("promptPayQrImageUrl", 512),
        bankName: nullable("bankName", 120),
        bankAccountNumber: nullable("bankAccountNumber", 32),
        bankAccountName: nullable("bankAccountName", 200),
        taxId: nullable("taxId", 30),
        slipPaperSize: str("slipPaperSize", 16),
        ...(staffDailyPinHash !== undefined ? { staffDailyPinHash } : {}),
      },
    });
    return NextResponse.json({ shop: mapUsedCarShop(updated) });
  } catch (e) {
    console.error("[used-car-showroom/session/shop PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
