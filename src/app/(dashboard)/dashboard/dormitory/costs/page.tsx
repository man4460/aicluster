import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { DormCostsClient } from "@/systems/dormitory/components/DormCostsClient";

export default async function DormitoryCostsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const baseUrl = await getRequestBaseUrl();

  return <DormCostsClient baseUrl={baseUrl} />;
}
