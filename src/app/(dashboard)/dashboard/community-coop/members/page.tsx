import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CommunityCoopMembersClient } from "@/systems/community-coop/components/CommunityCoopMembersClient";
import { requireCommunityCoopPage } from "@/systems/community-coop/lib/community-coop-page-auth";

export const metadata: Metadata = {
  title: "สมาชิก | สหกรณ์ชุมชน",
};

export default async function CommunityCoopMembersPage() {
  const { session, scope } = await requireCommunityCoopPage();
  const initial = await prisma.communityCoopAccount.findMany({
    where: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId, isActive: true },
    orderBy: [{ groupLabel: "asc" }, { memberCode: "asc" }],
    select: {
      id: true,
      memberCode: true,
      memberName: true,
      groupLabel: true,
      shareUnits: true,
      balanceSatang: true,
    },
  });
  return <CommunityCoopMembersClient initial={initial} />;
}
