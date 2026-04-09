import { bangkokYearCalendar } from "@/lib/dates/bangkok-calendar";
import { VillageReportsClient } from "@/systems/village/components/VillageReportsClient";

export default function VillageReportsPage() {
  return <VillageReportsClient initialYear={bangkokYearCalendar()} />;
}
