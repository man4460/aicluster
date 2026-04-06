import { PageHeader } from "@/components/ui/page-container";
import { BarberCheckInClient } from "@/systems/barber/components/BarberCheckInClient";
import { BarberDashboardBackLink } from "@/systems/barber/components/BarberDashboardBackLink";
import { barberPageStackClass } from "@/systems/barber/components/barber-ui-tokens";

export default function BarberCheckInPage() {
  return (
    <div className={barberPageStackClass}>
      <PageHeader
        compact
        title="เช็กอิน"
        description="ค้นหาลูกค้า หักแพ็ก เงินสด ขายแพ็ก"
        action={<BarberDashboardBackLink />}
      />
      <BarberCheckInClient />
    </div>
  );
}
