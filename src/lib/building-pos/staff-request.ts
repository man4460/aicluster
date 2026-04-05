import { prisma } from "@/lib/prisma";
import { resolvePublicBuildingPosTrialSessionId } from "@/lib/building-pos/public-trial-scope";
import { verifyStaffToken } from "@/lib/building-pos/staff-token";

export type BuildingPosStaffContext = {
  ownerId: string;
  trialSessionId: string;
};

/**
 * ยืนยันโทเค็นพนักงานจาก query — ใช้กับ /api/building-pos/staff/*
 */
export async function resolveBuildingPosStaffFromUrl(url: URL): Promise<BuildingPosStaffContext | null> {
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const k = url.searchParams.get("k")?.trim() ?? "";
  const t = url.searchParams.get("t")?.trim() ?? "";
  if (!ownerId || !k) return null;
  const { trialSessionId } = await resolvePublicBuildingPosTrialSessionId(ownerId, t || null);
  const row = await prisma.buildingPosStaffLink.findUnique({
    where: {
      ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId },
    },
    select: { tokenHash: true },
  });
  if (!row?.tokenHash || !verifyStaffToken(k, row.tokenHash)) return null;
  return { ownerId, trialSessionId };
}

export function staffQuerySuffix(ctx: BuildingPosStaffContext, plainToken: string): string {
  const p = new URLSearchParams({
    ownerId: ctx.ownerId,
    t: ctx.trialSessionId,
    k: plainToken,
  });
  return p.toString();
}
