import { PageContainer } from "@/components/ui/page-container";
import { getSession } from "@/lib/auth/session";
import { BARBER_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { BarberLayoutChrome } from "@/systems/barber/components/BarberLayoutChrome";
import { requireBarberSection } from "@/systems/barber/lib/guard";

export default async function BarberLayout({ children }: { children: React.ReactNode }) {
  await requireBarberSection();
  const session = await getSession();
  if (!session) return null;

  const trial = await getActiveTrialBanner(session.sub, BARBER_MODULE_SLUG);

  return (
    <PageContainer>
      <BarberLayoutChrome trialExpiresAtIso={trial?.expiresAt.toISOString() ?? null}>
        {children}
      </BarberLayoutChrome>
    </PageContainer>
  );
}
