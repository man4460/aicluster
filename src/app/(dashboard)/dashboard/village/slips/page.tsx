import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { VillageSlipsClient } from "@/systems/village/components/VillageSlipsClient";

export default async function VillageSlipsPage() {
  const baseUrl = await getRequestBaseUrl();
  return <VillageSlipsClient baseUrl={baseUrl} />;
}
