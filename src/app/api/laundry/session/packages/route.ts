import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { laundryOwnerFromAuth } from "@/lib/laundry/api-owner";
import { jsonLaundrySessionError } from "@/lib/laundry/route-errors";
import { getLaundryDataScope } from "@/lib/trial/module-scopes";

const pricingModelZod = z.enum(["PER_KG", "PER_ITEM", "FLAT"]);

const postSchema = z.object({
  name: z.string().min(1).max(160),
  pricing_model: pricingModelZod,
  base_price: z.number().int().min(0).max(9_999_999),
  duration_hours: z.number().int().min(1).max(720),
  description: z.string().max(800).optional().nullable(),
  is_active: z.boolean(),
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
        duration_hours: r.durationHours,
        description: r.description,
        is_active: r.isActive,
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
    if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

    const row = await prisma.laundryPackage.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        name: parsed.data.name.trim(),
        pricingModel: parsed.data.pricing_model,
        basePrice: parsed.data.base_price,
        durationHours: parsed.data.duration_hours,
        description: parsed.data.description?.trim() ?? "",
        isActive: parsed.data.is_active,
      },
    });
    return NextResponse.json({
      package: {
        id: row.id,
        name: row.name,
        pricing_model: row.pricingModel,
        base_price: row.basePrice,
        duration_hours: row.durationHours,
        description: row.description,
        is_active: row.isActive,
      },
    });
  } catch (e) {
    return jsonLaundrySessionError(e, "laundry/session/packages POST");
  }
}
