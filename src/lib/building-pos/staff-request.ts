import { prisma } from "@/lib/prisma";
import {
  resolvePermanentStaffLink,
  STAFF_LINK_PERMANENT_SESSION_ID,
  type PermanentStaffLinkContext,
} from "@/lib/modules/permanent-staff-link";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";

export type BuildingPosStaffContext = PermanentStaffLinkContext;

/**
 * ยืนยันโทเค็นพนักงานจาก query — ใช้กับ /api/building-pos/staff/*
 * ลิงก์ถาวร (prod) · ข้อมูลตามสโคปปัจจุบันของร้าน
 */
export async function resolveBuildingPosStaffFromUrl(url: URL): Promise<BuildingPosStaffContext | null> {
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const k = url.searchParams.get("k")?.trim() ?? "";
  const t = url.searchParams.get("t")?.trim() ?? "";
  return resolvePermanentStaffLink({
    ownerId,
    plainToken: k,
    urlTrialParam: t,
    findProdRow: () =>
      prisma.buildingPosStaffLink.findUnique({
        where: {
          ownerUserId_trialSessionId: {
            ownerUserId: ownerId,
            trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
          },
        },
        select: { tokenHash: true },
      }),
    findRowBySession: (sessionId) =>
      prisma.buildingPosStaffLink.findUnique({
        where: {
          ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId: sessionId },
        },
        select: { tokenHash: true },
      }),
    findAnyRows: () =>
      prisma.buildingPosStaffLink.findMany({
        where: { ownerUserId: ownerId },
        select: { tokenHash: true },
      }),
    liveDataScope: () => getBuildingPosDataScope(ownerId),
  });
}

export function staffQuerySuffix(ctx: BuildingPosStaffContext, plainToken: string): string {
  const p = new URLSearchParams({
    ownerId: ctx.ownerId,
    t: STAFF_LINK_PERMANENT_SESSION_ID,
    k: plainToken,
  });
  return p.toString();
}
