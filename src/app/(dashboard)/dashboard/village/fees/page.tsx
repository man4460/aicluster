import { bangkokYearMonthYm } from "@/lib/dates/bangkok-calendar";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { VillageFeesClient } from "@/systems/village/components/VillageFeesClient";

export default async function VillageFeesPage() {
  const baseUrl = await getRequestBaseUrl();
  return <VillageFeesClient initialYm={bangkokYearMonthYm()} baseUrl={baseUrl} />;
}
