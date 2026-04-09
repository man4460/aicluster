import { bangkokYearMonthYm } from "@/lib/dates/bangkok-calendar";
import { VillageFeesClient } from "@/systems/village/components/VillageFeesClient";

export default function VillageFeesPage() {
  return <VillageFeesClient initialYm={bangkokYearMonthYm()} />;
}
