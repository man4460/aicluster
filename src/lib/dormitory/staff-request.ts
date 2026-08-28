import { prisma } from "@/lib/prisma";
import {
  resolvePermanentStaffLink,
  STAFF_LINK_PERMANENT_SESSION_ID,
  type PermanentStaffLinkContext,
} from "@/lib/modules/permanent-staff-link";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";

export type DormitoryStaffContext = PermanentStaffLinkContext;

export async function resolveDormitoryStaffFromUrl(url: URL): Promise<DormitoryStaffContext | null> {
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const k = url.searchParams.get("k")?.trim() ?? "";
  const t = url.searchParams.get("t")?.trim() ?? "";
  return resolvePermanentStaffLink({
    ownerId,
    plainToken: k,
    urlTrialParam: t,
    findProdRow: () =>
      prisma.dormitoryStaffLink.findUnique({
        where: {
          ownerUserId_trialSessionId: {
            ownerUserId: ownerId,
            trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
          },
        },
        select: { tokenHash: true },
      }),
    findRowBySession: (sessionId) =>
      prisma.dormitoryStaffLink.findUnique({
        where: {
          ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId: sessionId },
        },
        select: { tokenHash: true },
      }),
    findAnyRows: () =>
      prisma.dormitoryStaffLink.findMany({
        where: { ownerUserId: ownerId },
        select: { tokenHash: true },
      }),
    liveDataScope: () => getDormitoryDataScope(ownerId),
  });
}
