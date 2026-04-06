import { BarberPurchasesClient } from "@/systems/barber/components/BarberPurchasesClient";
import { barberPageStackClass } from "@/systems/barber/components/barber-ui-tokens";

export default function BarberPurchasesPage() {
  return (
    <div className={barberPageStackClass}>
      <BarberPurchasesClient />
    </div>
  );
}
