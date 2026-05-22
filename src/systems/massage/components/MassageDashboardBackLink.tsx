import Link from "next/link";
import { massageDashboardBackLinkClass } from "@/systems/massage/components/massage-ui-tokens";

export function MassageDashboardBackLink() {
  return (
    <Link href="/dashboard/massage" className={massageDashboardBackLinkClass}>
      ← แดชบอร์ด
    </Link>
  );
}
