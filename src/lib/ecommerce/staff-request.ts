import { prisma } from "@/lib/prisma";
import {
  resolvePermanentStaffLink,
  STAFF_LINK_PERMANENT_SESSION_ID,
  type PermanentStaffLinkContext,
} from "@/lib/modules/permanent-staff-link";

export type EcommerceStaffContext = PermanentStaffLinkContext;

/** ร้านออนไลน์ใช้สโคป prod เป็นหลัก */
export async function getEcommerceDataScope(ownerId: string): Promise<{ trialSessionId: string }> {
  const store = await prisma.ecommerceStore.findFirst({
    where: { ownerUserId: ownerId },
    orderBy: { updatedAt: "desc" },
    select: { trialSessionId: true },
  });
  return { trialSessionId: store?.trialSessionId?.trim() || STAFF_LINK_PERMANENT_SESSION_ID };
}

export async function resolveEcommerceStaffFromUrl(url: URL): Promise<EcommerceStaffContext | null> {
  const ownerId = url.searchParams.get("ownerId")?.trim() ?? "";
  const k = url.searchParams.get("k")?.trim() ?? "";
  const t = url.searchParams.get("t")?.trim() ?? "";
  return resolvePermanentStaffLink({
    ownerId,
    plainToken: k,
    urlTrialParam: t,
    findProdRow: () =>
      prisma.ecommerceStaffLink.findUnique({
        where: {
          ownerUserId_trialSessionId: {
            ownerUserId: ownerId,
            trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
          },
        },
        select: { tokenHash: true },
      }),
    findRowBySession: (sessionId) =>
      prisma.ecommerceStaffLink.findUnique({
        where: {
          ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId: sessionId },
        },
        select: { tokenHash: true },
      }),
    findAnyRows: () =>
      prisma.ecommerceStaffLink.findMany({
        where: { ownerUserId: ownerId },
        select: { tokenHash: true },
      }),
    liveDataScope: () => getEcommerceDataScope(ownerId),
  });
}
