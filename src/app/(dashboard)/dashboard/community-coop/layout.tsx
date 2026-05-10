import { CommunityCoopShell } from "@/systems/community-coop/components/CommunityCoopShell";
import { requireCommunityCoopPage } from "@/systems/community-coop/lib/community-coop-page-auth";

export default async function CommunityCoopLayout({ children }: { children: React.ReactNode }) {
  const { settings } = await requireCommunityCoopPage();
  return <CommunityCoopShell siteName={settings.displayName}>{children}</CommunityCoopShell>;
}
