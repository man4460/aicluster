import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { laundryOwnerFromAuth } from "@/lib/laundry/api-owner";
import { jsonLaundrySessionError } from "@/lib/laundry/route-errors";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";

const pricingModelZod = z.enum(["PER_KG", "PER_ITEM", "FLAT"]);

const patchSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  pricing_model: pricingModelZod.optional(),
  base_price: z.number().int().min(0).max(9_999_999).optional(),
  duration_hours: z.number().int().min(1).max(720).optional(),
  description: z.string().max(800).optional().nullable(),
  is_active: z.boolean().optional(),
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
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

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
        ...(parsed.data.duration_hours != null ? { durationHours: parsed.data.duration_hours } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description?.trim() ?? "" } : {}),
        ...(parsed.data.is_active != null ? { isActive: parsed.data.is_active } : {}),
      },
    });
    return NextResponse.json({
      package: {
        id: updated.id,
        name: updated.name,
        pricing_model: updated.pricingModel,
        base_price: updated.basePrice,
        duration_hours: updated.durationHours,
        description: updated.description,
        is_active: updated.isActive,
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
