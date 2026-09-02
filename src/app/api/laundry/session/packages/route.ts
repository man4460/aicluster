import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { laundryOwnerFromAuth } from "@/lib/laundry/api-owner";
import { jsonLaundrySessionError } from "@/lib/laundry/route-errors";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";
import {
  LAUNDRY_DURATION_HOURS_MAX,
  LAUNDRY_DURATION_HOURS_MIN,
  roundLaundryDurationHours,
} from "@/systems/laundry/laundry-duration-hours";
import { laundryRepairSampleImageUrl } from "@/systems/laundry/lib/portal-media";
import { notifyLaundryDashboard } from "@/systems/laundry/lib/dashboard-sse";

const pricingModelZod = z.enum(["PER_KG", "PER_ITEM", "FLAT"]);

const durationHoursZod = z.number().refine(
  (x) =>
    Number.isFinite(x) &&
    x + 1e-9 >= LAUNDRY_DURATION_HOURS_MIN &&
    x <= LAUNDRY_DURATION_HOURS_MAX + 1e-9,
  { message: `ชั่วโมงต้องอยู่ระหว่างประมาณ ${LAUNDRY_DURATION_HOURS_MIN.toFixed(3)}–${LAUNDRY_DURATION_HOURS_MAX}` },
);

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
  name: z.string().min(1).max(160),
  pricing_model: pricingModelZod,
  base_price: z.number().int().min(0).max(9_999_999),
  duration_hours: durationHoursZod,
  total_sessions: z.number().int().min(1).max(9999).optional(),
  description: z.string().max(800).optional().nullable(),
  is_active: z.boolean(),
  image_url: z.string().max(500).optional().nullable(),
  basket_tiers: z.array(basketTierZod).max(24).optional().nullable(),
});

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await laundryOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getLaundryDataScope(own.ownerId);

    const rows = await prisma.laundryPackage.findMany({
      where: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      orderBy: { id: "asc" },
    });
    return NextResponse.json({
      packages: rows.map((r) => ({
        id: r.id,
        name: r.name,
        pricing_model: r.pricingModel,
        base_price: r.basePrice,
        duration_hours: Number(r.durationHours),
        total_sessions: r.totalSessions,
        description: r.description,
        is_active: r.isActive,
        image_url: laundryRepairSampleImageUrl(r.imageUrl),
        basket_tiers: normalizeBasketTiers(r.basketTiers),
      })),
    });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/session/packages GET");
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await laundryOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getLaundryDataScope(own.ownerId);

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const detail =
        issue ?
          [issue.path.join(".") || "ฟิลด์", issue.message].filter(Boolean).join(": ")
        : "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json({ error: detail }, { status: 400 });
    }

    const img = parsed.data.image_url?.trim();
    const tiers =
      parsed.data.basket_tiers != null && parsed.data.basket_tiers.length > 0 ? parsed.data.basket_tiers : null;

    const dh = roundLaundryDurationHours(parsed.data.duration_hours);

    const row = await prisma.laundryPackage.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        name: parsed.data.name.trim(),
        pricingModel: parsed.data.pricing_model,
        basePrice: parsed.data.base_price,
        durationHours: new Prisma.Decimal(String(dh)),
        totalSessions: parsed.data.total_sessions ?? 1,
        description: parsed.data.description?.trim() ?? "",
        isActive: parsed.data.is_active,
        imageUrl: img && img.length > 0 ? img.slice(0, 500) : null,
        basketTiers: tiers ?? Prisma.DbNull,
      },
    });
    notifyLaundryDashboard(own.ownerId);
    return NextResponse.json({
      package: {
        id: row.id,
        name: row.name,
        pricing_model: row.pricingModel,
        base_price: row.basePrice,
        duration_hours: Number(row.durationHours),
        total_sessions: row.totalSessions,
        description: row.description,
        is_active: row.isActive,
        image_url: row.imageUrl ?? null,
        basket_tiers: normalizeBasketTiers(row.basketTiers),
      },
    });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/session/packages POST");
  }
}
