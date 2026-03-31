import { PageContainer } from "@/components/ui/page-container";
import { getSession } from "@/lib/auth/session";
import { VILLAGE_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { VillageLayoutChrome } from "@/systems/village/components/VillageLayoutChrome";
import { requireVillageSection } from "@/systems/village/lib/guard";

export default async function VillageLayout({ children }: { children: React.ReactNode }) {
  await requireVillageSection();
  const session = await getSession();
  const trial = session ? await getActiveTrialBanner(session.sub, VILLAGE_MODULE_SLUG) : null;

  return (
    <PageContainer>
      <VillageLayoutChrome trialExpiresAtIso={trial?.expiresAt.toISOString() ?? null}>
        {children}
      </VillageLayoutChrome>
    </PageContainer>
  );
}
