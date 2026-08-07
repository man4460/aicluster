import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { prisma } from "@/lib/prisma";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";
import {
  clampBahtPerPoint,
  clampPointsPerUnit,
  ensureBuildingPosLoyaltySettings,
  formatBuildingPosLoyaltyEarnRule,
  listBuildingPosLoyaltyRewards,
} from "@/systems/building-pos/lib/loyalty";

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  baht_per_point: z.number().int().min(1).max(1_000_000).optional(),
  points_per_unit: z.number().int().min(1).max(1000).optional(),
});

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const settings = await ensureBuildingPosLoyaltySettings(own.ownerId, scope.trialSessionId);
    const rewards = await listBuildingPosLoyaltyRewards(own.ownerId, scope.trialSessionId);
    return NextResponse.json({
      settings,
      rule_preview: formatBuildingPosLoyaltyEarnRule(settings.baht_per_point, settings.points_per_unit),
      rewards,
    });
  } catch (e) {
    console.error("[building-pos/session/loyalty GET]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
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

    await ensureBuildingPosLoyaltySettings(own.ownerId, scope.trialSessionId);
    const row = await prisma.buildingPosLoyaltySettings.update({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: own.ownerId,
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
      rule_preview: formatBuildingPosLoyaltyEarnRule(settings.baht_per_point, settings.points_per_unit),
    });
  } catch (e) {
    console.error("[building-pos/session/loyalty PATCH]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
