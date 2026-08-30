import { prisma } from "@/lib/prisma";
import {
  resolvePermanentStaffLink,
  STAFF_LINK_PERMANENT_SESSION_ID,
  type PermanentStaffLinkContext,
} from "@/lib/modules/permanent-staff-link";
import { getParkingDataScope } from "@/lib/trial/module-scopes";

export type ParkingStaffContext = PermanentStaffLinkContext;

export async function resolveParkingStaffFromUrl(url: URL): Promise<ParkingStaffContext | null> {
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const plainToken = url.searchParams.get("k")?.trim() ?? "";
  const urlTrialParam = url.searchParams.get("t")?.trim() ?? "";
  return resolvePermanentStaffLink({
    ownerId,
    plainToken,
    urlTrialParam,
    findProdRow: () =>
      prisma.parkingStaffLink.findUnique({
        where: {
          ownerUserId_trialSessionId: {
            ownerUserId: ownerId,
            trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
          },
        },
        select: { tokenHash: true },
      }),
    findRowBySession: (sessionId) =>
      prisma.parkingStaffLink.findUnique({
        where: {
          ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId: sessionId },
        },
        select: { tokenHash: true },
      }),
    findAnyRows: () =>
      prisma.parkingStaffLink.findMany({
        where: { ownerUserId: ownerId },
        select: { tokenHash: true },
      }),
    liveDataScope: () => getParkingDataScope(ownerId),
  });
}
