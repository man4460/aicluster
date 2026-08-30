import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext, assertSiteOwned } from "@/systems/parking/lib/parking-api-auth";
import type { ParkingPricingMode } from "@/systems/parking/parking-module-nav";
import { applyStaffDailyPinPatch } from "@/lib/modules/staff-daily-pin-store";

function mapSite(site: {
  id: number;
  name: string;
  pricingMode: ParkingPricingMode;
  hourlyRateBaht: { toString(): string } | number | null;
  dailyRateBaht: { toString(): string } | number | null;
  monthlyRateBaht?: { toString(): string } | number | null;
  note?: string;
  isActive?: boolean;
  loyaltyEnabled: boolean;
  loyaltyBahtPerPoint: number;
  loyaltyPointsPerUnit: number;
  bookingPaymentMode: "NONE" | "DEPOSIT" | "FULL";
  depositPercent: number | null;
  promptPayPhone: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  logoUrl: string | null;
  contactPhone: string | null;
  tagline: string | null;
  address: string | null;
  lineId: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  portalBannerUrl: string | null;
  portalGalleryJson: string;
  staffDailyPinHash: string | null;
}) {
  return {
    id: site.id,
    name: site.name,
    pricingMode: site.pricingMode,
    hourlyRateBaht: site.hourlyRateBaht != null ? Number(site.hourlyRateBaht) : null,
    dailyRateBaht: site.dailyRateBaht != null ? Number(site.dailyRateBaht) : null,
    monthlyRateBaht: site.monthlyRateBaht != null ? Number(site.monthlyRateBaht) : null,
    note: site.note ?? "",
    isActive: site.isActive ?? true,
    loyaltyEnabled: site.loyaltyEnabled,
    loyaltyBahtPerPoint: site.loyaltyBahtPerPoint,
    loyaltyPointsPerUnit: site.loyaltyPointsPerUnit,
    bookingPaymentMode: site.bookingPaymentMode,
    depositPercent: site.depositPercent,
    promptPayPhone: site.promptPayPhone,
    bankName: site.bankName,
    bankAccountNumber: site.bankAccountNumber,
    bankAccountName: site.bankAccountName,
    logoUrl: site.logoUrl,
    contactPhone: site.contactPhone,
    tagline: site.tagline,
    address: site.address,
    lineId: site.lineId,
    facebookUrl: site.facebookUrl,
    mapUrl: site.mapUrl,
    portalBannerUrl: site.portalBannerUrl,
    portalGalleryJson: site.portalGalleryJson,
    staffDailyPinSet: Boolean(site.staffDailyPinHash?.trim()),
  };
}

export async function GET(req: Request) {
  const ctx = await getParkingOwnerContext(req);
  if (!ctx) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }

  const sites = await prisma.parkingSite.findMany({
    where: { ownerUserId: ctx.ownerUserId, trialSessionId: ctx.trialSessionId },
    orderBy: { id: "asc" },
  });

  const withStats = await Promise.all(
    sites.map(async (site) => {
      const [spotCount, activeCount] = await Promise.all([
        prisma.parkingSpot.count({ where: { siteId: site.id } }),
        prisma.parkingSession.count({ where: { spot: { siteId: site.id }, status: "ACTIVE" } }),
      ]);
      return { ...mapSite(site), spotCount, activeSessions: activeCount };
    }),
  );

  return NextResponse.json({
    sites: withStats,
    site: mapSite(ctx.site),
    stats: {
      spotCount: withStats.reduce((n, s) => n + s.spotCount, 0),
      activeSessions: withStats.reduce((n, s) => n + s.activeSessions, 0),
    },
  });
}

function parseRate(v: unknown): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return undefined;
}

function parseMode(v: unknown): ParkingPricingMode | undefined {
  if (v === "HOURLY" || v === "DAILY" || v === "MONTHLY") return v;
  return undefined;
}

export async function POST(req: Request) {
  const ctx = await getParkingOwnerContext(req);
  if (!ctx || ctx.isStaff) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  if (!name) {
    return NextResponse.json({ error: "ระบุชื่อลานจอด" }, { status: 400 });
  }

  const pricingMode = parseMode(body.pricingMode) ?? "HOURLY";
  const hourly = parseRate(body.hourlyRateBaht) ?? 20;
  const daily = parseRate(body.dailyRateBaht) ?? 150;
  const monthly = parseRate(body.monthlyRateBaht) ?? 2500;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : "";

  if (pricingMode === "HOURLY" && (hourly == null || !Number.isFinite(hourly) || hourly <= 0)) {
    return NextResponse.json({ error: "โหมดรายชั่วโมงต้องระบุราคาต่อชั่วโมงมากกว่า 0" }, { status: 400 });
  }
  if (pricingMode === "DAILY" && (daily == null || !Number.isFinite(daily) || daily <= 0)) {
    return NextResponse.json({ error: "โหมดรายวันต้องระบุราคาต่อวันมากกว่า 0" }, { status: 400 });
  }
  if (pricingMode === "MONTHLY" && (monthly == null || !Number.isFinite(monthly) || monthly <= 0)) {
    return NextResponse.json({ error: "โหมดรายเดือนต้องระบุราคาต่อเดือนมากกว่า 0" }, { status: 400 });
  }

  try {
    const created = await prisma.parkingSite.create({
      data: {
        ownerUserId: ctx.ownerUserId,
        trialSessionId: ctx.trialSessionId,
        name,
        pricingMode,
        hourlyRateBaht: hourly,
        dailyRateBaht: daily,
        monthlyRateBaht: monthly,
        note,
        isActive: true,
      },
    });
    return NextResponse.json({ site: mapSite(created) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "ชื่อลานซ้ำ หรือสร้างไม่สำเร็จ" }, { status: 409 });
  }
}

export async function PATCH(req: Request) {
  const ctx = await getParkingOwnerContext(req);
  if (!ctx || ctx.isStaff) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  const siteIdRaw = body.siteId ?? body.id;
  const siteId =
    typeof siteIdRaw === "number" ? siteIdRaw : typeof siteIdRaw === "string" ? Number(siteIdRaw) : ctx.site.id;
  if (!Number.isInteger(siteId) || siteId < 1) {
    return NextResponse.json({ error: "ไม่พบลานจอด" }, { status: 404 });
  }

  const owned = await assertSiteOwned(siteId, ctx.ownerUserId, ctx.trialSessionId);
  if (!owned) {
    return NextResponse.json({ error: "ไม่พบลานจอด" }, { status: 404 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const pricingMode = parseMode(body.pricingMode);
  const hourly = parseRate(body.hourlyRateBaht);
  const daily = parseRate(body.dailyRateBaht);
  const monthly = parseRate(body.monthlyRateBaht);
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : undefined;
  const isActive = typeof body.isActive === "boolean" ? body.isActive : undefined;
  const bookingPaymentMode =
    body.bookingPaymentMode === "NONE" || body.bookingPaymentMode === "DEPOSIT" || body.bookingPaymentMode === "FULL"
      ? body.bookingPaymentMode
      : undefined;
  const depositPercent =
    body.depositPercent === null || body.depositPercent === ""
      ? null
      : typeof body.depositPercent === "number"
        ? Math.max(0, Math.min(100, Math.round(body.depositPercent)))
        : undefined;
  const paymentText = (key: string, max: number) =>
    typeof body[key] === "string" ? body[key].trim().slice(0, max) || null : undefined;
  const brandingText = paymentText;
  const portalGallery =
    body.portalGalleryJson !== undefined
      ? typeof body.portalGalleryJson === "string"
        ? body.portalGalleryJson
        : Array.isArray(body.portalGalleryJson)
          ? JSON.stringify(body.portalGalleryJson)
          : undefined
      : undefined;

  const nextMode = pricingMode ?? owned.pricingMode;
  const nextHourly =
    hourly !== undefined ? hourly : owned.hourlyRateBaht != null ? Number(owned.hourlyRateBaht) : null;
  const nextDaily =
    daily !== undefined ? daily : owned.dailyRateBaht != null ? Number(owned.dailyRateBaht) : null;
  const nextMonthly =
    monthly !== undefined
      ? monthly
      : (owned as { monthlyRateBaht?: { toString(): string } | null }).monthlyRateBaht != null
        ? Number((owned as { monthlyRateBaht: { toString(): string } }).monthlyRateBaht)
        : null;

  if (nextMode === "HOURLY" && (nextHourly == null || !Number.isFinite(nextHourly) || nextHourly <= 0)) {
    return NextResponse.json({ error: "โหมดรายชั่วโมงต้องระบุราคาต่อชั่วโมงมากกว่า 0" }, { status: 400 });
  }
  if (nextMode === "DAILY" && (nextDaily == null || !Number.isFinite(nextDaily) || nextDaily <= 0)) {
    return NextResponse.json({ error: "โหมดรายวันต้องระบุราคาต่อวันมากกว่า 0" }, { status: 400 });
  }
  if (nextMode === "MONTHLY" && (nextMonthly == null || !Number.isFinite(nextMonthly) || nextMonthly <= 0)) {
    return NextResponse.json({ error: "โหมดรายเดือนต้องระบุราคาต่อเดือนมากกว่า 0" }, { status: 400 });
  }

  const updated = await prisma.parkingSite.update({
    where: { id: siteId },
    data: {
      ...(name && name.length > 0 ? { name: name.slice(0, 120) } : {}),
      ...(pricingMode ? { pricingMode } : {}),
      ...(hourly !== undefined ? { hourlyRateBaht: hourly } : {}),
      ...(daily !== undefined ? { dailyRateBaht: daily } : {}),
      ...(monthly !== undefined ? { monthlyRateBaht: monthly } : {}),
      ...(note !== undefined ? { note } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(bookingPaymentMode ? { bookingPaymentMode } : {}),
      ...(depositPercent !== undefined ? { depositPercent } : {}),
      ...(paymentText("promptPayPhone", 32) !== undefined ? { promptPayPhone: paymentText("promptPayPhone", 32) } : {}),
      ...(paymentText("bankName", 120) !== undefined ? { bankName: paymentText("bankName", 120) } : {}),
      ...(paymentText("bankAccountNumber", 64) !== undefined
        ? { bankAccountNumber: paymentText("bankAccountNumber", 64) }
        : {}),
      ...(paymentText("bankAccountName", 160) !== undefined ? { bankAccountName: paymentText("bankAccountName", 160) } : {}),
      ...(brandingText("logoUrl", 512) !== undefined ? { logoUrl: brandingText("logoUrl", 512) } : {}),
      ...(brandingText("contactPhone", 32) !== undefined ? { contactPhone: brandingText("contactPhone", 32) } : {}),
      ...(brandingText("tagline", 300) !== undefined ? { tagline: brandingText("tagline", 300) } : {}),
      ...(brandingText("address", 500) !== undefined ? { address: brandingText("address", 500) } : {}),
      ...(brandingText("lineId", 120) !== undefined ? { lineId: brandingText("lineId", 120) } : {}),
      ...(brandingText("facebookUrl", 512) !== undefined ? { facebookUrl: brandingText("facebookUrl", 512) } : {}),
      ...(brandingText("mapUrl", 512) !== undefined ? { mapUrl: brandingText("mapUrl", 512) } : {}),
      ...(brandingText("portalBannerUrl", 512) !== undefined
        ? { portalBannerUrl: brandingText("portalBannerUrl", 512) }
        : {}),
      ...(portalGallery !== undefined ? { portalGalleryJson: portalGallery.slice(0, 6000) } : {}),
    },
  });

  const pinResult = await applyStaffDailyPinPatch({
    ownerId: ctx.ownerUserId,
    module: "parking",
    trialSessionId: ctx.trialSessionId,
    staffDailyPin: typeof body.staffDailyPin === "string" ? body.staffDailyPin : undefined,
    staffDailyPinClear: body.staffDailyPinClear === true,
  });
  if (!pinResult.ok) return NextResponse.json({ error: pinResult.error }, { status: 400 });

  const refreshed = await prisma.parkingSite.findUniqueOrThrow({ where: { id: updated.id } });
  return NextResponse.json({ site: mapSite(refreshed) });
}
