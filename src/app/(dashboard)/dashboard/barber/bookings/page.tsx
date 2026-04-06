import { bangkokDateKey } from "@/lib/time/bangkok";
import { BarberBookingsClient } from "@/systems/barber/components/BarberBookingsClient";
import { barberPageStackClass } from "@/systems/barber/components/barber-ui-tokens";

export default function BarberBookingsPage() {
  return (
    <div className={barberPageStackClass}>
      <BarberBookingsClient initialDateKey={bangkokDateKey()} />
    </div>
  );
}
