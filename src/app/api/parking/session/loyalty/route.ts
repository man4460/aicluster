import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getParkingOwnerContext } from "@/systems/parking/lib/parking-api-auth";
import {
  clampParkingBahtPerPoint,
  clampParkingPointsPerUnit,
  formatParkingLoyaltyRule,
} from "@/systems/parking/lib/loyalty-rule";
import { parkingLoyaltySettingsFromSite } from "@/systems/parking/lib/loyalty";

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  baht_per_point: z.number().int().min(1).max(1_000_000).optional(),
  points_per_unit: z.number().int().min(1).max(1000).optional(),
});

export async function GET() {
  const ctx = await getParkingOwnerContext();
  if (!ctx) return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  const settings = parkingLoyaltySettingsFromSite(ctx.site);
  return NextResponse.json({
    settings,
    rule_preview: formatParkingLoyaltyRule(settings.baht_per_point, settings.points_per_unit),
  });
}

export async function PATCH(req: Request) {
  const ctx = await getParkingOwnerContext();
  if (!ctx) return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const row = await prisma.parkingSite.update({
    where: { id: ctx.site.id },
    data: {
      ...(parsed.data.enabled !== undefined ? { loyaltyEnabled: parsed.data.enabled } : {}),
      ...(parsed.data.baht_per_point !== undefined
        ? { loyaltyBahtPerPoint: clampParkingBahtPerPoint(parsed.data.baht_per_point) }
        : {}),
      ...(parsed.data.points_per_unit !== undefined
        ? { loyaltyPointsPerUnit: clampParkingPointsPerUnit(parsed.data.points_per_unit) }
        : {}),
    },
  });
  const settings = parkingLoyaltySettingsFromSite(row);
  return NextResponse.json({
    settings,
    rule_preview: formatParkingLoyaltyRule(settings.baht_per_point, settings.points_per_unit),
  });
}
