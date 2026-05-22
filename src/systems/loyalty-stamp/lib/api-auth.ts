import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getLoyaltyStampDataScope } from "@/lib/trial/module-scopes";
import { ensureLoyaltyStampProfile } from "@/systems/loyalty-stamp/lib/ensure-profile";

export async function getLoyaltyStampOwnerContext() {
  const session = await getSession();
  if (!session) return null;
  const scope = await getLoyaltyStampDataScope(session.sub);
  const profile = await ensureLoyaltyStampProfile(session.sub, scope.trialSessionId);
  return { userId: session.sub, scope, profile };
}

export async function assertLoyaltyStampMemberOwned(
  memberId: number,
  userId: string,
  trialSessionId: string,
) {
  return prisma.loyaltyStampMember.findFirst({
    where: { id: memberId, ownerUserId: userId, trialSessionId },
    include: { profile: true },
  });
}
