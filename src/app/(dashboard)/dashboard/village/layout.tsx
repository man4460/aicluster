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
  const trialExpiresLabel =
    trial == null
      ? null
      : trial.expiresAt.toLocaleString("th-TH", {
          timeZone: "Asia/Bangkok",
          dateStyle: "medium",
          timeStyle: "short",
        });

  return (
    <PageContainer>
      <VillageLayoutChrome trialExpiresLabel={trialExpiresLabel}>
        {children}
      </VillageLayoutChrome>
    </PageContainer>
  );
}
