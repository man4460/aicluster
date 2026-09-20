import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { requireSession } from "@/lib/api-auth";
import { smartGuardTourOwnerFromAuth } from "@/lib/smart-guard-tour/api-owner";
import { smartGuardTourSessionContext } from "@/lib/smart-guard-tour/session-context";
import { prisma } from "@/lib/prisma";
import {
  hashStaffDailyPin,
  normalizeStaffDailyPinInput,
  validateStaffDailyPinPlain,
} from "@/lib/modules/staff-daily-pin";
import { mapSmartGuardShop } from "@/systems/smart-guard-tour/lib/mappers";

function parseShopCoord(raw: unknown): Prisma.Decimal | null | undefined {
  if (raw === null) return null;
  if (raw === undefined) return undefined;
  if (typeof raw === "number" && Number.isFinite(raw)) return new Prisma.Decimal(raw);
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw);
    if (Number.isFinite(n)) return new Prisma.Decimal(n);
  }
  return undefined;
}

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop } = await smartGuardTourSessionContext(own.ownerId);
    return NextResponse.json({ shop: mapSmartGuardShop(shop) });
  } catch (e) {
    console.error("[smart-guard-tour/session/shop GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop, scope } = await smartGuardTourSessionContext(own.ownerId);
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
      const taken = await prisma.smartGuardShop.findFirst({
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

    const updated = await prisma.smartGuardShop.update({
      where: { id: shop.id },
      data: {
        slug,
        displayName: str("displayName", 200) ?? shop.displayName,
        logoUrl: nullable("logoUrl", 512),
        address: body.address === null ? null : typeof body.address === "string" ? body.address : undefined,
        contactPhone: nullable("contactPhone", 32),
        emergencyPhone: nullable("emergencyPhone", 32),
        contactLine: nullable("contactLine", 120),
        lineNotifyToken: nullable("lineNotifyToken", 256),
        facebookUrl: nullable("facebookUrl", 512),
        mapUrl: nullable("mapUrl", 512),
        shopLat: parseShopCoord(body.shopLat),
        shopLng: parseShopCoord(body.shopLng),
        openTimeHm: nullable("openTimeHm", 5),
        closeTimeHm: nullable("closeTimeHm", 5),
        portalBannerUrl: nullable("portalBannerUrl", 512),
        portalGalleryJson: gallery,
        portalEnabled: typeof body.portalEnabled === "boolean" ? body.portalEnabled : undefined,
        portalSosEnabled: typeof body.portalSosEnabled === "boolean" ? body.portalSosEnabled : undefined,
        promptPayPhone: nullable("promptPayPhone", 20),
        promptPayQrImageUrl: nullable("promptPayQrImageUrl", 512),
        bankName: nullable("bankName", 120),
        bankAccountNumber: nullable("bankAccountNumber", 32),
        bankAccountName: nullable("bankAccountName", 200),
        taxId: nullable("taxId", 30),
        slipPaperSize: str("slipPaperSize", 16),
        ...(staffDailyPinHash !== undefined ? { staffDailyPinHash } : {}),
        ...(typeof body.attendanceLinkEnabled === "boolean"
          ? { attendanceLinkEnabled: body.attendanceLinkEnabled }
          : {}),
        ...(body.attendanceBranchId === null
          ? { attendanceBranchId: null }
          : typeof body.attendanceBranchId === "number" && Number.isInteger(body.attendanceBranchId)
            ? { attendanceBranchId: body.attendanceBranchId }
            : {}),
        ...(body.attendanceLocationId === null
          ? { attendanceLocationId: null }
          : typeof body.attendanceLocationId === "number" && Number.isInteger(body.attendanceLocationId)
            ? { attendanceLocationId: body.attendanceLocationId }
            : {}),
        ...(typeof body.attendanceRequireMatch === "boolean"
          ? { attendanceRequireMatch: body.attendanceRequireMatch }
          : {}),
        ...(typeof body.attendanceStaffSyncEnabled === "boolean"
          ? { attendanceStaffSyncEnabled: body.attendanceStaffSyncEnabled }
          : {}),
      },
    });
    return NextResponse.json({ shop: mapSmartGuardShop(updated) });
  } catch (e) {
    console.error("[smart-guard-tour/session/shop PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}
