import { prisma } from "@/lib/prisma";
import {
  resolvePermanentStaffLink,
  STAFF_LINK_PERMANENT_SESSION_ID,
  type PermanentStaffLinkContext,
} from "@/lib/modules/permanent-staff-link";
import { getDrinkPosDataScope } from "@/lib/trial/module-scopes";

export type DrinkPosStaffContext = PermanentStaffLinkContext;

export async function resolveDrinkPosStaffFromUrl(url: URL): Promise<DrinkPosStaffContext | null> {
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const k = url.searchParams.get("k")?.trim() ?? "";
  const t = url.searchParams.get("t")?.trim() ?? "";
  return resolvePermanentStaffLink({
    ownerId,
    plainToken: k,
    urlTrialParam: t,
    findProdRow: () =>
      prisma.drinkPosStaffLink.findUnique({
        where: {
          ownerUserId_trialSessionId: {
            ownerUserId: ownerId,
            trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
          },
        },
        select: { tokenHash: true },
      }),
    findRowBySession: (sessionId) =>
      prisma.drinkPosStaffLink.findUnique({
        where: {
          ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId: sessionId },
        },
        select: { tokenHash: true },
      }),
    findAnyRows: () =>
      prisma.drinkPosStaffLink.findMany({
        where: { ownerUserId: ownerId },
        select: { tokenHash: true },
      }),
    liveDataScope: () => getDrinkPosDataScope(ownerId),
  });
}
