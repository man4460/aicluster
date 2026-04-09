import { bangkokYearCalendar } from "@/lib/dates/bangkok-calendar";
import { VillageAnnualClient } from "@/systems/village/components/VillageAnnualClient";

export default function VillageAnnualPage() {
  return <VillageAnnualClient initialYear={bangkokYearCalendar()} />;
}
