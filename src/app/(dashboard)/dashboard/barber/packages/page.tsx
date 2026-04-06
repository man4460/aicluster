import { BarberPackagesClient } from "@/systems/barber/components/BarberPackagesClient";
import { barberPageStackClass } from "@/systems/barber/components/barber-ui-tokens";

export default function BarberPackagesPage() {
  return (
    <div className={barberPageStackClass}>
      <BarberPackagesClient />
    </div>
  );
}
