import { PageHeader } from "@/components/ui/page-container";

import { BarberDashboardBackLink } from "@/systems/barber/components/BarberDashboardBackLink";

import { barberPageStackClass } from "@/systems/barber/components/barber-ui-tokens";

import { getSession } from "@/lib/auth/session";

import { BarberHistoryClient } from "@/systems/barber/components/BarberHistoryClient";



export default async function BarberHistoryPage() {

  const session = await getSession();

  if (!session) return null;



  return (

    <div className={barberPageStackClass}>

      <PageHeader
        compact
        title="ยอดขาย"
        description="ประวัติบริการ กราฟรายได้เทียบรายจ่าย"
        action={<BarberDashboardBackLink />}
      />

      <BarberHistoryClient />

    </div>

  );

}

