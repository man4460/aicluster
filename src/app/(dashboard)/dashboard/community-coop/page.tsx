import type { Metadata } from "next";
import { CommunityCoopDashboardClient } from "@/systems/community-coop/components/CommunityCoopDashboardClient";
import { buildCommunityCoopDashboardDto } from "@/systems/community-coop/lib/load-community-coop-dashboard";
import { requireCommunityCoopPage } from "@/systems/community-coop/lib/community-coop-page-auth";

export const metadata: Metadata = {
  title: "สหกรณ์ชุมชน | MAWELL",
};

export default async function CommunityCoopPage() {
  const { settings, session, scope } = await requireCommunityCoopPage();
  const initial = await buildCommunityCoopDashboardDto(settings, session.sub, scope.trialSessionId);
  return <CommunityCoopDashboardClient initial={initial} />;
}
