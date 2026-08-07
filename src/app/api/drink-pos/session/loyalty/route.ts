import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";
import { withDrinkPosOwnerContext } from "@/systems/drink-pos/lib/api-auth";
import {
  clampBahtPerPoint,
  clampPointsPerUnit,
  ensureDrinkPosLoyaltySettings,
  formatDrinkPosLoyaltyEarnRule,
  listDrinkPosLoyaltyRewards,
} from "@/systems/drink-pos/lib/loyalty";

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  baht_per_point: z.number().int().min(1).max(1_000_000).optional(),
  points_per_unit: z.number().int().min(1).max(1000).optional(),
});

export async function GET() {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const scope = await getDrinkPosDataScope(auth.ctx.ownerUserId);
  const settings = await ensureDrinkPosLoyaltySettings(auth.ctx.ownerUserId, scope.trialSessionId);
  const rewards = await listDrinkPosLoyaltyRewards(auth.ctx.ownerUserId, scope.trialSessionId);
  return NextResponse.json({
    settings,
    rule_preview: formatDrinkPosLoyaltyEarnRule(settings.baht_per_point, settings.points_per_unit),
    rewards,
  });
}

export async function PATCH(req: Request) {
  const auth = await withDrinkPosOwnerContext();
  if (!auth.ok) return auth.res;
  const scope = await getDrinkPosDataScope(auth.ctx.ownerUserId);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่อัปเดต" }, { status: 400 });
  }

  await ensureDrinkPosLoyaltySettings(auth.ctx.ownerUserId, scope.trialSessionId);
  const row = await prisma.drinkPosLoyaltySettings.update({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: auth.ctx.ownerUserId,
        trialSessionId: scope.trialSessionId,
      },
    },
    data: {
      ...(parsed.data.enabled !== undefined ? { enabled: parsed.data.enabled } : {}),
      ...(parsed.data.baht_per_point !== undefined
        ? { bahtPerPoint: clampBahtPerPoint(parsed.data.baht_per_point) }
        : {}),
      ...(parsed.data.points_per_unit !== undefined
        ? { pointsPerUnit: clampPointsPerUnit(parsed.data.points_per_unit) }
        : {}),
    },
  });
  const settings = {
    enabled: row.enabled,
    baht_per_point: row.bahtPerPoint,
    points_per_unit: row.pointsPerUnit,
  };
  return NextResponse.json({
    settings,
    rule_preview: formatDrinkPosLoyaltyEarnRule(settings.baht_per_point, settings.points_per_unit),
  });
}
