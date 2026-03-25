import { PageContainer } from "@/components/ui/page-container";
import { BarberLayoutChrome } from "@/systems/barber/components/BarberLayoutChrome";
import { requireBarberSection } from "@/systems/barber/lib/guard";

export default async function BarberLayout({ children }: { children: React.ReactNode }) {
  await requireBarberSection();

  return (
    <PageContainer>
      <BarberLayoutChrome>{children}</BarberLayoutChrome>
    </PageContainer>
  );
}
