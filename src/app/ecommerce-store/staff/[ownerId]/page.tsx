import { notFound } from "next/navigation";
import { getEcommerceDataScope } from "@/lib/ecommerce/staff-request";
import { EcommerceStaffClient } from "@/systems/ecommerce-store/EcommerceStaffClient";

export default async function EcommerceStoreStaffPage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string; k?: string }>;
}) {
  const route = await params;
  const query = await searchParams;
  const ownerId = route.ownerId?.trim() ?? "";
  const staffKey = query.k?.trim() ?? "";
  if (!ownerId || ownerId.length < 10 || !staffKey) notFound();
  const scope = await getEcommerceDataScope(ownerId);
  return (
    <EcommerceStaffClient
      ownerId={ownerId}
      trialSessionId={query.t?.trim() || scope.trialSessionId}
      staffKey={staffKey}
    />
  );
}
