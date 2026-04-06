import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { BarberCostsClient } from "@/systems/barber/components/BarberCostsClient";

export default async function BarberCostsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const baseUrl = await getRequestBaseUrl();

  return <BarberCostsClient baseUrl={baseUrl} />;
}
