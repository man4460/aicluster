import { BarberStylistsClient } from "@/systems/barber/components/BarberStylistsClient";
import { barberPageStackClass } from "@/systems/barber/components/barber-ui-tokens";

export default function BarberStylistsPage() {
  return (
    <div className={barberPageStackClass}>
      <BarberStylistsClient />
    </div>
  );
}
