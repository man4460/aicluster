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

const patchSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  pricing_model: pricingModelZod.optional(),
  base_price: z.number().int().min(0).max(9_999_999).optional(),
  duration_hours: durationHoursZod.optional(),
  description: z.string().max(800).optional().nullable(),
  is_active: z.boolean().optional(),
  image_url: z.union([z.string().max(500), z.null()]).optional(),
  basket_tiers: z.union([z.array(basketTierZod).max(24), z.null()]).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await laundryOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getLaundryDataScope(own.ownerId);

    const p = await ctx.params;
    const id = Number(p.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const detail =
        issue ?
          [issue.path.join(".") || "ฟิลด์", issue.message].filter(Boolean).join(": ")
        : "ข้อมูลไม่ถูกต้อง";
      return NextResponse.json({ error: detail }, { status: 400 });
    }

    const row = await prisma.laundryPackage.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!row) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    const updated = await prisma.laundryPackage.update({
      where: { id: row.id },
      data: {
        ...(parsed.data.name != null ? { name: parsed.data.name.trim() } : {}),
        ...(parsed.data.pricing_model != null ? { pricingModel: parsed.data.pricing_model } : {}),
        ...(parsed.data.base_price != null ? { basePrice: parsed.data.base_price } : {}),
        ...(parsed.data.duration_hours != null ?
          {
            durationHours: new Prisma.Decimal(String(roundLaundryDurationHours(parsed.data.duration_hours))),
          }
        : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description?.trim() ?? "" } : {}),
        ...(parsed.data.is_active != null ? { isActive: parsed.data.is_active } : {}),
        ...(parsed.data.image_url !== undefined ?
          {
            imageUrl:
              parsed.data.image_url === null || parsed.data.image_url.trim() === "" ?
                null
              : parsed.data.image_url.trim().slice(0, 500),
          }
        : {}),
        ...(parsed.data.basket_tiers !== undefined ?
          {
            basketTiers:
              parsed.data.basket_tiers === null || parsed.data.basket_tiers.length === 0 ?
                Prisma.DbNull
              : parsed.data.basket_tiers,
          }
        : {}),
      },
    });
    return NextResponse.json({
      package: {
        id: updated.id,
        name: updated.name,
        pricing_model: updated.pricingModel,
        base_price: updated.basePrice,
        duration_hours: Number(updated.durationHours),
        description: updated.description,
        is_active: updated.isActive,
        image_url: updated.imageUrl ?? null,
        basket_tiers: normalizeBasketTiers(updated.basketTiers),
      },
    });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/session/packages/[id] PATCH");
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await laundryOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getLaundryDataScope(own.ownerId);

    const p = await ctx.params;
    const id = Number(p.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "id ไม่ถูกต้อง" }, { status: 400 });

    const row = await prisma.laundryPackage.findFirst({
      where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    });
    if (!row) return NextResponse.json({ ok: false });
    await prisma.laundryPackage.delete({ where: { id: row.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/session/packages/[id] DELETE");
  }
}
