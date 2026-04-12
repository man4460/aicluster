import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { VillageCostsClient } from "@/systems/village/components/VillageCostsClient";

export default async function VillageCostsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const baseUrl = await getRequestBaseUrl();

  return <VillageCostsClient baseUrl={baseUrl} />;
}
