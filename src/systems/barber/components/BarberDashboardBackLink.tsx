import Link from "next/link";
import { barberDashboardBackLinkClass } from "@/systems/barber/components/barber-ui-tokens";

export function BarberDashboardBackLink() {
  return (
    <Link href="/dashboard/barber" className={barberDashboardBackLinkClass}>
      ← แดชบอร์ด
    </Link>
  );
}
